"""
Fetches real estate transactions for Atlit (עתלית) from nadlan.gov.il.
Uses Playwright to open the settlement page in a real browser so that
reCAPTCHA passes automatically, then intercepts the /deal-data API response.

Usage:
    pip install playwright
    python -m playwright install chromium
    python fetch_data.py
"""

import asyncio
import base64
import gzip
import json
import os
from datetime import datetime

from playwright.async_api import async_playwright

SETTLEMENT_ID = 53          # עתלית
MIN_AREA_SQM = 20
MAX_AREA_SQM = 500
TIMEOUT_S = 30

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "deals.json")


async def _fetch_raw() -> list:
    raw_items = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        async def handle_response(response):
            if "deal-data" not in response.url:
                return
            if response.status != 200:
                return
            try:
                body = await response.body()
                decoded = gzip.decompress(base64.b64decode(body.decode()))
                data = json.loads(decoded)
                items = data.get("data", {}).get("items", [])
                if items:
                    raw_items.extend(items)
                    total = data.get("data", {}).get("total_rows", 0)
                    print(f"Intercepted deal-data: {len(items)} items (total on server: {total})")
            except Exception as e:
                print(f"Response decode error: {e}")

        page.on("response", handle_response)

        url = f"https://www.nadlan.gov.il/?view=settlement&id={SETTLEMENT_ID}"
        print(f"Opening {url} ...")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        print(f"Waiting up to {TIMEOUT_S}s for deal data...")
        for _ in range(TIMEOUT_S):
            await asyncio.sleep(1)
            if raw_items:
                break

        await browser.close()

    return raw_items


def _coerce_float(value) -> float | None:
    if value is None or value == "" or value == 0:
        return None
    try:
        return float(str(value).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _process(raw_deals: list) -> list:
    processed = []
    for deal in raw_deals:
        area = _coerce_float(deal.get("assetArea"))
        price = _coerce_float(deal.get("dealAmount"))
        date_str = (deal.get("dealDate") or "").split("T")[0] or None

        area_valid = area is not None and MIN_AREA_SQM <= area <= MAX_AREA_SQM
        price_per_sqm = (
            round(price / area) if (area_valid and price and price > 0) else None
        )
        if deal.get("priceSM") and not price_per_sqm:
            price_per_sqm = round(deal["priceSM"])

        rooms = _coerce_float(deal.get("roomNum"))
        floor = deal.get("floor")  # string in new API e.g. "3", "מרתף קרקע *"

        processed.append({
            "date": date_str,
            "address": deal.get("address") or "",
            "type": deal.get("dealNature"),
            "rooms": rooms,
            "floor": floor,
            "area": round(area, 1) if area_valid else None,
            "price": round(price) if price else None,
            "pricePerSqm": price_per_sqm,
            "city": "עתלית",
            "newProject": None,
        })

    processed.sort(key=lambda d: d.get("date") or "", reverse=True)
    return processed


def _merge(existing: list, fresh: list) -> list:
    index: dict[tuple, int] = {}
    merged = list(existing)
    for i, d in enumerate(merged):
        index[(d["address"], d["price"], d["area"])] = i

    added = 0
    for d in fresh:
        key = (d["address"], d["price"], d["area"])
        if key in index:
            if not merged[index[key]]["type"] and d["type"]:
                merged[index[key]] = d
        else:
            index[key] = len(merged)
            merged.append(d)
            added += 1

    merged.sort(key=lambda d: d.get("date") or "", reverse=True)
    print(f"Merged: {added} new deal(s) added, {len(merged)} total stored.")
    return merged


def main():
    existing: list = []
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, encoding="utf-8") as f:
            existing = json.load(f).get("deals", [])
        print(f"Loaded {len(existing)} existing deals from {OUTPUT_PATH}")

    raw = asyncio.run(_fetch_raw())
    print(f"Total raw deals fetched: {len(raw)}")

    if not raw:
        print("No deals captured — browser may have been blocked by reCAPTCHA.")
        return

    fresh = _process(raw)
    deals = _merge(existing, fresh)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    output = {
        "lastUpdated": datetime.now().isoformat(),
        "totalStored": len(deals),
        "deals": deals,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

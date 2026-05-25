"""
Fetches real estate transactions for Atlit (עתלית) from nadlan.gov.il REST API.
Writes the last 50 deals (sorted by date, newest first) to data/deals.json.

Usage:
    pip install requests
    python fetch_data.py
"""

import json
import os
import time
from datetime import datetime

import requests

BASE_URL = "https://www.nadlan.gov.il/Nadlan.REST"
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "deals.json")
CITY_NAME = "עתלית"
MAX_DEALS = 50
# Area sanity range in sqm: filter out storage rooms, parking, land, and huge commercial
MIN_AREA_SQM = 20
MAX_AREA_SQM = 500

SESSION_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.nadlan.gov.il/",
    "Origin": "https://www.nadlan.gov.il",
}


def make_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(SESSION_HEADERS)
    # Warm up session / get cookies
    try:
        session.get("https://www.nadlan.gov.il/", timeout=15)
    except Exception:
        pass
    return session


def get_city_id(session: requests.Session) -> str:
    print(f"Fetching city list to find '{CITY_NAME}'...")
    resp = session.get(
        f"{BASE_URL}/Main/GetCitysList",
        params={"nb": "true", "st": "true"},
        timeout=30,
    )
    resp.raise_for_status()
    cities = resp.json()

    # The API may return a list or a dict with a nested list
    if isinstance(cities, dict):
        cities = cities.get("Data", cities.get("data", cities.get("Results", [])))

    for city in cities:
        name = (
            city.get("SETTELMENT_NAME")
            or city.get("settlementName")
            or city.get("cityName")
            or city.get("CityName")
            or ""
        )
        if CITY_NAME in str(name):
            city_id = (
                city.get("SETTELMENT_ID")
                or city.get("settlementId")
                or city.get("cityId")
                or city.get("CityId")
            )
            print(f"Found city ID: {city_id} for '{name}'")
            return str(city_id)

    raise ValueError(f"City '{CITY_NAME}' not found in city list. Got {len(cities)} cities.")


def fetch_all_deals(session: requests.Session, city_id: str) -> list:
    all_deals = []
    page = 1
    while True:
        print(f"  Fetching page {page}...")
        resp = session.post(
            f"{BASE_URL}/Main/GetAssestAndDeals",
            json={
                "ObjectID": city_id,
                "CurrentLavel": 2,   # intentional typo in the original API
                "ObjectKey": "UNIQ_ID",
                "ObjectIDType": "text",
                "PageNo": page,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        results = data.get("AllResults") or data.get("allResults") or []
        all_deals.extend(results)
        print(f"    Got {len(results)} deals (total so far: {len(all_deals)})")

        is_last = data.get("IsLastPage") or data.get("isLastPage") or not results
        if is_last:
            break
        page += 1
        time.sleep(0.5)  # be gentle with the API

    return all_deals


def coerce_float(value) -> float | None:
    if value is None or value == "" or value == 0:
        return None
    try:
        return float(str(value).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def pick(deal: dict, *keys):
    """Return the first non-empty value found among the given keys."""
    for key in keys:
        v = deal.get(key)
        if v is not None and v != "" and v != 0:
            return v
    return None


def parse_date(raw: str | None) -> str | None:
    if not raw:
        return None
    try:
        # ISO format: "2024-03-15T00:00:00" or "2024-03-15"
        return raw.split("T")[0]
    except Exception:
        return str(raw)


def process_deals(raw_deals: list) -> list:
    processed = []
    for deal in raw_deals:
        area = coerce_float(pick(deal, "assetArea", "ASSETAREA", "AssetArea"))
        price = coerce_float(pick(deal, "dealAmount", "DEALAMOUNT", "DealAmount"))
        date_str = parse_date(
            pick(deal, "dealDate", "DEALDATE", "DealDate", "DEALDATETIME", "dealDateTime")
        )

        area_valid = area is not None and MIN_AREA_SQM <= area <= MAX_AREA_SQM
        price_per_sqm = (
            round(price / area) if (area_valid and price and price > 0) else None
        )

        rooms_raw = pick(deal, "assetRoomNum", "ASSETROOMNUM", "AssetRoomNum")
        try:
            rooms = float(rooms_raw) if rooms_raw is not None else None
        except (ValueError, TypeError):
            rooms = None

        floor_raw = pick(deal, "floorNumber", "FLOORNUMBER", "FloorNumber")
        try:
            floor = int(float(str(floor_raw))) if floor_raw is not None else None
        except (ValueError, TypeError):
            floor = None

        processed.append(
            {
                "date": date_str,
                "address": (
                    pick(deal, "FULLADRESS", "DISPLAYADRESS", "fullAddress", "streetName")
                    or ""
                ),
                "type": pick(
                    deal,
                    "propertyTypeDescription",
                    "PROPERTYTYPEDESCRIPTION",
                    "PropertyTypeDescription",
                ),
                "rooms": rooms,
                "floor": floor,
                "area": round(area, 1) if area_valid else None,
                "price": round(price) if price else None,
                "pricePerSqm": price_per_sqm,
                "city": pick(deal, "settlementNameHeb", "SETTELMENT_NAME") or CITY_NAME,
                "newProject": pick(deal, "NEWPROJECTTEXT", "PROJECTNAME", "newProjectText"),
            }
        )

    def sort_key(d):
        raw = d.get("date") or ""
        try:
            return datetime.strptime(raw, "%Y-%m-%d")
        except Exception:
            return datetime.min

    processed.sort(key=sort_key, reverse=True)
    return processed[:MAX_DEALS]


def main():
    session = make_session()

    city_id = get_city_id(session)
    print(f"Fetching deals for Atlit (city_id={city_id})...")
    raw = fetch_all_deals(session, city_id)
    print(f"Total raw deals fetched: {len(raw)}")

    deals = process_deals(raw)
    print(f"Processed deals (after filter & sort): {len(deals)}")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    output = {
        "lastUpdated": datetime.now().isoformat(),
        "totalRaw": len(raw),
        "deals": deals,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

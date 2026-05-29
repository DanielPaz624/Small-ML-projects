"""
Local sync server for the Atlit real estate tracker.

Run this on your machine (in Israel) to enable the Sync button:
    pip install playwright
    python -m playwright install chromium
    python atlit-real-estate/sync_server.py

Keep the terminal open while using the website.
"""

import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8765
DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(DIR)
FETCH_SCRIPT = os.path.join(DIR, "fetch_data.py")


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/sync":
            self.send_response(404)
            self.end_headers()
            return

        print("[sync] Fetching data from nadlan.gov.il...")
        result = subprocess.run(
            [sys.executable, FETCH_SCRIPT],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )

        if result.returncode != 0:
            print("[sync] fetch_data.py failed:\n", result.stderr)
            self._respond(500, {"error": result.stderr})
            return

        print(result.stdout)
        print("[sync] Pushing to GitHub...")

        data_file = os.path.join(DIR, "data", "deals.json")
        git_cmds = [
            ["git", "-C", REPO_ROOT, "add", data_file],
            ["git", "-C", REPO_ROOT, "commit", "-m", "Update Atlit real estate deals"],
            ["git", "-C", REPO_ROOT, "push"],
        ]
        for cmd in git_cmds:
            r = subprocess.run(cmd, capture_output=True, text=True)
            combined = r.stdout + r.stderr
            if r.returncode != 0 and "nothing to commit" not in combined:
                print("[sync] git error:", r.stderr)
                self._respond(500, {"error": r.stderr})
                return

        print("[sync] Done.")
        self._respond(200, {"ok": True, "output": result.stdout})

    def _respond(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass  # silence default logging


print(f"Atlit sync server running on http://localhost:{PORT}")
print("Keep this terminal open. Press Ctrl+C to stop.")
HTTPServer(("localhost", PORT), Handler).serve_forever()

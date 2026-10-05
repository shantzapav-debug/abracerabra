#!/usr/bin/env python3
"""
Export queued RFQ leads for the Google Sheets Leads tab.

This script does NOT call Google APIs. The box has no Sheets OAuth for Python.
Happy path:

  1. POST /api/quote appends a line to data/sheets_outbox.jsonl
  2. Run this script to print flush instructions and/or write data/leads_export.csv
  3. Grok Bot / Website Builder flushes the outbox to Sheets via the Sheets MCP
     (spreadsheet id in sheets_config.json)

Usage:
  python sync_leads_to_sheets.py            # instructions + write CSV from outbox
  python sync_leads_to_sheets.py --csv-only # CSV only
  python sync_leads_to_sheets.py --from-leads  # rebuild CSV from leads.json
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTBOX_PATH = DATA_DIR / "sheets_outbox.jsonl"
LEADS_PATH = DATA_DIR / "leads.json"
EXPORT_PATH = DATA_DIR / "leads_export.csv"
CONFIG_PATH = BASE_DIR / "sheets_config.json"

LEADS_COLUMNS = [
    "lead_id",
    "ref",
    "created_at",
    "status",
    "name",
    "country",
    "state",
    "city",
    "email",
    "mobile",
    "cart_json",
]


def load_config() -> dict:
    if CONFIG_PATH.exists():
        with CONFIG_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def read_outbox() -> list[dict]:
    if not OUTBOX_PATH.exists():
        return []
    rows: list[dict] = []
    with OUTBOX_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def leads_json_to_rows() -> list[dict]:
    if not LEADS_PATH.exists():
        return []
    with LEADS_PATH.open("r", encoding="utf-8") as f:
        leads = json.load(f)
    if not isinstance(leads, list):
        return []
    rows = []
    for lead in leads:
        rows.append(
            {
                "lead_id": lead.get("lead_id", ""),
                "ref": lead.get("ref", ""),
                "created_at": lead.get("created_at", ""),
                "status": lead.get("status", "new"),
                "name": lead.get("name", ""),
                "country": lead.get("country", ""),
                "state": lead.get("state", ""),
                "city": lead.get("city", ""),
                "email": lead.get("email", ""),
                "mobile": lead.get("mobile", ""),
                "cart_json": json.dumps(lead.get("cart") or [], ensure_ascii=False),
            }
        )
    return rows


def write_csv(rows: list[dict], path: Path = EXPORT_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=LEADS_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({col: row.get(col, "") for col in LEADS_COLUMNS})
    return path


def print_instructions(rows: list[dict], config: dict) -> None:
    sid = config.get("spreadsheetId", "<spreadsheetId from sheets_config.json>")
    url = config.get("spreadsheetUrl", "")
    tab = (config.get("tabs") or {}).get("Leads", "Leads")
    print("=" * 60)
    print("Abracerabra — Leads → Google Sheets (no Python OAuth)")
    print("=" * 60)
    print(f"Spreadsheet id : {sid}")
    if url:
        print(f"Spreadsheet URL: {url}")
    print(f"Tab            : {tab}")
    print(f"Outbox file    : {OUTBOX_PATH}")
    print(f"Queued rows    : {len(rows)}")
    print()
    print("How flush works:")
    print("  • FastAPI never calls Google — it only appends sheets_outbox.jsonl")
    print("  • Grok Bot / Website Builder reads the outbox and uses Sheets MCP")
    print("    append_rows on the Leads tab with columns:")
    print("    " + ", ".join(LEADS_COLUMNS))
    print()
    print("Manual / MCP flush example (agent-side, not this script):")
    print(f'  append_rows(spreadsheetId="{sid}", sheet="{tab}", values=[...])')
    print()
    print("Local CSV export (importable if you paste into Sheets by hand):")
    print(f"  {EXPORT_PATH}")
    print()
    if rows:
        print("Sample outbox row (first):")
        print(json.dumps(rows[0], indent=2, ensure_ascii=False))
    else:
        print("Outbox is empty — POST /api/quote to enqueue a lead.")
    print("=" * 60)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--csv-only",
        action="store_true",
        help="Write CSV only; skip printed instructions",
    )
    parser.add_argument(
        "--from-leads",
        action="store_true",
        help="Build CSV from data/leads.json instead of the outbox",
    )
    args = parser.parse_args()

    config = load_config()
    rows = leads_json_to_rows() if args.from_leads else read_outbox()
    path = write_csv(rows)
    if not args.csv_only:
        print_instructions(rows, config)
    print(f"Wrote {len(rows)} row(s) → {path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

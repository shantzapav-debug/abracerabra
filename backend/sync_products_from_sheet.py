#!/usr/bin/env python3
"""Apply Products sheet rows into src/data/products.json (and refresh products_sheet_rows.json).

No Google OAuth — Website Builder / Grok Bot reads the Products tab via Sheets MCP,
writes backend/data/products_sheet_rows.json as a list-of-lists (header + rows), then runs:

  python sync_products_from_sheet.py

Or pass a path: python sync_products_from_sheet.py path/to/rows.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROWS_DEFAULT = BASE / "data" / "products_sheet_rows.json"
CATALOG = BASE.parent / "src" / "data" / "products.json"

NUM_INT = {"moq", "lotSize"}
NUM_FLOAT = {"indicativePrice"}


def coerce(key: str, value):
    if value is None or value == "":
        return value
    if key in NUM_INT:
        return int(float(value))
    if key in NUM_FLOAT:
        return float(value)
    return value


def rows_to_products(rows: list) -> list[dict]:
    if not rows:
        raise SystemExit("empty products_sheet_rows")
    headers = [str(h) for h in rows[0]]
    products = []
    for raw in rows[1:]:
        if not raw or not raw[0]:
            continue
        padded = list(raw) + [""] * (len(headers) - len(raw))
        item = {h: coerce(h, padded[i]) for i, h in enumerate(headers)}
        products.append(item)
    return products


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROWS_DEFAULT
    rows = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise SystemExit("expected list-of-lists JSON")
    products = rows_to_products(rows)
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    catalog["products"] = products
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    ROWS_DEFAULT.parent.mkdir(parents=True, exist_ok=True)
    ROWS_DEFAULT.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {CATALOG} with {len(products)} products from {path}")


if __name__ == "__main__":
    main()

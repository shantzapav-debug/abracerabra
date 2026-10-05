"""
Abracerabra FastAPI backend stub.
Catalog from ../src/data/products.json; leads/logistics in local JSON files.
Successful quotes also enqueue a row in data/sheets_outbox.jsonl for Sheets flush
(via Grok Bot / Website Builder MCP — no Google APIs from Python).
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

BASE_DIR = Path(__file__).resolve().parent
PRODUCTS_PATH = BASE_DIR.parent / "src" / "data" / "products.json"
DATA_DIR = BASE_DIR / "data"
LEADS_PATH = DATA_DIR / "leads.json"
LOGISTICS_PATH = DATA_DIR / "logistics.json"
SHEETS_OUTBOX_PATH = DATA_DIR / "sheets_outbox.jsonl"

DATA_DIR.mkdir(parents=True, exist_ok=True)

_catalog_cache: Optional[dict[str, Any]] = None

app = FastAPI(title="Abracerabra API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def _append_sheets_outbox(row: dict[str, Any]) -> None:
    """Append one JSON line ready for Leads tab flush (no remote call)."""
    SHEETS_OUTBOX_PATH.parent.mkdir(parents=True, exist_ok=True)
    with SHEETS_OUTBOX_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def lead_to_sheets_row(lead: dict[str, Any], status: str = "new") -> dict[str, Any]:
    """Flatten a lead into Leads-tab columns for outbox / CSV export."""
    return {
        "lead_id": lead.get("lead_id", ""),
        "ref": lead.get("ref", ""),
        "created_at": lead.get("created_at", ""),
        "status": status,
        "name": lead.get("name", ""),
        "country": lead.get("country", ""),
        "state": lead.get("state", ""),
        "city": lead.get("city", ""),
        "email": lead.get("email", ""),
        "mobile": lead.get("mobile", ""),
        "cart_json": json.dumps(lead.get("cart") or [], ensure_ascii=False),
    }


def load_catalog() -> dict[str, Any]:
    global _catalog_cache
    if _catalog_cache is None:
        if not PRODUCTS_PATH.exists():
            raise HTTPException(status_code=500, detail=f"Catalog missing: {PRODUCTS_PATH}")
        with PRODUCTS_PATH.open("r", encoding="utf-8") as f:
            _catalog_cache = json.load(f)
    return _catalog_cache


def product_index() -> dict[str, dict[str, Any]]:
    catalog = load_catalog()
    return {p["id"]: p for p in catalog.get("products", [])}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CartLine(BaseModel):
    product_id: str
    qty: int = Field(..., ge=1)

    @field_validator("product_id", mode="before")
    @classmethod
    def coerce_product_id(cls, v: Any) -> str:
        return str(v).strip()


class QuoteRequest(BaseModel):
    name: str
    country: str
    state: str
    city: str
    email: str
    mobile: str
    cart: list[CartLine]

    @field_validator("name", "country", "state", "city", "email", "mobile", mode="before")
    @classmethod
    def strip_required(cls, v: Any) -> str:
        if v is None:
            raise ValueError("required")
        s = str(v).strip()
        if not s:
            raise ValueError("required")
        return s

    @field_validator("cart")
    @classmethod
    def cart_not_empty(cls, v: list[CartLine]) -> list[CartLine]:
        if not v:
            raise ValueError("cart must not be empty")
        return v


class LogisticsRequest(BaseModel):
    lead_id: str
    address: str
    landmark: str = ""
    location: str = ""
    mode_of_transport: str

    @field_validator("lead_id", "address", "mode_of_transport", mode="before")
    @classmethod
    def strip_required(cls, v: Any) -> str:
        if v is None:
            raise ValueError("required")
        s = str(v).strip()
        if not s:
            raise ValueError("required")
        return s


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/products")
def get_products() -> dict[str, Any]:
    return load_catalog()


@app.post("/api/quote")
def create_quote(body: QuoteRequest) -> dict[str, Any]:
    products = product_index()
    normalized_cart: list[dict[str, Any]] = []
    errors: list[str] = []

    for line in body.cart:
        product = products.get(line.product_id)
        if product is None:
            errors.append(f"Unknown product_id: {line.product_id}")
            continue
        moq = int(product.get("moq", 1))
        if line.qty < moq:
            errors.append(
                f"{line.product_id}: qty {line.qty} below MOQ {moq}"
            )
            continue
        normalized_cart.append(
            {
                "product_id": line.product_id,
                "name": product.get("name"),
                "qty": line.qty,
                "moq": moq,
                "indicativePrice": product.get("indicativePrice"),
                "currency": product.get("currency"),
                "unit": product.get("unit"),
            }
        )

    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    lead_id = str(uuid.uuid4())
    ref = "RFQ-" + uuid.uuid4().hex[:8].upper()
    lead = {
        "lead_id": lead_id,
        "ref": ref,
        "created_at": utc_now(),
        "status": "new",
        "name": body.name,
        "country": body.country,
        "state": body.state,
        "city": body.city,
        "email": body.email,
        "mobile": body.mobile,
        "cart": normalized_cart,
        "logistics": None,
    }

    leads = _read_json(LEADS_PATH, [])
    if not isinstance(leads, list):
        leads = []
    leads.append(lead)
    _write_json(LEADS_PATH, leads)

    sheets_row = lead_to_sheets_row(lead, status="new")
    _append_sheets_outbox(sheets_row)

    return {
        "success": True,
        "lead_id": lead_id,
        "ref": ref,
        "sheets_queued": True,
    }


@app.post("/api/logistics")
def create_logistics(body: LogisticsRequest) -> dict[str, Any]:
    leads = _read_json(LEADS_PATH, [])
    if not isinstance(leads, list):
        leads = []

    logistics_payload = {
        "lead_id": body.lead_id,
        "address": body.address,
        "landmark": body.landmark,
        "location": body.location,
        "mode_of_transport": body.mode_of_transport,
        "updated_at": utc_now(),
    }

    found = False
    for lead in leads:
        if lead.get("lead_id") == body.lead_id:
            lead["logistics"] = logistics_payload
            found = True
            break

    if found:
        _write_json(LEADS_PATH, leads)
    else:
        # Still persist logistics even if lead_id is unknown (stub behaviour)
        logistics_list = _read_json(LOGISTICS_PATH, [])
        if not isinstance(logistics_list, list):
            logistics_list = []
        logistics_list.append(logistics_payload)
        _write_json(LOGISTICS_PATH, logistics_list)

    return {"success": True, "lead_id": body.lead_id, "updated_lead": found}

# Abracerabra Sheets ↔ API sync

Spreadsheet: see `sheets_config.json`  
id `1qJgkRp6fB21smNgHjshNrv4YQbwl8F7irx-UZiTSDnw`

This box does **not** have Google Sheets OAuth for Python. The quote API does not call Google APIs directly. Sync is split between local files, the lead-on-submit webhook, and Grok Bot / Website Builder (Sheets MCP).

## Roles

| Actor | Direction | What they do |
|-------|-----------|--------------|
| **Receptionist** | Sheet only | Edits **Products** (prices, MOQs, specs) in the Google Sheet |
| **Website Builder / Grok Bot** | Products → API | Reads Products tab via Sheets MCP; writes/updates local catalog (`src/data/products.json` and/or `data/products_sheet_rows.json`) so `GET /api/products` stays current |
| **Quote API** | Quote → webhook | On successful `POST /api/quote`, POSTs the Leads row to the webhook (`Authorization: Bearer` + `WEBHOOK_SENDER_KEY` or `SHEETS_WEBHOOK_SENDER_KEY`). Local `data/leads.json` and `data/sheets_outbox.jsonl` are best-effort and are skipped when the filesystem is read-only (Vercel). |
| **Website Builder / Grok Bot** | Outbox → Sheet | Flushes `sheets_outbox.jsonl` into the **Leads** tab with Sheets MCP `append_rows`, then clears or archives processed lines. The outbox remains the backup path and is flushed on the normal 5-minute cadence. |

## Leads columns

`lead_id`, `ref`, `created_at`, `status`, `name`, `country`, `state`, `city`, `email`, `mobile`, `cart_json`

## Local files

| Path | Purpose |
|------|---------|
| `data/leads.json` | Canonical local lead store |
| `data/sheets_outbox.jsonl` | Queue of Leads rows ready for Sheets (one JSON object per line) |
| `data/leads_export.csv` | Optional CSV from `sync_leads_to_sheets.py` (same columns) |
| `sheets_config.json` | Spreadsheet id, URL, tab names, and `webhookUrl`. `webhookSenderKey` stays empty; the key is an environment variable |

## Products → local catalog

1. Read the **Products** tab with Sheets MCP `read_range`.
2. Write `data/products_sheet_rows.json` as a JSON list-of-lists (header row + data).
3. Run:

```bash
cd backend && source .venv/bin/activate
python sync_products_from_sheet.py
```

This rewrites `src/data/products.json` products array (keeps `company` / `categories`). Restart or rely on API cache clear if the catalog cache is warm.

## Helper script

```bash
cd backend && source .venv/bin/activate
python sync_leads_to_sheets.py           # print flush instructions + write CSV
python sync_leads_to_sheets.py --csv-only
python sync_leads_to_sheets.py --from-leads  # rebuild CSV from leads.json
```

## Quote response

Successful `POST /api/quote` returns `success`, `lead_id`, `ref`, `sheets_queued`, and `sheets_webhook`. `sheets_queued` is true when the local outbox line was written. `sheets_webhook` is true when the webhook accepts the row. Webhook or filesystem failures do not fail the quote. On Vercel, expect `sheets_queued: false` and rely on `sheets_webhook`.

## Do not

- Do not add a service-account happy path in Python for this stub.
- Do not call Google APIs from `main.py` or `sync_leads_to_sheets.py`.

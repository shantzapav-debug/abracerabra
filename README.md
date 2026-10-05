# Abracerabra

B2B request-for-quote site for Abracerabra (Bengaluru). Buyers browse the abrasive catalog, build a quote cart, and submit an RFQ. Prices are indicative INR. There is no checkout and no online payment.

The Vite + React app and the quote API deploy together on Vercel. See [DEPLOY.md](DEPLOY.md) for the Origin connection and environment variables.

## Scripts

```bash
npm install
npm run dev     # storefront, http://127.0.0.1:5173
npm run api     # quote API, http://127.0.0.1:8000
npm run build   # production bundle in dist/
npm run preview
```

Run `npm run api` in another terminal while developing. The dev server calls `http://127.0.0.1:8000` unless `VITE_API_URL` is set. A production build leaves `VITE_API_URL` unset and calls same-origin `/api`, which is how the Vercel project is wired.

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/catalog` | Categories and products |
| `/category/:id` | Products in one category |
| `/product/:id` | Specs, MOQ, indicative price, add to quote |
| `/rfq-cart` | Cart and lead form |
| `/logistics/:leadId` | Delivery preferences after the RFQ |

## API

| Method | Path | Role |
|--------|------|------|
| GET | `/api/health` | `{ "ok": true }` |
| GET | `/api/products` | Catalog (`src/data/products.json`) |
| POST | `/api/quote` | Create a lead and POST it to the Sheets webhook |

`POST /api/quote` returns `success`, `lead_id` (UUID), `ref` (`RFQ-*`), `sheets_queued`, and `sheets_webhook`. The sender key is `WEBHOOK_SENDER_KEY` (or `SHEETS_WEBHOOK_SENDER_KEY`). Do not put that key in the repo. The webhook URL lives in `backend/sheets_config.json` and can be overridden with `SHEETS_WEBHOOK_URL`.

If the API is down, the storefront falls back to the bundled catalog and a browser-local RFQ log.

## Layout

```
api/            Vercel serverless routes
lib/            Shared lead + webhook logic
src/            React storefront
tools/quote-api.mjs   Local Node server for the same routes
backend/        Sheets config and optional Python sync helpers
vercel.json     Vite build + SPA fallback, excluding /api
```

Catalog edits belong in `src/data/products.json` (or the Products sheet, then the sync helper in `backend/`). Lead files under `backend/data/` are local only and are gitignored.

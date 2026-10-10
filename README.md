# Abracerabra

B2B request-for-quote site for Abracerabra (Bengaluru). Buyers browse the abrasive catalog, build a quote cart, and submit an RFQ. Prices are indicative INR. There is no checkout and no online payment.

The Vite + React app and the quote API deploy together on Vercel. See [DEPLOY.md](DEPLOY.md) for environment variables. Sheet setup for the owner is in [apps-script/SETUP.md](apps-script/SETUP.md).

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
| `/logistics?lead=&t=` | Private delivery form. Invalid tokens show an error page and no form. Not linked from the nav. |

## API

| Method | Path | Role |
|--------|------|------|
| GET | `/api/health` | `{ "ok": true }` |
| GET | `/api/products` | Published sheet catalog, else `src/data/products.json` |
| POST | `/api/quote` | Create a lead and POST it to the Sheets webhook |
| GET | `/api/logistics-verify` | Check a delivery-link token |
| POST | `/api/logistics` | Save delivery details through the Apps Script web app |

`POST /api/quote` returns `success`, `lead_id` (UUID), `ref` (`RFQ-*`), `sheets_queued`, and `sheets_webhook`. The sender key is `WEBHOOK_SENDER_KEY` (or `SHEETS_WEBHOOK_SENDER_KEY`). Do not put that key in the repo. The webhook URL lives in `backend/sheets_config.json` and can be overridden with `SHEETS_WEBHOOK_URL`.

If the API is down, the storefront falls back to the bundled catalog and a browser-local RFQ log.

## Layout

```
api/            Vercel serverless routes
lib/            Shared lead, catalog, and logistics-token logic
src/            React storefront
apps-script/    Sheet menu, web app, and owner setup
tools/quote-api.mjs   Local Node server for the same routes
backend/        Sheets config and optional Python sync helpers
vercel.json     Vite build + SPA fallback, excluding /api
```

Publish products from the Products tab. The bundled `src/data/products.json` is the fallback when the sheet web app cannot be reached. Lead files under `backend/data/` are local only and are gitignored.

```bash
npm test        # token vectors + catalog contract
```

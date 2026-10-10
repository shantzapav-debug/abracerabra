# Deploy Abracerabra on Vercel

Abracerabra is an Origin repository. Connect that Origin repo to Vercel. Do not mirror it to GitHub.

The production site is one Vercel project: the Vite app plus `/api` serverless functions. RFQ submit posts the lead row to the Google Sheets webhook. There is no payment flow. Prices stay in INR. The live catalog is the Published rows in the Products tab, read through the Apps Script web app. If that call fails, the site uses `src/data/products.json`.

Sheet buttons, the Settings tab, and the web app are installed once. The steps are in [apps-script/SETUP.md](apps-script/SETUP.md). The live site is https://abracerabraweb.vercel.app/ and production deploys from `main`.

## Prerequisites

- A Vercel team on **Pro or higher**. Origin repositories are private and cannot be deployed from a Hobby team.
- The **Owner** or **Member** role on that Vercel team.
- The Sheets webhook sender key. It is not in this repo. `backend/sheets_config.json` keeps `webhookSenderKey` empty on purpose.

## Connect Origin

1. In the Vercel dashboard, choose **New Project**.
2. Choose **Continue with Origin** (not GitHub, GitLab, or Bitbucket).
3. Select the Origin team, then this repository.
4. Framework preset: **Vite**. If detection fails, set Vite yourself. Do not leave the preset on Other.
5. Root directory: the repository root. Build command: `npm run build`. Output directory: `dist`.
6. Add the environment variables below, then deploy.

You can also install Vercel from this repo’s **Apps** tab on Origin. After that, pull requests get preview deployments, and a push to the production branch deploys production.

The live URL is the `*.vercel.app` hostname Vercel assigns, or a custom domain attached in the project settings. This repo does not hard-code that hostname.

## Environment variables

Set these in the Vercel project (**Settings → Environment Variables**) for Production. Add them to Preview as well if preview deploys should write leads.

| Name | Required | What to set |
|------|----------|-------------|
| `WEBHOOK_SENDER_KEY` | Yes | Sender key for the Sheets webhook. The quote function sends `Authorization: Bearer <this value>`. This path is unchanged. |
| `SHEETS_WEBHOOK_SENDER_KEY` | Alias | Used only when `WEBHOOK_SENDER_KEY` is unset. |
| `SHEETS_WEBHOOK_URL` | No | Overrides `webhookUrl` in `backend/sheets_config.json`. Leave unset to use the URL already in that file. |
| `WEBHOOK_URL` | Alias | Used only when `SHEETS_WEBHOOK_URL` is unset. |
| `SHEETS_APP_URL` | Yes, for live catalog and delivery forms | Apps Script web app URL from setup. It ends in `/exec`. |
| `APP_SHARED_SECRET` | Yes, for delivery forms | Script Property `APP_SHARED_SECRET` from the setup dialog. Sent to the web app with logistics saves and lead lookups. |
| `LOGISTICS_LINK_SECRET` | Yes, for delivery links | Script Property `LINK_SECRET` from the setup dialog. Vercel and Apps Script must use the same value. The link token is HMAC-SHA256 of the lead id, lowercase hex. |
| `VITE_API_URL` | No | Leave **unset** on Vercel. The browser then calls same-origin `/api`. Set it only if the UI and API are split across hosts. |

Never commit these values. `.env.example` lists the names only.

`WEBHOOK_SENDER_KEY`, `SHEETS_APP_URL`, `APP_SHARED_SECRET`, and `LOGISTICS_LINK_SECRET` are read at runtime by the serverless functions. `VITE_API_URL` is baked in at build time, so a localhost value set during the Vercel build would point the live site at your laptop. Leave it unset.

If you add or change variables after the first deploy, redeploy so new function instances see them.

## What Vercel serves

`vercel.json` rewrites client routes to `index.html` and leaves `/api/*` on functions:

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/health` | `{ "ok": true }` |
| GET | `/api/products` | `{ company, categories, products }` from published sheet rows, with `Cache-Control: public, s-maxage=60, stale-while-revalidate=60`. Falls back to `src/data/products.json` if the web app call fails. |
| POST | `/api/quote` | `{ success, lead_id, ref, sheets_queued, sheets_webhook }` |
| GET | `/api/logistics-verify?lead=&t=` | `{ valid, lead_id, ref, name }` or `{ valid: false }` |
| POST | `/api/logistics` | Re-checks the token, then asks the web app to upsert the Logistics row |

`POST /api/quote` builds the same lead as the local Node API (`lead_id` UUID, `ref` `RFQ-*`, cart lines enriched from the catalog) and POSTs that lead row JSON to the webhook. When `SHEETS_APP_URL` is set, product names and INR prices in that lead come from the published sheet, and the bundled file is used if the sheet call fails. The webhook URL, the bearer header, and the lead columns are unchanged. File writes under `backend/data` are best-effort. On Vercel the filesystem is read-only, so a failed local outbox does not fail the request. `sheets_webhook` is `true` only when the webhook accepts the row.

`/logistics?lead=<lead_id>&t=<token>` is the private delivery page. It is not in the navigation. A missing or wrong token shows an invalid-link page and does not render the form.

Token check (Node and Apps Script must agree):

```bash
node tools/logistics-token-test.mjs
```

Vectors are listed in [apps-script/TOKEN_VECTORS.md](apps-script/TOKEN_VECTORS.md).

## Local check before you connect Vercel

```bash
npm install
npm run build
```

```bash
# terminal 1 — quote API
export WEBHOOK_SENDER_KEY="your-sender-key"
npm run api

# terminal 2 — Vite dev server (calls http://127.0.0.1:8000)
npm run dev
```

# Deploy Abracerabra on Vercel

Abracerabra is an Origin repository. Connect that Origin repo to Vercel. Do not mirror it to GitHub.

The production site is one Vercel project: the Vite app plus `/api` serverless functions. RFQ submit posts the lead row to the Google Sheets webhook. There is no payment flow. Prices stay in INR from `src/data/products.json`.

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
| `WEBHOOK_SENDER_KEY` | Yes | Sender key for the Sheets webhook. The quote function sends `Authorization: Bearer <this value>`. |
| `SHEETS_WEBHOOK_SENDER_KEY` | Alias | Used only when `WEBHOOK_SENDER_KEY` is unset. |
| `SHEETS_WEBHOOK_URL` | No | Overrides `webhookUrl` in `backend/sheets_config.json`. Leave unset to use the URL already in that file. |
| `WEBHOOK_URL` | Alias | Used only when `SHEETS_WEBHOOK_URL` is unset. |
| `VITE_API_URL` | No | Leave **unset** on Vercel. The browser then calls same-origin `/api`. Set it only if the UI and API are split across hosts. |

`WEBHOOK_SENDER_KEY` is read at runtime by the serverless functions. `VITE_API_URL` is baked in at build time, so a localhost value set during the Vercel build would point the live site at your laptop. Leave it unset.

If you add or change variables after the first deploy, redeploy so new function instances see them.

## What Vercel serves

`vercel.json` rewrites client routes to `index.html` and leaves `/api/*` on functions:

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/health` | `{ "ok": true }` |
| GET | `/api/products` | Catalog from `src/data/products.json` |
| POST | `/api/quote` | `{ success, lead_id, ref, sheets_queued, sheets_webhook }` |

`POST /api/quote` builds the same lead as the local Node API (`lead_id` UUID, `ref` `RFQ-*`, cart lines enriched from the catalog) and POSTs that lead row JSON to the webhook. File writes under `backend/data` are best-effort. On Vercel the filesystem is read-only, so a failed local outbox does not fail the request. `sheets_webhook` is `true` only when the webhook accepts the row.

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

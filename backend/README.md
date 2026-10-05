# Abracerabra FastAPI backend (local stub)

The deployed API is the Vercel routes in `/api` (see `DEPLOY.md`). This Python app is an optional local stub. It writes `data/leads.json` and does **not** call the Sheets webhook. For the webhook path locally, use `npm run api` (`tools/quote-api.mjs`) instead.

## Setup

```bash
cd /workspace/abracerabra-app/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
cd /workspace/abracerabra-app/backend
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API base: **http://127.0.0.1:8000**

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/api/products` | Full catalog (company + categories + products), cached in memory |
| POST | `/api/quote` | Step 1 RFQ — cart + contact; appends `data/leads.json` |
| POST | `/api/logistics` | Step 2 logistics — updates lead / appends `data/logistics.json` |

CORS allows `http://127.0.0.1:5173` and `http://localhost:5173`.

## Example

```bash
curl -s http://127.0.0.1:8000/api/health
curl -s http://127.0.0.1:8000/api/products | head -c 200

curl -s -X POST http://127.0.0.1:8000/api/quote \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Ada Lovelace",
    "country": "UK",
    "state": "London",
    "city": "London",
    "email": "ada@example.com",
    "mobile": "+441234567890",
    "cart": [{"product_id": "gw-rail-100", "qty": 50}]
  }'
```

Frontend: set `VITE_API_URL=http://127.0.0.1:8000` (default). `src/api/` tries the backend and falls back to local mock if unreachable.

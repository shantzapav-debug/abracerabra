/**
 * Local quote, catalog, and logistics API (no Python).
 * Same contracts as the Vercel routes in /api.
 * Run: node tools/quote-api.mjs
 */
import http from "node:http";
import { getPublicCatalog, PRODUCTS_CACHE_CONTROL } from "../lib/catalog.mjs";
import { submitLogistics, verifyLogisticsLink } from "../lib/logistics.mjs";
import { createQuote } from "../lib/quote.mjs";

const PORT = Number(process.env.PORT || 8000);

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept");
}

function send(res, status, body, extraHeaders) {
  cors(res);
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
  }
  if (status === 204 || body === null) {
    res.writeHead(status);
    res.end();
    return;
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(payload);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/products") {
      const { catalog } = await getPublicCatalog();
      return send(res, 200, catalog, { "Cache-Control": PRODUCTS_CACHE_CONTROL });
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      return send(res, 200, { ok: true });
    }

    if (
      req.method === "GET" &&
      (url.pathname === "/api/logistics-verify" || url.pathname === "/api/logistics")
    ) {
      const result = await verifyLogisticsLink({
        lead: url.searchParams.get("lead") || "",
        token: url.searchParams.get("t") || "",
      });
      return send(res, 200, result);
    }

    if (req.method === "POST" && url.pathname === "/api/quote") {
      return send(res, 200, await createQuote(await readJson(req)));
    }

    if (req.method === "POST" && url.pathname === "/api/logistics") {
      try {
        return send(res, 200, await submitLogistics(await readJson(req)));
      } catch (error) {
        const status = error.status || 502;
        return send(res, status, { detail: error.message || "Logistics request failed" });
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { detail: "Invalid JSON" });
    console.error(error);
    return send(res, 500, { detail: "Server error" });
  }

  send(res, 404, { detail: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Abracerabra quote API on http://127.0.0.1:${PORT}`);
});

/**
 * Local quote + products API (no Python).
 * Same lead contract as the Vercel routes in /api.
 * Run: node tools/quote-api.mjs
 */
import http from "node:http";
import { createQuote, getCatalog } from "../lib/quote.mjs";

const PORT = Number(process.env.PORT || 8000);

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept");
}

function send(res, status, body) {
  cors(res);
  if (status === 204 || body === null) {
    res.writeHead(status);
    res.end();
    return;
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "GET" && url.pathname === "/api/products") {
    return send(res, 200, getCatalog());
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/quote") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      return send(res, 400, { detail: "Invalid JSON" });
    }
    return send(res, 200, await createQuote(body));
  }

  send(res, 404, { detail: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Abracerabra quote API on http://127.0.0.1:${PORT}`);
});

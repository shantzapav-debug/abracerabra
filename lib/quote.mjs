/**
 * Shared RFQ lead builder for the local quote API and Vercel serverless routes.
 * Catalog and webhook URL come from the repo. The sender key is env-only.
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const catalog = require("../src/data/products.json");
const sheetsConfig = require("../backend/sheets_config.json");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "backend", "data");
const LEADS_PATH = path.join(DATA_DIR, "leads.json");
const OUTBOX_PATH = path.join(DATA_DIR, "sheets_outbox.jsonl");

const WEBHOOK_TIMEOUT_MS = 8000;

export function getCatalog() {
  return catalog;
}

export function sheetsTarget() {
  const senderKey = String(
    process.env.WEBHOOK_SENDER_KEY ||
      process.env.SHEETS_WEBHOOK_SENDER_KEY ||
      sheetsConfig.webhookSenderKey ||
      "",
  ).trim();
  const webhookUrl = String(
    process.env.SHEETS_WEBHOOK_URL ||
      process.env.WEBHOOK_URL ||
      sheetsConfig.webhookUrl ||
      "",
  ).trim();
  return { senderKey, webhookUrl };
}

export function leadToSheetsRow(lead) {
  return {
    lead_id: lead.lead_id,
    ref: lead.ref,
    created_at: lead.created_at,
    status: lead.status || "new",
    name: lead.name,
    country: lead.country,
    state: lead.state,
    city: lead.city,
    email: lead.email,
    mobile: lead.mobile,
    cart_json: JSON.stringify(lead.cart || []),
  };
}

export function buildLead(body) {
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const byId = Object.fromEntries((catalog.products || []).map((p) => [p.id, p]));
  const cart = [];
  const lines = Array.isArray(source.cart) ? source.cart : [];

  for (const line of lines) {
    if (!line || typeof line !== "object") continue;
    const product = byId[line.product_id];
    if (!product) continue;
    const qty = Number(line.qty) || 0;
    cart.push({
      product_id: product.id,
      name: product.name,
      qty,
      moq: product.moq,
      indicativePrice: product.indicativePrice,
      currency: product.currency,
      unit: product.unit,
    });
  }

  return {
    lead_id: randomUUID(),
    ref: "RFQ-" + Date.now().toString(36).toUpperCase(),
    created_at: new Date().toISOString(),
    status: "new",
    name: source.name || "",
    country: source.country || "",
    state: source.state || "",
    city: source.city || "",
    email: source.email || "",
    mobile: source.mobile || "",
    cart,
    logistics: null,
  };
}

function readLeads() {
  const parsed = JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("leads.json corrupt");
  }
  return parsed;
}

/** Local outbox is a backup. Read-only filesystems (Vercel) must not fail the quote. */
export function persistLeadBestEffort(lead, row) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    let leads = [];
    try {
      leads = readLeads();
    } catch (error) {
      if (!error || error.code !== "ENOENT") throw error;
    }
    leads.push(lead);
    fs.writeFileSync(LEADS_PATH, JSON.stringify(leads, null, 2) + "\n", "utf8");
    fs.appendFileSync(OUTBOX_PATH, JSON.stringify(row) + "\n", "utf8");
    return true;
  } catch (error) {
    console.error(`Lead file persistence skipped: ${error.message}`);
    return false;
  }
}

export async function postLeadToSheetsWebhook(row) {
  const { webhookUrl, senderKey } = sheetsTarget();
  if (!webhookUrl || !senderKey) {
    console.error("Sheets webhook skipped: webhook URL or sender key is not set");
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${senderKey}`,
      },
      body: JSON.stringify(row),
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`Sheets webhook returned HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Sheets webhook failed: ${error.message}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createQuote(body) {
  const lead = buildLead(body);
  const row = leadToSheetsRow(lead);
  const sheetsQueued = persistLeadBestEffort(lead, row);
  const sheetsWebhook = await postLeadToSheetsWebhook(row);
  return {
    success: true,
    lead_id: lead.lead_id,
    ref: lead.ref,
    sheets_queued: sheetsQueued,
    sheets_webhook: sheetsWebhook,
  };
}

/**
 * Published catalog from the Apps Script web app, with the bundled JSON as fallback.
 * The public response stays { company, categories, products }.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bundled = require("../src/data/products.json");

export const PRODUCTS_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=60";
const SHEETS_TIMEOUT_MS = 2500;
const MEMORY_TTL_MS = 60_000;

let memory = { at: 0, payload: null };

export function resetCatalogCache() {
  memory = { at: 0, payload: null };
}

export function slugifyCategory(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "category";
}

/** Blank status is Published so existing sheet rows stay on the site. */
export function isPublishedStatus(status) {
  const value = String(status ?? "").trim().toLowerCase();
  return value === "" || value === "published";
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim().replace(/,/g, "");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function normalizeSheetCatalog(payload, fallback = bundled) {
  const company = fallback.company;
  const bundledCategories = Array.isArray(fallback.categories) ? fallback.categories : [];
  const byId = new Map(bundledCategories.map((category) => [category.id, category]));
  const byNameSlug = new Map(
    bundledCategories.map((category) => [slugifyCategory(category.name), category]),
  );
  const rawProducts = Array.isArray(payload?.products) ? payload.products : [];
  const products = [];
  const seenIds = new Set();
  const categoriesById = new Map();
  const novelOrder = [];

  const remember = (category) => {
    if (!category?.id || categoriesById.has(category.id)) return;
    categoriesById.set(category.id, category);
    novelOrder.push(category.id);
  };

  for (const row of rawProducts) {
    if (!row || typeof row !== "object") continue;
    if (!isPublishedStatus(row.status)) continue;
    const id = String(row.id || "").trim();
    const name = String(row.name || "").trim();
    if (!id || !name || seenIds.has(id)) continue;
    seenIds.add(id);

    const rawCategory = String(row.category || "").trim();
    const slug = rawCategory ? slugifyCategory(rawCategory) : "";
    const known = rawCategory
      ? byId.get(rawCategory) || byId.get(slug) || byNameSlug.get(slug) || null
      : null;
    const category = known
      ? { id: known.id, name: known.name, prdName: known.prdName || known.name }
      : rawCategory
        ? { id: slug, name: rawCategory, prdName: rawCategory }
        : null;
    if (category) remember(category);

    const moq = toNumber(row.moq);
    const price = toNumber(row.indicativePrice);
    const lot = toNumber(row.lotSize);
    products.push({
      id,
      name,
      category: category ? category.id : "",
      image: String(row.image || "").trim(),
      moq: moq ?? 0,
      lotSize: lot && lot > 0 ? lot : 1,
      indicativePrice: price ?? 0,
      currency: String(row.currency || "INR").trim() || "INR",
      unit: String(row.unit || "").trim(),
      specs: String(row.specs || "").trim(),
    });
  }

  const categories = [];
  const used = new Set();
  for (const category of bundledCategories) {
    if (!categoriesById.has(category.id)) continue;
    categories.push(categoriesById.get(category.id));
    used.add(category.id);
  }
  for (const id of novelOrder) {
    if (used.has(id)) continue;
    categories.push(categoriesById.get(id));
  }

  return { company, categories, products };
}

async function fetchSheetPayload() {
  const url = String(process.env.SHEETS_APP_URL || "").trim();
  if (!url) {
    const error = new Error("SHEETS_APP_URL is not set");
    error.code = "UNCONFIGURED";
    throw error;
  }
  const now = Date.now();
  if (memory.payload && now - memory.at < MEMORY_TTL_MS) return memory.payload;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SHEETS_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Sheets app HTTP ${response.status}`);
    const payload = JSON.parse(await response.text());
    if (!payload || !Array.isArray(payload.products)) {
      throw new Error("Sheets app did not return products");
    }
    memory = { at: Date.now(), payload };
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

export async function getPublicCatalog() {
  try {
    const payload = await fetchSheetPayload();
    return { catalog: normalizeSheetCatalog(payload, bundled), source: "sheet" };
  } catch (error) {
    console.error(`Live catalog fallback: ${error.message}`);
    return { catalog: bundled, source: "fallback" };
  }
}

/** Quote enrichment. Falls back to the bundled file so the webhook still sends a lead. */
export async function getProductsForQuote() {
  try {
    if (!String(process.env.SHEETS_APP_URL || "").trim()) return bundled.products;
    const payload = await fetchSheetPayload();
    const catalog = normalizeSheetCatalog(payload, bundled);
    if (catalog.products.length) return catalog.products;
  } catch (error) {
    console.error(`Quote catalog fallback: ${error.message}`);
  }
  return bundled.products;
}

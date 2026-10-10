/**
 * Catalog contract: published rows, blank status, derived categories, fallback.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { I18N } from "../src/i18n/translations.js";
import {
  getPublicCatalog,
  isPublishedStatus,
  normalizeSheetCatalog,
  resetCatalogCache,
} from "../lib/catalog.mjs";

const require = createRequire(import.meta.url);
const bundled = require("../src/data/products.json");

assert.equal(isPublishedStatus(""), true);
assert.equal(isPublishedStatus("Published"), true);
assert.equal(isPublishedStatus("published"), true);
assert.equal(isPublishedStatus("Draft"), false);
assert.equal(isPublishedStatus("Error"), false);
assert.equal(isPublishedStatus("Done"), false);

const catalog = normalizeSheetCatalog({
  products: [
    {
      id: "gw-rail-100",
      name: "100mm Rail Profile Grinding Wheels",
      category: "Grinding Wheels",
      image: "https://example.com/rail.jpg",
      moq: "50",
      lotSize: "10",
      indicativePrice: "420",
      currency: "",
      unit: "piece",
      specs: "rail",
      status: "",
    },
    {
      id: "hidden-draft",
      name: "Hidden draft",
      category: "grinding-wheel",
      image: "https://example.com/draft.jpg",
      moq: 1,
      indicativePrice: 1,
      unit: "piece",
      status: "Draft",
    },
    {
      id: "zr-crucible-demo",
      name: "Sheet-only Zirconia Crucible",
      category: "Zirconia Labware",
      image: "https://example.com/crucible.jpg",
      moq: 5,
      lotSize: "",
      indicativePrice: 1200,
      currency: "INR",
      unit: "piece",
      specs: "Live from the sheet",
      status: "Published",
    },
  ],
}, bundled);

assert.equal(catalog.company.name, "Abracerabra");
assert.deepEqual(
  catalog.products.map((product) => product.id),
  ["gw-rail-100", "zr-crucible-demo"],
);
assert.equal(catalog.products[0].category, "grinding-wheel");
assert.equal(catalog.products[0].currency, "INR");
assert.equal(catalog.products[0].moq, 50);
assert.equal(catalog.products[1].category, "zirconia-labware");
assert.equal(catalog.products[1].lotSize, 1);
assert.ok(catalog.categories.some((category) => category.id === "grinding-wheel" && category.name === "Grinding Wheels"));
assert.ok(catalog.categories.some((category) => category.id === "zirconia-labware" && category.name === "Zirconia Labware"));
for (const product of catalog.products) {
  for (const key of ["id", "name", "category", "image", "moq", "lotSize", "indicativePrice", "currency", "unit", "specs"]) {
    assert.ok(key in product, key);
  }
  assert.equal("status" in product, false);
}

resetCatalogCache();
delete process.env.SHEETS_APP_URL;
const productsModule = await import("../api/products.js");
const response = await productsModule.default.fetch(new Request("http://local/api/products"));
assert.equal(response.status, 200);
assert.match(response.headers.get("cache-control") || "", /s-maxage=60/);
assert.match(response.headers.get("cache-control") || "", /stale-while-revalidate=60/);
const body = await response.json();
assert.equal(body.products.length, bundled.products.length);
assert.ok(body.categories.length >= 1);

resetCatalogCache();
process.env.SHEETS_APP_URL = "http://127.0.0.1:9/exec";
const fallback = await getPublicCatalog();
assert.equal(fallback.source, "fallback");
assert.equal(fallback.catalog.products.length, bundled.products.length);
delete process.env.SHEETS_APP_URL;
resetCatalogCache();

const originalFetch = globalThis.fetch;
globalThis.fetch = async () =>
  new Response(JSON.stringify({ ok: false, error: "Products tab missing", products: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
process.env.SHEETS_APP_URL = "https://script.google.com/macros/s/test/exec";
resetCatalogCache();
const rejected = await getPublicCatalog();
assert.equal(rejected.source, "fallback");
assert.equal(rejected.catalog.products.length, bundled.products.length);
globalThis.fetch = originalFetch;
delete process.env.SHEETS_APP_URL;
resetCatalogCache();

const logisticsKeys = Object.keys(I18N.en).filter(
  (key) => key.startsWith("logistics.") || key === "success.step2.note",
);
for (const lang of ["ja", "fr", "ar"]) {
  for (const key of logisticsKeys) {
    assert.ok(I18N[lang][key], `${lang} missing ${key}`);
  }
}

console.log("catalog contract ok");

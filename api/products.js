import { json } from "../lib/http.mjs";
import { PRODUCTS_CACHE_CONTROL, getPublicCatalog } from "../lib/catalog.mjs";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return json(204, null);
    if (request.method !== "GET") return json(404, { detail: "Not found" });
    const { catalog } = await getPublicCatalog();
    return json(200, catalog, { "Cache-Control": PRODUCTS_CACHE_CONTROL });
  },
};

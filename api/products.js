import { json } from "../lib/http.mjs";
import { getCatalog } from "../lib/quote.mjs";

export default {
  fetch(request) {
    if (request.method === "OPTIONS") return json(204, null);
    if (request.method !== "GET") return json(404, { detail: "Not found" });
    return json(200, getCatalog());
  },
};

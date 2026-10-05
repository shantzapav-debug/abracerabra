import { json } from "../lib/http.mjs";
import { createQuote } from "../lib/quote.mjs";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return json(204, null);
    if (request.method !== "POST") return json(404, { detail: "Not found" });

    let body;
    try {
      body = JSON.parse((await request.text()) || "{}");
    } catch {
      return json(400, { detail: "Invalid JSON" });
    }

    return json(200, await createQuote(body));
  },
};

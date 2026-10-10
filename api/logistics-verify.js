import { json } from "../lib/http.mjs";
import { verifyLogisticsLink } from "../lib/logistics.mjs";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return json(204, null);
    if (request.method !== "GET") return json(404, { detail: "Not found" });
    const url = new URL(request.url);
    const result = await verifyLogisticsLink({
      lead: url.searchParams.get("lead") || "",
      token: url.searchParams.get("t") || "",
    });
    return json(200, result);
  },
};

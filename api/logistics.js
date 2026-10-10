import { json } from "../lib/http.mjs";
import { submitLogistics, verifyLogisticsLink } from "../lib/logistics.mjs";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return json(204, null);
    const url = new URL(request.url);

    if (request.method === "GET") {
      const result = await verifyLogisticsLink({
        lead: url.searchParams.get("lead") || "",
        token: url.searchParams.get("t") || "",
      });
      return json(200, result);
    }

    if (request.method !== "POST") return json(404, { detail: "Not found" });

    let body;
    try {
      body = JSON.parse((await request.text()) || "{}");
    } catch {
      return json(400, { detail: "Invalid JSON" });
    }

    try {
      return json(200, await submitLogistics(body));
    } catch (error) {
      const status = error.status || 502;
      return json(status, { detail: error.message || "Logistics request failed" });
    }
  },
};

/**
 * Logistics link token.
 * token = HMAC-SHA256(UTF-8 lead_id, UTF-8 LINK_SECRET) as lowercase hex.
 * Apps Script uses the same algorithm in apps-script/Code.gs (hmacSha256Hex_).
 * Test vectors live in tools/logistics-token-test.mjs and apps-script/TOKEN_VECTORS.md.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function signLeadId(leadId, secret) {
  const lead = String(leadId ?? "");
  const key = String(secret ?? "");
  return createHmac("sha256", key).update(lead, "utf8").digest("hex");
}

export function verifyLeadToken(leadId, token, secret) {
  const lead = String(leadId || "").trim();
  const provided = String(token || "").trim().toLowerCase();
  const key = String(secret || "");
  if (!lead || !provided || !key) return false;
  const expected = signLeadId(lead, key);
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(provided, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

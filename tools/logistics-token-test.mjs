/**
 * Token vectors shared with apps-script/Code.gs selfTestTokens().
 * Algorithm: HMAC-SHA256(UTF-8 lead_id, UTF-8 secret) → lowercase hex.
 */
import assert from "node:assert/strict";
import { signLeadId, verifyLeadToken } from "../lib/logistics-token.mjs";

export const TOKEN_VECTORS = [
  {
    secret: "test-secret",
    lead_id: "11111111-2222-3333-4444-555555555555",
    token: "197852d5db0511671a896ce0244ebe0243dba0ce3ecbd38ad52e3a22e567ea6b",
  },
  {
    secret: "abracerabra-link-secret",
    lead_id: "1fb11ac0-f6ac-4828-bd4f-7f88e95c6ee7",
    token: "68595a6032dccc7613fb34f52f0f2a1b1d4a7b91bc49539470dcc9b7a09dc510",
  },
  {
    secret: "secret with spaces",
    lead_id: "lead id with spaces",
    token: "b0e542e0c622d3a72b3dbf505eb410e53fb2144f66fd7694a83a9025c8365edd",
  },
];

for (const vector of TOKEN_VECTORS) {
  const token = signLeadId(vector.lead_id, vector.secret);
  assert.equal(token, vector.token, vector.lead_id);
  assert.equal(verifyLeadToken(vector.lead_id, vector.token, vector.secret), true);
  assert.equal(verifyLeadToken(vector.lead_id, vector.token.toUpperCase(), vector.secret), true);
  assert.equal(verifyLeadToken(vector.lead_id, "0".repeat(64), vector.secret), false);
  assert.equal(verifyLeadToken("", vector.token, vector.secret), false);
  assert.equal(verifyLeadToken(vector.lead_id, vector.token, ""), false);
}

console.log(`logistics token vectors ok (${TOKEN_VECTORS.length})`);

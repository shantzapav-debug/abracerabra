# Logistics link token

The private link is:

`https://abracerabraweb.vercel.app/logistics?lead=<lead_id>&t=<token>`

`token` is HMAC-SHA256 of the lead id, keyed by `LINK_SECRET`, written as lowercase hex. Both the lead id and the secret are UTF-8. This is the same value Node produces with `crypto.createHmac('sha256', secret).update(leadId, 'utf8').digest('hex')` and Apps Script produces with `Utilities.computeHmacSha256Signature`.

| secret | lead_id | token |
| --- | --- | --- |
| `test-secret` | `11111111-2222-3333-4444-555555555555` | `197852d5db0511671a896ce0244ebe0243dba0ce3ecbd38ad52e3a22e567ea6b` |
| `abracerabra-link-secret` | `1fb11ac0-f6ac-4828-bd4f-7f88e95c6ee7` | `68595a6032dccc7613fb34f52f0f2a1b1d4a7b91bc49539470dcc9b7a09dc510` |
| `secret with spaces` | `lead id with spaces` | `b0e542e0c622d3a72b3dbf505eb410e53fb2144f66fd7694a83a9025c8365edd` |

Check Node:

```bash
node tools/logistics-token-test.mjs
```

Check Apps Script: open the script, choose `selfTestTokens` in the function list, click Run, and open the execution log. It prints `token vectors ok (3)`.

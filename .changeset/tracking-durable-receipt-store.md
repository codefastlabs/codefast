---
"@codefast/tracking": minor
---

Adds `createDurableReceiptStore({ backend })` — a durable `ReceiptStore` over an injected `ReceiptStoreBackend` (a minimal id-keyed `get`/`put` primitive). The package supplies the append-only contract and adaptation; the deployment supplies the backend client (Vercel KV, Postgres, an append-only log), so no database dependency is baked in. `put` MUST be idempotent-by-id so the append-only guarantee holds atomically under retries/concurrency (e.g. KV set-if-absent, Postgres `INSERT … ON CONFLICT DO NOTHING`) — the frame delegates rather than doing a racy get-then-put. Pair it with a real backend in production, where `createInMemoryReceiptStore` is not a lawful store on its own.

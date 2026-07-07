---
"@codefast/tracking": minor
---

Deliver events to SDK-backed destinations at track time instead of through the batching queue.

`Destination` gains an optional `delivery: "immediate" | "queued"` field. The Google Analytics and Vercel destinations are marked `"immediate"` — their SDKs own batching and unload delivery, so routing them through the queue only delayed events and replayed stale ones next session with wrong timestamps. The queue keeps serving HTTP destinations and the `flushWithBeacon` path unchanged.

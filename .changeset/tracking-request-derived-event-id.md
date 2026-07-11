---
"@codefast/tracking": minor
---

Add `deriveEventId(requestId, discriminant)` (`@codefast/tracking/core`) and wire it into `createServerTracker`: pass `requestId` on `ServerTrackerContext` to make a server-owned event's `eventId` deterministic instead of random. Retrying the same request with the same `track`/`group`/`alias` call now reproduces the same `eventId`, so a destination that dedupes on it treats the retry as a no-op instead of double-counting — closing the gap between the package's documented idempotency intent and its previous always-random default. Omitting `requestId` keeps the existing random behavior, so this is additive and non-breaking.

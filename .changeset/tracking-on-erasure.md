---
"@codefast/tracking": minor
---

Adds the per-destination erasure capability for DSR withdrawal (spec-data-subject-rights §3, DSR-V2/V4): `Destination` gains an optional `onErasure(id)` hook, and `createClientTracker` returns an `erase(id)` method that invokes each destination's `onErasure` once on withdrawal, swallowing failures so a destination can never break the flow. The reference `createMetaDestination` implements `onErasure` as cookie-clear (via an injected `clearCookies` seam) plus stop-send — Meta exposes no per-visitor deletion API, so the binding never fabricates one. Destinations with nothing to erase omit the hook.

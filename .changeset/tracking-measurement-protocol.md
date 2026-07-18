---
"@codefast/tracking": minor
---

Adds server-side GA4 Measurement Protocol primitives for forwarding a **server-owned** event (re-added now that a consumer tracks one — a server-recorded consent decision): `sendMeasurementProtocolEvents` POSTs `{ client_id, events, consent? }` to the credentialed `/mp/collect` endpoint through an injected `transport` (default `fetch`), so no HTTP client or credentials are baked in; `extractGaClientId` derives the GA4 `client_id` from a `_ga` cookie; `toMeasurementProtocolConsent` maps the package `ConsentDecision` to the MP `consent` signals. Server-only (`@codefast/tracking/server`). The caller owns the credentials and the consent gate.

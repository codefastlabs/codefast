---
"@codefast/tracking": minor
---

Adds the shared ad-destination frame for consuming one `{ ads, analytics }` decision across ad platforms (spec-destinations §5): `toAdConsentState(decision)` normalizes it to the two independent levers — `analytics` drives whether events transmit, `ads` drives Limited Data Use — so per-vendor mappings cannot drift. Ships a reference Meta destination (`createMetaDestination`, `toMetaDataProcessingOptions`) that maps each event and the live `ads` decision to Meta's `dataProcessingOptions` (geolocated LDU when `ads` is denied) and hands it to an injected `transport`. Consent-restriction mapping only — the Pixel/CAPI transport and credentials are the integrator's to supply; an ad sink is never `exempt`.

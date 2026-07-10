---
"@codefast/tracking": minor
---

Switch gtag/GTM bootstraps to Google Consent Mode **advanced**:

- `buildGtagConsentBootstrapScript` / `buildGtmConsentBootstrapScript` always set Consent Mode v2 `default` (from stored decision or region fallback), then **always** load gtag.js / gtm.js — even when analytics/ads storage is denied — so cookieless pings and consent modeling can run.
- Runtime grants/denies still use `updateGoogleConsent`; `loadGtagScript` / `loadGtmScript` remain idempotent safety nets when the bootstrap did not run.
- The package's first-party consent gate is unchanged — identifiers and non-exempt destinations stay blocked without consent; only Google tag _script loading_ changes.

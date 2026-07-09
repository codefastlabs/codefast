---
"@codefast/tracking": minor
---

Improve gtag/GTM loader DX without changing consent-first loading:

- `ensureGtag` / `loadGtagScript` / `buildGtagConsentBootstrapScript` accept optional `dataLayerName`, `nonce` (CSP), and `debugMode`.
- Add `createGoogleTagManagerDestination`, `buildGtmConsentBootstrapScript`, and `loadGtmScript` for consent-gated GTM.
- Add `<GtagConsentBootstrap />` — a framework-agnostic inline script wrapper for the pre-hydration bootstrap.

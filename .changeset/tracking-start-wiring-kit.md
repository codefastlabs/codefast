---
"@codefast/tracking": minor
---

Add a TanStack Start wiring kit so consumer apps no longer hand-roll consent/bootstrap glue:

- `buildInitialConsent` + exported `EU_COUNTRY_CODES` / `OPT_IN_EQUIVALENT_COUNTRY_CODES` (`@codefast/tracking/server`) — region → mode → default decision for SSR shells and edge-middleware cookie payloads.
- `buildInitialConsentBootstrapScript` (`@codefast/tracking/destinations`) — pre-hydration cookie → `window.__INITIAL_CONSENT__` bootstrap for statically prerendered pages.
- `clearGoogleAnalyticsCookies` (`@codefast/tracking/destinations`) — expire `_ga` / `_ga_*` on consent withdrawal.
- `createIsTrackingAllowed` / `createConsentWithdrawalHandler` (`@codefast/tracking/client`) — tracker gate + revoke clears.
- `useGoogleConsentSync` (`@codefast/tracking/react`) — Consent Mode `update` + optional gtag load, including cross-tab / privacy-page decisions.

`InitialConsent` is exported from `@codefast/tracking` / `@codefast/tracking/core`. None of these change existing export behavior.

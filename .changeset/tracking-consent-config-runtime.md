---
"@codefast/tracking": major
---

Collapse the consent "must match" contracts into one `ConsentConfig`, and add `createConsentRuntime`.

Previously `storageKey`, `policyVersion`, and `requestedCategories` had to be hand-threaded — matching exactly — through `useConsent`, `createIsAnalyticsAllowed`, the gtag/GTM consent bootstraps, the consent-cookie mirror, and the server cookie reader; one drifted string was a silent consent bug. Now:

- **`ConsentConfig` + `defineConsentConfig` (root/core)** — the one bag for `storageKey`, `policyVersion`, `requestedCategories`, and optional `decisionCookieName`. Isomorphic plain data: the same object is imported on both sides.
- **`createConsentRuntime` (client)** — derives the live client instances from the config: the shared `ConsentStorage` (cookie-mirrored when `decisionCookieName` is set), the initial-consent store over your server lane, `ensureInitialConsentResolved`, and the `isAnalyticsAllowed` tracker gate wired to the store's resolved mode (GPC read from the real navigator signal by default).

**Breaking option changes (config-first):**

- `useConsent({ policyVersion, requestedCategories?, ... })` → `useConsent({ config, ... })`. The `["analytics"]` default for `requestedCategories` is gone — the config always states the requested purposes explicitly.
- `createIsAnalyticsAllowed({ policyVersion, requestedCategories, ... })` → `createIsAnalyticsAllowed({ config, ... })`.
- `GtagConsentBootstrapOptions` / `GtmConsentBootstrapOptions` (and the `<GtagConsentBootstrap />` props): `consentStorageKey` + `policyVersion` → `config`.
- `readConsentDecisionCookie(cookieHeader, { cookieName, policyVersion })` → `readConsentDecisionCookie(cookieHeader, config)`; same for `readConsentDecisionRequestCookie(config)` (`tanstack-start`). Throws when the config names no `decisionCookieName` — a wiring bug, not "no decision". `ConsentDecisionCookieOptions` is removed.

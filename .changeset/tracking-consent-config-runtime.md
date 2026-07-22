---
"@codefast/tracking": minor
---

Collapse the consent "must match" contracts into one `ConsentConfig`, and add `createConsentRuntime`.

Previously `storageKey`, `policyVersion`, and `requestedCategories` had to be hand-threaded — matching exactly — through `useConsent`, `createIsAnalyticsAllowed`, and the gtag consent bootstrap; one drifted string was a silent consent bug. Now:

- **`ConsentConfig` + `defineConsentConfig` (root/core)** — the one bag for `storageKey`, `policyVersion`, and `requestedCategories`. Isomorphic plain data: the same object is imported on both sides.
- **`createConsentRuntime` (client)** — derives the live client instances from the config: the shared `ConsentStorage`, the initial-consent store over your server lane, `ensureInitialConsentResolved`, and the `isAnalyticsAllowed` tracker gate wired to the store's resolved mode (GPC read from the real navigator signal by default).

**Breaking option changes (config-first):**

- `useConsent({ policyVersion, requestedCategories?, ... })` → `useConsent({ config, ... })`. The `["analytics"]` default for `requestedCategories` is gone — the config always states the requested purposes explicitly.
- `createIsAnalyticsAllowed({ policyVersion, requestedCategories, ... })` → `createIsAnalyticsAllowed({ config, ... })`.
- `GtagConsentBootstrapOptions` (and the `<GtagConsentBootstrap />` props): `consentStorageKey` + `policyVersion` → `config`.

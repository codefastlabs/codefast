---
"@codefast/tracking": major
---

Rename public APIs to follow Swift API Design Guidelines (name by role; nouns for properties; imperative verbs for builders; assertion-form booleans).

**Breaking:**

- `Destination.consent` / `VercelAnalyticsDestinationOptions.consent` → `consentRequirement` (`"exempt" | "required"`).
- Analytics gate: `isTrackingAllowed` → `isAnalyticsAllowed` on `ClientTrackerOptions` and `UseConsentResult` (the gate reads the `analytics` category only). `createIsTrackingAllowed` / `CreateIsTrackingAllowedOptions` → `createIsAnalyticsAllowed` / `CreateIsAnalyticsAllowedOptions`; subpath `./client/is-tracking-allowed` → `./client/is-analytics-allowed`.
- Prompt scope option: `categories` → `requestedCategories` on `UseConsentOptions`, `CreateIsAnalyticsAllowedOptions`, and `BuildInitialConsentOptions`.
- GPC getter option: `CreateIsAnalyticsAllowedOptions.hasGlobalPrivacyControlSignal` (`() => boolean`) → `getHasGlobalPrivacyControlSignal` (boolean options and the `hasGlobalPrivacyControlSignal()` helper keep their names).
- `googleConsentBootstrapPreamble` → `buildGoogleConsentBootstrapPreamble`; `dataLayerOf` → `ensureDataLayer`.
- `UseConsentResult.save` → `saveDecision`.

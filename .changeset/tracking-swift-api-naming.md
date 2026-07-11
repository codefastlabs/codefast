---
"@codefast/tracking": major
---

Rename public APIs to follow Swift API Design Guidelines (name by role; nouns for properties; imperative verbs for builders; assertion-form booleans).

**Breaking:**

- Envelope field: `TrackEvent.props` / `PageViewEvent.props` → `properties` (and the `track`/`page` method parameters). Segment-style name; `Props` is reserved for React components.
- Analytics gate: `isTrackingAllowed` → `isAnalyticsAllowed` on `ClientTrackerOptions` and `UseConsentResult` (the gate reads the `analytics` category only). `createIsTrackingAllowed` → `createIsAnalyticsAllowed`; subpath `./client/is-tracking-allowed` → `./client/is-analytics-allowed`.
- Options naming (drop `Create*` / `Build*` filler): `CreateIsAnalyticsAllowedOptions` → `IsAnalyticsAllowedOptions`; `CreateConsentWithdrawalHandlerOptions` → `ConsentWithdrawalHandlerOptions`; `BuildInitialConsentOptions` → `InitialConsentOptions`; `BuildAnonymousIdSetCookieOptions` → `AnonymousIdSetCookieOptions`. `ClientLifecycleOptions` stays (product-named, no verb prefix).
- Prompt scope option: `categories` → `requestedCategories` on `UseConsentOptions`, `IsAnalyticsAllowedOptions`, and `InitialConsentOptions`.
- `Destination.consent` / `VercelAnalyticsDestinationOptions.consent` → `consentRequirement` (`"exempt" | "required"`).
- `googleConsentBootstrapPreamble` → `buildGoogleConsentBootstrapPreamble`; `dataLayerOf` → `ensureDataLayer`.
- `UseConsentResult.save` → `saveDecision`.
- Demote package-private deep exports: remove `./client/queue`, `./destinations/shared`, and `./destinations/google-consent` from `package.json#exports`. `EventQueue` / `EventQueueOptions` leave the `./client` barrel; `EventQueueStorage` stays (custom offline persistence). Consent Mode helpers remain on `./destinations` / `./react`.
- Options-object for multi-arg consent resolvers (clarity at the call site): `resolveDefaultConsent(mode, requestedCategories, hasGlobalPrivacyControlSignal)` → `resolveDefaultConsent(options)` and `resolveEffectiveConsent(storage, policyVersion, requestedCategories, mode, hasGlobalPrivacyControlSignal)` → `resolveEffectiveConsent(options)`; new `ResolveDefaultConsentOptions` / `ResolveEffectiveConsentOptions` types. `readStoredDecision(storage, policyVersion)` keeps its positional args.
- GA4 Measurement Protocol debug flag: `Ga4MeasurementProtocolDestinationOptions.debug` → `debugMode` (matches `debugMode` on the gtag options).
- Server `group` signature: `ServerTracker.group(groupId, traits, context)` → `group(groupId, context, traits?)` so `traits` is truly optional instead of a forced `undefined`.
- Remove `assertNever` from the public exports (generic, non-tracking helper; internal-only now).
- `readCookieValue` is now also exported from the root entry (previously only on `./core`).

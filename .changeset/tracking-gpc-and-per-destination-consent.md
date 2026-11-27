---
"@codefast/tracking": minor
---

**Breaking:** consent is now enforced per destination, and Global Privacy Control overrides a stored `ads` grant.

- A GPC signal turned on after the visitor granted `ads` now revokes it. `resolveEffectiveConsent`, `useConsent`'s
  `effectiveConsent` and the gtag bootstrap script all apply GPC last, over the stored decision as well as the region
  default. `resolveEffectiveConsent` now takes `storedDecision` (read it with `readStoredDecision`) in place of
  `storage` and `policyVersion`.
- `createClientTracker` takes `getConsent: () => ConsentDecision` in place of `isAnalyticsAllowed`, and checks each
  destination against it on every event. A destination declares what it needs with `isPermittedBy(consent)`, and the
  default is `analytics`. Meta, TikTok and Microsoft UET need `ads`, so an analytics-only grant no longer reaches an ad
  platform, and an ads grant reaches one even when analytics is denied.
- Ad destinations take `isLimitedDataUseAllowed`. Wire it to the resolved mode being `"opt-out"` to keep sending under
  Limited Data Use when `ads` is denied, as a US opt-out allows. Leave it unset under opt-in.
- `createIsAnalyticsAllowed` (`client/is-analytics-allowed`) is replaced by `createEffectiveConsentReader`
  (`client/effective-consent-reader`), which returns the whole decision. `ConsentRuntime.isAnalyticsAllowed` becomes
  `getEffectiveConsent`, and you pass it to the tracker as `getConsent`.

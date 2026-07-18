---
"@codefast/tracking": minor
---

Adds the TCF/GPP interop reconciler (spec-ad-consent-frameworks): the system **reads** an external CMP and reconciles it with the native `{ ads, analytics }` decision — it never becomes a CMP or mints TC/GPP strings. `reconcileAdFrameworkConsent({ native, cmp, hasGlobalPrivacyControlSignal })` applies the §3 precedence (a governing CMP overrides its categories; fail-closed to denied while the CMP is loading; a missing or out-of-scope CMP leaves native standing; GPC only tightens `ads`), covering conformance vectors V1–V6. `hasTcfApi`/`hasGppApi` detect the `__tcfapi`/`__gpp` read APIs without invoking them. TCF purpose ids and the Google vendor id are deliberately **not** hard-coded — that mapping is ad-ops policy, so the caller derives the `CmpConsentSignal` it passes in.

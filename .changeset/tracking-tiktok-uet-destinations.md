---
"@codefast/tracking": minor
---

Extends the ad-destination frame with two more reference vendors (spec-destinations §5), consuming the same `{ ads, analytics }` decision: `createMicrosoftUetDestination` / `toMicrosoftUetConsent` map `ads` to UET's only enforced signal, `ad_storage` (UET has no `analytics_storage`); `createTiktokDestination` / `toTiktokConsent` map `ads` to TikTok's single `limited_data_use` boolean (not Meta's `dataProcessingOptions` structure). Both take an injected `transport` (no pixel id, tag id, or network client baked in) and implement `onErasure` as cookie-clear + stop-send, since neither exposes a per-visitor deletion API. `consentRequirement` stays `"required"`.

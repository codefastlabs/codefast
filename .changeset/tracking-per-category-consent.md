---
"@codefast/tracking": minor
---

Make consent per-category, mirroring Google Consent Mode v2. `ConsentDecision` is now `{ ads: boolean, analytics: boolean }` instead of a single `"granted" | "denied"` flag, `useConsent` takes the `categories` the app's prompt asks about (`grantAll`/`denyAll`/`save` replace `grant`/`deny`), and `ConsentBanner` gains a per-category preferences layer plus a `ReactNode` message for the privacy-policy link. The GA4 helpers map the decision onto the v2 signals (`ads` drives `ad_storage`/`ad_user_data`/`ad_personalization`), take `wait_for_update`/`region`, and gain `setGoogleAdsDataRedaction`/`setGoogleUrlPassthrough`; the destination-side `includeAds` override is gone — the visitor's decision carries ads consent. `resolveDefaultConsent` replaces `shouldTrackByDefault` and honors GPC as an ads-only opt-out. Previously stored string decisions fail shape validation and re-prompt, no policy-version bump needed.

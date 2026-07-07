---
"@codefast/tracking": minor
---

Align the Google Analytics (gtag) destination with GA4's event and consent semantics.

- GA4 rejects `$`-prefixed event names, so the tracker's built-ins are now translated instead of forwarded verbatim: `$identify` → `gtag('set', { user_id })`, `$group` → the recommended `join_group` event (`group_id` param), and other invalid names are warned about and dropped instead of being sent to nowhere.
- `$page_viewed` is dropped by default — `gtag('config')` plus Enhanced Measurement (on by default in GA4 admin) already report page views, so forwarding it double-counted. Opt in with `trackPageViews: true` after disabling both.
- **`setGoogleConsentDefault`/`updateGoogleConsent` now grant `analytics_storage` only**; the `ad_*` Consent Mode v2 categories stay denied unless the new `includeAds` option is set, since an analytics-only banner never asked the visitor about ads data sharing.
- Both consent functions define the standard gtag.js queueing stub themselves, so the default signal can be issued before the tag loads — as their docs always promised.

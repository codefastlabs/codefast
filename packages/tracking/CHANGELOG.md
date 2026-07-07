# @codefast/tracking

## 0.5.0-canary.4

### Minor Changes

- [`079b8df`](https://github.com/codefastlabs/codefast/commit/079b8dfad7bd58d1d1f0d9a8ef376383544a37c2) Thanks [@thevuong](https://github.com/thevuong)! - Rebuild the consent layer on `useSyncExternalStore` and expose `data-slot` styling hooks on the consent UI.

  - `useConsent` treats the stored `ConsentRecord` as the single source of truth: the server snapshot is always "no decision yet" (hydration-safe by construction on prerendered pages), a decision made in one tab syncs to every other tab, and a record saved under an older `policyVersion` is ignored so bumping the version re-prompts as documented.
  - **Breaking:** `ConsentStorage` gains a required `subscribe(listener)` method — custom implementations must notify on changes. `createLocalStorageConsentStorage` implements it (same-tab saves plus the cross-tab `storage` event) and now degrades a blocked `localStorage` (private mode/quota) to a session-scoped in-memory record instead of re-prompting in a loop.
  - **Breaking:** `ConsentBanner` renders a labeled region instead of a non-modal `<dialog>` (which neither traps focus nor blocks, so the dialog semantics over-promised). Both components extend their host element's `ComponentProps` and expose `data-slot` attributes (`consent-message`, `consent-actions`, `consent-action`, `consent-toggle`) for Tailwind `**:data-[slot=...]` styling.

- [`41951df`](https://github.com/codefastlabs/codefast/commit/41951dfe97776bb0147e4ce766c9162327ef53b4) Thanks [@thevuong](https://github.com/thevuong)! - Expose the stored decision from `useConsent` and ignore tampered consent records.

  - `UseConsentResult` gains `decision` — the stored decision under the current policy version, `undefined` until the visitor makes one. Consumers need it to replay a returning visitor's decision into Google Consent Mode (e.g. from an effect) without conflating "denied" with "no decision yet", which the boolean `isTrackingAllowed` cannot distinguish.
  - `useConsent` now counts only a well-formed `decision` (`"granted"`/`"denied"`): the record is tamperable plain JSON, and a garbage value re-prompts instead of silently denying. This matches how a pre-hydration Consent Mode bootstrap reading the same record should treat it.
  - Documented that `createLocalStorageConsentStorage` persists the record as plain `JSON.stringify(ConsentRecord)` — a stable contract, so inline scripts can read the decision synchronously before any tag fires.

- [`079b8df`](https://github.com/codefastlabs/codefast/commit/079b8dfad7bd58d1d1f0d9a8ef376383544a37c2) Thanks [@thevuong](https://github.com/thevuong)! - Align the Google Analytics (gtag) destination with GA4's event and consent semantics.

  - GA4 rejects `$`-prefixed event names, so the tracker's built-ins are now translated instead of forwarded verbatim: `$identify` → `gtag('set', { user_id })`, `$group` → the recommended `join_group` event (`group_id` param), and other invalid names are warned about and dropped instead of being sent to nowhere.
  - `$page_viewed` is dropped by default — `gtag('config')` plus Enhanced Measurement (on by default in GA4 admin) already report page views, so forwarding it double-counted. Opt in with `trackPageViews: true` after disabling both.
  - **`setGoogleConsentDefault`/`updateGoogleConsent` now grant `analytics_storage` only**; the `ad_*` Consent Mode v2 categories stay denied unless the new `includeAds` option is set, since an analytics-only banner never asked the visitor about ads data sharing.
  - Both consent functions define the standard gtag.js queueing stub themselves, so the default signal can be issued before the tag loads — as their docs always promised.

- [`079b8df`](https://github.com/codefastlabs/codefast/commit/079b8dfad7bd58d1d1f0d9a8ef376383544a37c2) Thanks [@thevuong](https://github.com/thevuong)! - Correlate GA4 Measurement Protocol hits with gtag.js's own identifiers.

  GA4 joins hits on gtag's client ID (the `_ga` cookie), not on an app-generated anonymous ID — MP events sent with our ID landed on a different GA4 user than the visitor's client-side hits. New `extractGa4ClientId`/`extractGa4SessionId` helpers read gtag's `_ga`/`_ga_<stream>` request cookies (both GS1 and GS2 formats) so the destination can echo them via the new `clientId`/`sessionId` options. Events now also carry `engagement_time_msec`, `session_id`, and `timestamp_micros` — without them GA4 accepts the hit but leaves it out of realtime and session-scoped reports, and retried events drift to receipt time. `$group` maps to `join_group`; `$alias` is dropped (GA4 merges identities via `user_id`).

- [`079b8df`](https://github.com/codefastlabs/codefast/commit/079b8dfad7bd58d1d1f0d9a8ef376383544a37c2) Thanks [@thevuong](https://github.com/thevuong)! - Deliver events to SDK-backed destinations at track time instead of through the batching queue.

  `Destination` gains an optional `delivery: "immediate" | "queued"` field. The Google Analytics and Vercel destinations are marked `"immediate"` — their SDKs own batching and unload delivery, so routing them through the queue only delayed events and replayed stale ones next session with wrong timestamps. The queue keeps serving HTTP destinations and the `flushWithBeacon` path unchanged.

- [`2ebb0c0`](https://github.com/codefastlabs/codefast/commit/2ebb0c0202891297f75525156b57ed9b2040ab82) Thanks [@thevuong](https://github.com/thevuong)! - Make consent per-category, mirroring Google Consent Mode v2. `ConsentDecision` is now `{ ads: boolean, analytics: boolean }` instead of a single `"granted" | "denied"` flag, `useConsent` takes the `categories` the app's prompt asks about (`grantAll`/`denyAll`/`save` replace `grant`/`deny`), and `ConsentBanner` gains a per-category preferences layer plus a `ReactNode` message for the privacy-policy link. The GA4 helpers map the decision onto the v2 signals (`ads` drives `ad_storage`/`ad_user_data`/`ad_personalization`), take `wait_for_update`/`region`, and gain `setGoogleAdsDataRedaction`/`setGoogleUrlPassthrough`; the destination-side `includeAds` override is gone — the visitor's decision carries ads consent. `resolveDefaultConsent` replaces `shouldTrackByDefault` and honors GPC as an ads-only opt-out. Previously stored string decisions fail shape validation and re-prompt, no policy-version bump needed.

### Patch Changes

- [`46c32d6`](https://github.com/codefastlabs/codefast/commit/46c32d6a5dfcfbccd5e1b3dd6a5488cb84b31b6a) Thanks [@thevuong](https://github.com/thevuong)! - Default `engagement_time_msec` on Measurement Protocol events to 100ms — the fallback Google's own MP documentation prescribes when the elapsed time since the previous event is unknown — instead of 1ms.

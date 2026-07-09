---
"@codefast/tracking": patch
---

Fix bugs found in review of the consent-gated tracking pipeline, and dedupe the GA4/Vercel destinations.

`createClientTracker`'s `identify()` no longer commits `userId` to the tracker's closure while consent is denied — a denied `identify` could otherwise leak its `userId` onto a later, allowed `track`/`page`/`group` call. `createServerTracker`'s per-request `eventId` derivation now factors in `userId`, so two `alias()` calls with the same `previousId` but different merge targets in one request no longer collide on `eventId`. `createLocalStorageQueueStorage.load()` now drops pre-migration/malformed queue records via a new `isTrackedEvent` guard (exported from `@codefast/tracking/core`), instead of relying on each destination's `switch` to silently no-op on an unrecognized shape.

Also: the GA4 (`gtag`/Measurement Protocol) and Vercel Analytics destinations now share one prop-flattening helper and one `group`→`join_group` mapping (`@codefast/tracking/destinations`'s internal `shared.ts`) instead of three near-duplicate implementations; `buildGtagConsentBootstrapScript`'s pre-hydration Consent Mode signal mapping is generated from the same table `toGoogleConsentParams` uses instead of a hand-duplicated literal; and the package's `ensureGtag` gtag.js stub helper, plus a new `loadGtagScript(options)` (loads gtag.js on demand, idempotent), are now exported so apps don't have to reimplement on-demand script loading themselves.

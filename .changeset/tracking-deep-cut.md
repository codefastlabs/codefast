---
"@codefast/tracking": major
---

Cut every lane that shipped with zero consumer call sites — the package now covers exactly a consented gtag + Vercel Analytics setup on TanStack Start, and nothing speculative. Removed (recoverable from git history when a real need returns):

- **Server-side tracking**: `createServerTracker`, the beacon relay/ingest lane (`relayTrackedEvents`, `createTrackedEventIngestHandler`), `deriveEventId`, the consent-cookie mirror (`withConsentCookieMirror`, codec, `readConsentDecisionCookie`/`readConsentDecisionRequestCookie`), `ConsentConfig.decisionCookieName`, and the GA4 Measurement Protocol destination (its subpath included).
- **Offline queue machinery**: `EventQueue`, `createLocalStorageQueueStorage`, `attachClientLifecycle`, `flushWithBeacon`, `createHttpDestination`, `Destination.delivery`/`sendBatch` — every real destination (gtag.js, Vercel) owns its own in-page queue and unload delivery.
- **Segment-style event kinds**: `identify`/`group`/`alias`/`page` on the tracker and the envelope union, `EventDefinition.owner` + `EventsOf` (with no server side there is nothing to split), `attachRouterPageTracking` — page views belong to gtag `config` + Enhanced Measurement and Vercel's native `<Analytics />`.
- **GTM**: destination, bootstrap, loader.
- **Unused gtag helpers**: `setGoogleConsentDefault`, `setGoogleAdsDataRedaction`, `setGoogleUrlPassthrough`, `extractGa4ClientId`/`extractGa4SessionId`.

Follow-on API changes: `ClientTracker` is now `track()` only (`clear()` had nothing left to clear, so `ConsentWithdrawalHandlerOptions.clearTracker` is gone too); catalogs drop the `owner` tag (`{ schema }` only); `TrackedEvent` is the `track` envelope alone, still discriminated on `type` so a future kind is additive.

---
"@codefast/tracking": minor
---

Modernize the package around server-first React frameworks and shrink what the client pays for.

Breaking (pre-release):

- Event catalogs now accept any Standard Schema library (zod, `zod/mini`, valibot) — `EventDefinition` is typed on `StandardSchemaV1`, validation runs through the new `assertValidEventProps`, and `zod` is no longer a dependency (`@standard-schema/spec` is the only one).
- `buildInitialConsent` → `resolveInitialConsent`; `ServerTrackContext` → `ServerTrackerContext`.
- `attachClientLifecycle` drops `flushIntervalMs` — the queue schedules its own flushes (one-shot idle timer armed only while events are pending, offline-aware); the lifecycle keeps hide/pagehide delivery (beacon, or a keepalive `fetch` fallback) and flush-on-reconnect.
- The `./destinations` barrel is browser-lane only: import `createVercelAnalyticsDestination` from `./destinations/vercel-analytics` (its top-level `@vercel/analytics` import made the optional peer mandatory for barrel consumers) and `createGa4MeasurementProtocolDestination` from its own subpath.
- `./server`, `./server/*`, `./tanstack-start`, and `./destinations/ga4-measurement-protocol` are server-only by contract: on TanStack Start, deny them in the client environment via `importProtection.client.specifiers` (README shows the config) so a leak fails the build with a traced violation instead of silently shipping server code or the GA4 `apiSecret`.

New:

- `@codefast/tracking/tanstack-start` (optional peer on `@tanstack/react-start`): `resolveInitialConsentFromRequest`, `setAnonymousIdResponseCookie`/`clearAnonymousIdResponseCookie`, `readAnonymousIdRequestCookie`, `readConsentDecisionRequestCookie`, `resolveServerTrackerContextFromRequest` — consumers' server functions become one-liners.
- `createInitialConsentStore` (client) + `useInitialConsent` (react): the whole post-hydration region-resolution lane — strictest-until-resolved, single-flight, per-session cache validated by the new `isInitialConsent` guard, fail-closed-but-retryable errors, retry on tab-visible.
- `createServerTracker`: `waitUntil` hands delivery (and its retry ladder) to the platform's post-response scheduler; `withContext` binds per-request identity once.
- Beacon receive half: `relayTrackedEvents` + `createTrackedEventIngestHandler` (`Request → Response`) validate client envelopes, re-stamp server-read identity, and keep client `eventId`s so re-sent beacons dedupe.
- Consent-aware server tracking: consent-cookie codec (core), `withConsentCookieMirror` (client), `readConsentRecordCookie`/`readConsentDecisionCookie` (server).
- Transport hardening: `requestTimeoutMs` (default 10s) on the fetch destinations, `keepalive` threading for unload flushes, `Destination.sendBatch` (implemented by `createHttpDestination` — one POST per queue flush).
- `CookieAnonymousId.refresh()` prolongs an existing id without ever minting; `STRICTEST_INITIAL_CONSENT`, `CONSENT_REGIONS`, `isConsentRegion` are exported from core; the localStorage consent storage caches parsed records behind a raw-string compare; client-only react modules ship `"use client"`.

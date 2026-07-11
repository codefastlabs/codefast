# @codefast/tracking

## 1.0.0-canary.6

### Major Changes

- [#565](https://github.com/codefastlabs/codefast/pull/565) [`1e80096`](https://github.com/codefastlabs/codefast/commit/1e800961f956fdc5f23c434c1bf6f9bedb6f187b) Thanks [@thevuong](https://github.com/thevuong)! - Remove `defaultConsentExpression` from gtag/GTM consent bootstraps. Pass a literal `defaultConsent` (strictest bake on shared HTML) and upgrade after hydration via the server-fn lane + `updateGoogleConsent`.

- [#567](https://github.com/codefastlabs/codefast/pull/567) [`74c52ac`](https://github.com/codefastlabs/codefast/commit/74c52acf675225cfa50c73403644ff983166c82d) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the consent "must match" contracts into one `ConsentConfig`, and add `createConsentRuntime`.

  Previously `storageKey`, `policyVersion`, and `requestedCategories` had to be hand-threaded — matching exactly — through `useConsent`, `createIsAnalyticsAllowed`, and the gtag consent bootstrap; one drifted string was a silent consent bug. Now:

  - **`ConsentConfig` + `defineConsentConfig` (root/core)** — the one bag for `storageKey`, `policyVersion`, and `requestedCategories`. Isomorphic plain data: the same object is imported on both sides.
  - **`createConsentRuntime` (client)** — derives the live client instances from the config: the shared `ConsentStorage`, the initial-consent store over your server lane, `ensureInitialConsentResolved`, and the `isAnalyticsAllowed` tracker gate wired to the store's resolved mode (GPC read from the real navigator signal by default).

  **Breaking option changes (config-first):**

  - `useConsent({ policyVersion, requestedCategories?, ... })` → `useConsent({ config, ... })`. The `["analytics"]` default for `requestedCategories` is gone — the config always states the requested purposes explicitly.
  - `createIsAnalyticsAllowed({ policyVersion, requestedCategories, ... })` → `createIsAnalyticsAllowed({ config, ... })`.
  - `GtagConsentBootstrapOptions` (and the `<GtagConsentBootstrap />` props): `consentStorageKey` + `policyVersion` → `config`.

- [#567](https://github.com/codefastlabs/codefast/pull/567) [`74c52ac`](https://github.com/codefastlabs/codefast/commit/74c52acf675225cfa50c73403644ff983166c82d) Thanks [@thevuong](https://github.com/thevuong)! - Cut every lane that shipped with zero consumer call sites — the package now covers exactly a consented gtag + Vercel Analytics setup on TanStack Start, and nothing speculative. Removed (recoverable from git history when a real need returns):

  - **Server-side tracking**: `createServerTracker`, the beacon relay/ingest lane (`relayTrackedEvents`, `createTrackedEventIngestHandler`), `deriveEventId`, the consent-cookie mirror (`withConsentCookieMirror`, codec, `readConsentDecisionCookie`/`readConsentDecisionRequestCookie`), `ConsentConfig.decisionCookieName`, and the GA4 Measurement Protocol destination (its subpath included).
  - **Offline queue machinery**: `EventQueue`, `createLocalStorageQueueStorage`, `attachClientLifecycle`, `flushWithBeacon`, `createHttpDestination`, `Destination.delivery`/`sendBatch` — every real destination (gtag.js, Vercel) owns its own in-page queue and unload delivery.
  - **Segment-style event kinds**: `identify`/`group`/`alias`/`page` on the tracker and the envelope union, `EventDefinition.owner` + `EventsOf` (with no server side there is nothing to split), `attachRouterPageTracking` — page views belong to gtag `config` + Enhanced Measurement and Vercel's native `<Analytics />`.
  - **GTM**: destination, bootstrap, loader.
  - **Unused gtag helpers**: `setGoogleConsentDefault`, `setGoogleAdsDataRedaction`, `setGoogleUrlPassthrough`, `extractGa4ClientId`/`extractGa4SessionId`.

  Follow-on API changes: `ClientTracker` is now `track()` only (`clear()` had nothing left to clear, so `ConsentWithdrawalHandlerOptions.clearTracker` is gone too); catalogs drop the `owner` tag (`{ schema }` only); `TrackedEvent` is the `track` envelope alone, still discriminated on `type` so a future kind is additive.

- [#567](https://github.com/codefastlabs/codefast/pull/567) [`74c52ac`](https://github.com/codefastlabs/codefast/commit/74c52acf675225cfa50c73403644ff983166c82d) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the export map to group entries — per-file subpaths froze the internal file layout into public API.

  **Breaking:** deep subpaths (`./client/*`, `./core/*`, `./server/*`, `./react/*`, and per-file `./destinations/*`) no longer resolve. Import from the group entry instead:

  - `@codefast/tracking/core` and `@codefast/tracking/core/*` → `@codefast/tracking` (the root has always re-exported the whole isomorphic core surface).
  - `@codefast/tracking/client/*` → `@codefast/tracking/client`; same pattern for `server` and `react`.
  - Google helpers → `@codefast/tracking/destinations`.

  One destination keeps a dedicated subpath on purpose: `@codefast/tracking/destinations/vercel-analytics` — its top-level `@vercel/analytics` import would make the optional peer mandatory for every barrel consumer.

  All entries are unbundled ESM with `sideEffects: false`, so group imports tree-shake per file — the trim changes what is addressable, not what ships.

- [#565](https://github.com/codefastlabs/codefast/pull/565) [`1e80096`](https://github.com/codefastlabs/codefast/commit/1e800961f956fdc5f23c434c1bf6f9bedb6f187b) Thanks [@thevuong](https://github.com/thevuong)! - Remove the deprecated edge-middleware cookie bootstrap path:

  - Drop `buildInitialConsentBootstrapScript` and the `@codefast/tracking/destinations/initial-consent-bootstrap` subpath.
  - Resolve region consent via a server function (`resolveInitialConsent`) plus a client snapshot instead — see `apps/ui` `visitor-consent.ts` / `resolve-visitor-consent.ts`.

- [#565](https://github.com/codefastlabs/codefast/pull/565) [`1e80096`](https://github.com/codefastlabs/codefast/commit/1e800961f956fdc5f23c434c1bf6f9bedb6f187b) Thanks [@thevuong](https://github.com/thevuong)! - Rename public APIs to follow Swift API Design Guidelines (name by role; nouns for properties; imperative verbs for builders; assertion-form booleans).

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

### Minor Changes

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Switch gtag/GTM bootstraps to Google Consent Mode **advanced**:

  - `buildGtagConsentBootstrapScript` / `buildGtmConsentBootstrapScript` always set Consent Mode v2 `default` (from stored decision or region fallback), then **always** load gtag.js / gtm.js — even when analytics/ads storage is denied — so cookieless pings and consent modeling can run.
  - Runtime grants/denies still use `updateGoogleConsent`; `loadGtagScript` / `loadGtmScript` remain idempotent safety nets when the bootstrap did not run.
  - The package's first-party consent gate is unchanged — identifiers and non-exempt destinations stay blocked without consent; only Google tag _script loading_ changes.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Tighten the package's API contracts and framework independence, found in an architecture audit.

  **Breaking:**

  - `ClientTrackerOptions.anonymousId` is now `() => string` only — the plain-`string` form is removed. A resolver was already the documented best practice (defers minting an id until an event is actually allowed to send); the string form let callers accidentally mint one as an import-time side effect. Wrap a stable value in a resolver: `anonymousId: () => myId`.
  - `Destination.send` now always returns `Promise<void>` — the previous `Promise<void> | void` let sync and async destinations disagree on contract. Mark a synchronous `send` `async` so a thrown error rejects the returned promise instead of throwing synchronously.

  **Also:**

  - `createVercelAnalyticsDestination` now imports `track` from the framework-agnostic `@vercel/analytics` instead of `@vercel/analytics/react` — the destination renders nothing, so it had no reason to depend on React.
  - Adds `assertNever` (`@codefast/tracking/core`) and wires it into the `default` case of every `switch (event.type)` across the GA4/Vercel destinations — extending `TrackedEvent` with a new variant now fails to compile at every switch instead of silently falling through.
  - The package root (`@codefast/tracking`) now re-exports `#/core`'s surface by explicit name instead of `export *`, matching the `client`/`server`/`destinations`/`react` subpaths, which were already explicit.
  - `useConsent`'s returned object and its `save`/`denyAll`/`grantAll` callbacks are now memoized (`useMemo`/`useCallback`), so a consumer passing the hook's result down as a prop or effect dependency doesn't get a new reference every render.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Gate the client tracker on consent and keep destinations from leaking pre-consent or duplicate data.

  `createClientTracker` gains `isTrackingAllowed?: () => boolean`, consulted per event — while it returns `false` nothing is sent or queued, so a mid-session consent change applies immediately. `anonymousId` also accepts a `() => string` resolver, invoked only when an event is actually allowed to send, so apps can defer minting an identifier cookie until consent exists. `storage` is now optional; without it the queue lives in memory only instead of persisting to `localStorage`. The Vercel destination takes an options object (`{ name?, trackPageViews? }` replaces the positional name), drops `$page_viewed` unless `trackPageViews` is on — the mounted `<Analytics />` component already tracks page views natively — and drops `$identify`/`$group`, which Vercel Analytics has no identity API to translate to. The global `gtag` type gains the `config` and `js` command signatures so apps can queue them directly, e.g. when loading gtag.js on demand for basic Consent Mode.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Consent internals cleanup. The gtag and GTM bootstraps now share one preamble builder (`googleConsentBootstrapPreamble` — generated output unchanged), `toGoogleConsentParams` derives from the signal map instead of hand-writing it, the runtime consent setters (`updateGoogleConsent`, `setGoogleConsentDefault`, `setGoogleAdsDataRedaction`, `setGoogleUrlPassthrough`) accept a `dataLayerName`, `VercelAnalyticsDestinationOptions` is exported from the destinations barrel, and the cookie-string parser is shared as `readCookieValue` (`@codefast/tracking/core/cookie`). Removed never-consumed exports: `GOOGLE_CONSENT_SIGNAL_CATEGORIES`, `GoogleConsentSignal`, `isGa4EventName`, `consentDecisionShapeCheckExpression`, `consentSignalAssignmentsExpression`.

- [#565](https://github.com/codefastlabs/codefast/pull/565) [`1e80096`](https://github.com/codefastlabs/codefast/commit/1e800961f956fdc5f23c434c1bf6f9bedb6f187b) Thanks [@thevuong](https://github.com/thevuong)! - `resolveInitialConsent` (née `buildInitialConsent`) now fails closed for a missing country code: an unknown visitor (prerender crawl, host without a geo header) resolves to the strictest opt-in default instead of `"other"`'s analytics-granted opt-out. A known non-EU country still resolves to opt-out — unknown is not known-elsewhere. Behavior change only for callers that passed `countryCode: undefined` and relied on the opt-out fallback; callers that guarded the missing case themselves can drop the guard.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Improve gtag/GTM loader DX without changing consent-first loading:

  - `ensureGtag` / `loadGtagScript` / `buildGtagConsentBootstrapScript` accept optional `dataLayerName`, `nonce` (CSP), and `debugMode`.
  - Add `createGoogleTagManagerDestination`, `buildGtmConsentBootstrapScript`, and `loadGtmScript` for consent-gated GTM.
  - Add `<GtagConsentBootstrap />` — a framework-agnostic inline script wrapper for the pre-hydration bootstrap.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Rename the `http-destination` module to `http`, matching the `create<X>Destination` file-naming convention used by every other destination. Breaking for deep imports only: `@codefast/tracking/destinations/http-destination` is now `@codefast/tracking/destinations/http`; imports from the `@codefast/tracking/destinations` barrel are unaffected.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Add three helpers that pull common consent/tracking wiring out of consumer apps and into the package:

  - `resolveEffectiveConsent(storage, policyVersion, categories, mode, hasGpc)` and `readStoredDecision(storage, policyVersion)` (`@codefast/tracking/core`) — the same "stored decision, else region default" rule `useConsent` applies internally, now exposed so a non-React gate (e.g. a tracker's `isTrackingAllowed` option) doesn't have to reimplement it by hand.
  - `buildGtagConsentBootstrapScript(options)` (`@codefast/tracking/destinations`) — generates the pre-hydration `<script>` source that applies Google Consent Mode v2's default signal from the stored decision (or a supplied fallback) and conditionally loads gtag.js, replacing a hand-written JS string per app.
  - `createCookieAnonymousId(options)` (`@codefast/tracking/client`) — an opt-in `document.cookie`-backed anonymous id `getOrCreate`/`clear` pair for apps that don't need a custom identity strategy.

  None of these change existing exports' behavior; `useConsent` is refactored internally to use `readStoredDecision` but its output is unchanged.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Rename `UseConsentResult.needsPrompt` to `isPromptNeeded` — a boolean should read as an assertion, matching `isTrackingAllowed` on the same result (Swift API Design Guidelines pass).

  **Breaking:** consumers of `useConsent`/`ConsentBanner` reading `needsPrompt` must switch to `isPromptNeeded`.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Add `deriveEventId(requestId, discriminant)` (`@codefast/tracking/core`) and wire it into `createServerTracker`: pass `requestId` on `ServerTrackerContext` to make a server-owned event's `eventId` deterministic instead of random. Retrying the same request with the same `track`/`group`/`alias` call now reproduces the same `eventId`, so a destination that dedupes on it treats the retry as a no-op instead of double-counting — closing the gap between the package's documented idempotency intent and its previous always-random default. Omitting `requestId` keeps the existing random behavior, so this is additive and non-breaking.

- [#566](https://github.com/codefastlabs/codefast/pull/566) [`ffd777c`](https://github.com/codefastlabs/codefast/commit/ffd777c13a66a377bee287fbb9cd692056b6a6cc) Thanks [@thevuong](https://github.com/thevuong)! - Modernize the package around server-first React frameworks and shrink what the client pays for.

  Breaking (pre-release):

  - Event catalogs now accept any Standard Schema library (zod, `zod/mini`, valibot) — `EventDefinition` is typed on `StandardSchemaV1`, validation runs through the new `assertValidEventProperties`, and `zod` is no longer a dependency (`@standard-schema/spec` is the only one).
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

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Add server-persisted anonymous id ("client mints, server persists"). `createServerPersistedAnonymousId` (client) keeps the lazy, post-consent minting of `createCookieAnonymousId` and delegates the durable cookie write to an app-supplied server round-trip, so the id outlives Safari ITP's 7-day cap on script-written cookies. The server half — `readAnonymousIdCookie`, `buildAnonymousIdSetCookie`, `buildClearAnonymousIdSetCookie`, `isValidAnonymousId` — is framework-agnostic string-in/string-out: always `Secure; SameSite=Lax`, validates the cookie name, and throws on any non-UUID id so a public persist endpoint can never echo attacker input into a response header. The server persists and prolongs an id the client hands it; it never mints one per request.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Add a TanStack Start wiring kit so consumer apps no longer hand-roll consent/bootstrap glue:

  - `resolveInitialConsent` (née `buildInitialConsent`) + exported `EU_COUNTRY_CODES` / `OPT_IN_EQUIVALENT_COUNTRY_CODES` (`@codefast/tracking/server`) — region → mode → default decision for server functions (or a fail-closed bake when country is unknown).
  - `clearGoogleAnalyticsCookies` (`@codefast/tracking/destinations`) — expire `_ga` / `_ga_*` on consent withdrawal.
  - `createIsTrackingAllowed` / `createConsentWithdrawalHandler` (`@codefast/tracking/client`) — tracker gate + revoke clears.
  - `useGoogleConsentSync` (`@codefast/tracking/react`) — Consent Mode `update` + optional gtag load, including cross-tab / privacy-page decisions.

  `InitialConsent` is exported from `@codefast/tracking` / `@codefast/tracking/core`. None of these change existing export behavior.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Discriminate event envelopes by `type` and add a consent-exempt destination lane.

  `TrackedEvent` is now a union discriminated on `type: "track" | "page" | "identify" | "group" | "alias"` (Segment-style) instead of encoding built-ins into `$`-prefixed magic names — destinations translate each kind into their own vocabulary via an exhaustive `switch` (`identify` carries `traits`, `group` carries `groupId`/`traits`, `alias` carries `previousId`), and the app-chosen `name` only exists on `track`/`page`. This changes the wire format seen by HTTP destinations and the queue storage; stale queue records without a `type` are dropped silently. `Destination` gains `consent?: "exempt" | "required"` — while the tracker's consent gate is closed, exempt immediate destinations keep receiving `track`/`page` events stripped of `anonymousId`/`userId` (identity kinds and queueing stay fully gated), so cookieless sinks like Vercel Analytics can keep counting interactions without consent-gated identifiers. The Vercel destination accepts the flag via its options and still defaults to `"required"`.

### Patch Changes

- [#565](https://github.com/codefastlabs/codefast/pull/565) [`1e80096`](https://github.com/codefastlabs/codefast/commit/1e800961f956fdc5f23c434c1bf6f9bedb6f187b) Thanks [@thevuong](https://github.com/thevuong)! - Prefer the live anonymous-id cookie over the in-memory cache so a cross-tab consent withdrawal cannot revive the pre-withdrawal identity on re-grant.

- [#563](https://github.com/codefastlabs/codefast/pull/563) [`bad015c`](https://github.com/codefastlabs/codefast/commit/bad015c8237182b24ef24304ddcd0f939f917c1e) Thanks [@thevuong](https://github.com/thevuong)! - Fix bugs found in review of the consent-gated tracking pipeline, and dedupe the GA4/Vercel destinations.

  `createClientTracker`'s `identify()` no longer commits `userId` to the tracker's closure while consent is denied — a denied `identify` could otherwise leak its `userId` onto a later, allowed `track`/`page`/`group` call. `createServerTracker`'s per-request `eventId` derivation now factors in `userId`, so two `alias()` calls with the same `previousId` but different merge targets in one request no longer collide on `eventId`. `createLocalStorageQueueStorage.load()` now drops pre-migration/malformed queue records via a new `isTrackedEvent` guard (exported from `@codefast/tracking/core`), instead of relying on each destination's `switch` to silently no-op on an unrecognized shape.

  Also: the GA4 (`gtag`/Measurement Protocol) and Vercel Analytics destinations now share one prop-flattening helper and one `group`→`join_group` mapping (`@codefast/tracking/destinations`'s internal `shared.ts`) instead of three near-duplicate implementations; `buildGtagConsentBootstrapScript`'s pre-hydration Consent Mode signal mapping is generated from the same table `toGoogleConsentParams` uses instead of a hand-duplicated literal; and the package's `ensureGtag` gtag.js stub helper, plus a new `loadGtagScript(options)` (loads gtag.js on demand, idempotent), are now exported so apps don't have to reimplement on-demand script loading themselves.

- [#565](https://github.com/codefastlabs/codefast/pull/565) [`1e80096`](https://github.com/codefastlabs/codefast/commit/1e800961f956fdc5f23c434c1bf6f9bedb6f187b) Thanks [@thevuong](https://github.com/thevuong)! - Guard `createLocalStorageConsentStorage` with `isConsentRecord` so malformed localStorage JSON cannot be treated as a valid consent record.

- [#565](https://github.com/codefastlabs/codefast/pull/565) [`1e80096`](https://github.com/codefastlabs/codefast/commit/1e800961f956fdc5f23c434c1bf6f9bedb6f187b) Thanks [@thevuong](https://github.com/thevuong)! - Skip `clearOnServer` when the anonymous-id cookie is already gone, so a second withdrawal clear in the same tick does not fire a redundant server round-trip.

## 0.5.0-canary.5

### Minor Changes

- [`08f10fb`](https://github.com/codefastlabs/codefast/commit/08f10fb6f4f16e175557fac1adeb5b480dc691db) Thanks [@thevuong](https://github.com/thevuong)! - Rebuild `ConsentBanner` as composable compound parts (`ConsentBannerTitle`/`Description`/`Actions`/`Accept`/`Reject`/`Customize`/`Preferences`/`Category`/`Save`) — the root owns visibility (`needsPrompt`, overridable via `open` for a "Cookie settings" reopen) and the preferences-layer state, action parts wire their own clicks and compose the consumer's `onClick`, so any markup including a design system's button styles slots in via `className`. The monolithic `message`/`acceptLabel`/`categories` props are gone. An optional plain-CSS default theme ships at `@codefast/tracking/css/consent.css` — data-slot selectors, `--consent-*` custom properties with `light-dark()` fallbacks, zero Tailwind dependency.

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

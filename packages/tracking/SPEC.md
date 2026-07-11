# @codefast/tracking — Spec

Status: draft. Fullstack event tracking library for apps built on TanStack Start (isomorphic client + server).

## 1. Goals / Non-goals

**Goals**

- Type-safe `track()` across client and server, backed by a per-app Standard Schema event catalog.
- Multi-destination fan-out (PostHog, GA4, ...) without changing call sites.
- Consent-first: no tracking before a lawful basis exists for the visitor's region.
- Correct identity correlation between client-side and server-side events.

**Non-goals (Phase 1)**

- Self-hosted event storage (Postgres/ClickHouse) — architecture stays destination-agnostic so this can be added later as one more destination.
- Sampling, rate limiting, dedup-at-ingestion — revisit once volume requires it.

## 2. Architecture

```
@codefast/tracking
├── core          # event catalog types, EventsOf filter, id generation, consent state machine, cookie parser
├── client        # browser: batching queue, sendBeacon, localStorage persistence, router hook, anon-id cookie
├── server        # node: server-function/middleware helpers, region detection, anon-id Set-Cookie builders
├── destinations  # provider adapters (gtag, GTM, GA4 MP, Vercel, HTTP) + Consent Mode bootstraps
├── react         # headless consent UI (useConsent, ConsentBanner, ConsentToggle)
└── css           # optional plain-CSS theme for the react parts
```

Each app defines its own event catalog (schemas + owner tag) and passes it into `createClientTracker` / `createServerTracker`. The package ships no hardcoded events. Since 2026-07-11 the schema contract is [Standard Schema](https://standardschema.dev) (`@standard-schema/spec` is the package's only dependency): any conforming library works — zod, `zod/mini`, valibot — and validation runs through `assertValidEventProperties` (sync `~standard.validate`; async schemas throw by design, and the validated value is discarded so transforms can never desync client and server).

### 2.1 Event catalog & generics

```ts
interface EventDefinition<Schema extends StandardSchemaV1 = StandardSchemaV1> {
  schema: Schema;
  owner: "client" | "server";
}

type EventCatalog = Record<string, EventDefinition>;

// Type-level filter — enforces ownership at compile time, not just convention.
type EventsOf<Catalog extends EventCatalog, Owner extends "client" | "server"> = {
  [Key in keyof Catalog as Catalog[Key]["owner"] extends Owner ? Key : never]: Catalog[Key];
};

function createClientTracker<Catalog extends EventCatalog>(catalog: Catalog) {
  type ClientEvents = EventsOf<Catalog, "client">;

  return {
    track<Name extends keyof ClientEvents>(
      name: Name,
      properties: StandardSchemaV1.InferOutput<ClientEvents[Name]["schema"]>,
    ): void {
      assertValidEventProperties(catalog[name].schema, String(name), properties);
      // ...enqueue/send
    },
  };
}
```

`createServerTracker` mirrors this, filtered to `EventsOf<Catalog, "server">`. Calling a server-owned event from the client tracker (or vice versa) is a type error, not a runtime surprise.

**Conventions (repo-wide, apply here too):**

- No `I`/`T` prefix on interfaces/types or generic params — `EventDefinition`, `Catalog`, `Schema`, `Owner`, not `IEventDefinition`/`TCatalog`.
- No `any` anywhere in the public API surface.
- Schemas: any Standard Schema v1 library. The repo's own catalogs use zod v4 (`zod: ^4.4.3`, workspace catalog); `apps/ui` uses `zod/mini` to keep zod classic out of its client bundle. zod is a devDependency here (tests only).

### 2.2 Public API surface

| Function                    | Where          | Purpose                                                                           |
| --------------------------- | -------------- | --------------------------------------------------------------------------------- |
| `track(name, properties)`   | client, server | fire a catalog event, 2-arg call style                                            |
| `identify(userId, traits)`  | client         | attach traits to the current user; local to the tracker instance, not server-side |
| `page(name?, properties?)`  | client         | page/route view — driven by `router.subscribe('onResolved', ...)`, not `popstate` |
| `group(groupId, traits)`    | client, server | B2B account-level association                                                     |
| `alias(previousId, userId)` | server         | explicit anonymous → known-user merge, when `identify` timing can't do it         |

## 3. Identity & correlation

- **Caller-owned, not package-owned**: `createClientTracker`/`createServerTracker` take `anonymousId` as a required option (a string on the server; a `() => string` callback on the client, invoked per allowed event) — the package never mints or persists an ID itself. The app is responsible for generating a stable visitor ID and making it readable on both client and server (e.g. a cookie), so the same ID joins client and server events downstream.
- **Server-persisted anon-id cookie — implemented ("client mints, server persists")**: Safari ITP caps `document.cookie`-written cookies at 7 days, so a purely client-written id silently churns weekly there. `createServerPersistedAnonymousId` (client) wraps `createCookieAnonymousId` — same lazy, post-consent minting and optimistic client write — and additionally fires an app-supplied `persist(id)` round-trip (at most once per page load, also for a pre-existing cookie) so the server re-issues the cookie via `Set-Cookie` and rolls its expiry forward; `clearOnServer` is the withdrawal half. Failures degrade to the client-written cookie. The server side is framework-agnostic string-in/string-out in `server/anonymous-id-cookie` (`readAnonymousIdCookie` / `buildAnonymousIdSetCookie` / `buildClearAnonymousIdSetCookie` / `isValidAnonymousId`): builders always emit `Secure; SameSite=Lax`, validate the cookie name, and **throw on any non-UUID id** — the persist endpoint is public, so nothing it echoes into a header may be attacker-shaped. The server persists and prolongs an id the client hands it; it never mints one per request (consent lives client-side, so an unconditional server-set id would predate consent). Reference adapter: `apps/ui`'s `features/tracking/lib/anonymous-id.ts` (TanStack Start server functions + `setResponseHeader`); a Next.js app would wire the same builders in a Route Handler or Server Action.
- `ClientTracker.identify(userId, traits)` only sets the `userId` the client tracker attaches to subsequent client-owned events for the rest of the session — it does not exist on `ServerTracker`, and there is no cross-request identity-resolution logic. A server-owned event's `userId`/`anonymousId` come entirely from the `ServerTrackerContext` the caller passes to `track`/`group`/`alias`.
- **GA4 exception**: GA4 joins hits on gtag.js's _own_ client ID (the `_ga` cookie), not on any app-generated ID — a Measurement Protocol event sent with our anonymous ID lands on a different GA4 user than the visitor's client-side hits. `extractGa4ClientId`/`extractGa4SessionId` read gtag's `_ga`/`_ga_<stream>` cookies from the request so the server destination can echo them (`clientId`/`sessionId` options).

## 4. Event IDs (dedup / idempotency)

- Client-owned events: always `generateEventId()` (`crypto.randomUUID()`) at enqueue time — random.
- Server-owned events: random `generateEventId()` by default; pass `requestId` on `ServerTrackerContext` to switch to `deriveEventId(requestId, JSON.stringify(seed))` instead — a deterministic (non-cryptographic FNV-1a) hash of the request id and the event's own content, so retrying the same request with the same call re-sends the same `eventId` (a destination that dedupes on it treats the retry as a no-op) while distinct event kinds in the same request still get distinct ids. Two calls with an identical `requestId` and identical content collide by design.
- Every event carries `eventId` in its envelope; destinations that support idempotency keys receive it.

## 5. Transport

### 5.1 Client — implemented

- **Two delivery paths**: destinations marked `delivery: "immediate"` (gtag.js, Vercel — SDKs with their own batching/unload transport) receive each event synchronously at track time and never go through the queue; queueing in front of them only delayed events and replayed stale ones next session with wrong timing. Everything else is `"queued"` (default) and gets the batching/retry/persistence below.
- Batching: flush on whichever comes first — interval (`attachClientLifecycle`, default 10s), batch size (internal queue, default 20, self-triggered on `enqueue`), or page unload.
- Unload flush uses `ClientTracker.flushWithBeacon()` (`navigator.sendBeacon`, wired to `pagehide`/`visibilitychange` by `attachClientLifecycle`) — fire-and-forget, re-queues the batch if the browser rejects it (payload too large, etc.).
- Offline queue: persisted via a pluggable `EventQueueStorage`; ships with `createLocalStorageQueueStorage`. Capped (default 500 events, drop-oldest on overflow). IndexedDB fallback for larger payloads is not built.
- Retry: failed events are re-queued up to `maxRetries` (default 3) and retried on the next flush cycle (interval / batch size / unload) — there is no in-flush exponential backoff on the client queue (unlike the server tracker). `ClientTracker.clear()` drops the offline queue without sending and forgets the in-memory `userId` from `identify` — used on consent revoke.
- `attachRouterPageTracking` drives `tracker.page()` off `router.subscribe("onResolved", ...)`, duck-typed against TanStack Router's `Router["subscribe"]` so this package has no hard dependency on it — and flushes right after, since page views are low-frequency enough that immediate delivery beats waiting on the batch interval.

### 5.2 Server

- Sent synchronously inside the server function / middleware handling the request.
- Short retry + backoff on destination call failure; failures are logged, not queued to a dead-letter store (no self-host infra yet — revisit in Phase 2).

## 6. Destinations

- `Destination` is an adapter interface (`send(event)`, optional `delivery`/`consentRequirement`) — core and client/server trackers depend only on this interface, never on a specific provider SDK. There is no per-destination `flush()`; the client queue owns batching/retry for `"queued"` destinations, and `"immediate"` sinks own their own transport.
- Multiple destinations can be registered; a `track()` call fans out to all registered destinations.
- Phase 1 destinations: `createVercelAnalyticsDestination` (base `@vercel/analytics`, optional peer — no React dependency of its own) — implemented, used by `apps/ui`. `createGoogleAnalyticsDestination` (client, `window.gtag`, no peer dependency — requires the gtag.js snippet mounted by the app) — implemented, wired into `apps/ui`. `createGoogleTagManagerDestination` (client, pushes `{ event, … }` onto `dataLayer`) — implemented, with `buildGtmConsentBootstrapScript` / `loadGtmScript` for advanced Consent Mode container load. `createGa4MeasurementProtocolDestination` (server, plain `fetch`, no peer dependency) — implemented, not wired into `apps/ui` yet (no server-owned events in its catalog). PostHog is not built yet. Google Ads conversion tracking was built and then deliberately not adopted — removed, not a gap to fill.
- **Do not double-mount GA**: if GTM already loads GA4, register only `createGoogleTagManagerDestination` — adding `createGoogleAnalyticsDestination` alongside it double-fires events.
- **gtag/GTM loader DX**: `ensureGtag` / `loadGtagScript` / `buildGtagConsentBootstrapScript` (and the GTM twins) accept optional `dataLayerName` (default `"dataLayer"`, also sets gtag/gtm.js `l=`), `nonce` (CSP — stamp the same value on the host inline `<script>` and the injected tag), and for gtag `debugMode` (`gtag('config', id, { debug_mode: true })`). `<GtagConsentBootstrap />` (`@codefast/tracking/react`) is a framework-agnostic inline script wrapper. Bootstraps use **advanced** Consent Mode (consent `default` first, then always load the tag); omitting the DX options does not change that.
- **GA4 name translation**: `TrackedEvent` is a discriminated union on `type` (not magic event-name strings). Destinations `switch` on `event.type` — `group` → recommended `join_group`; `identify` → `gtag('set', { user_id })` (client) / dataLayer `identify` (GTM) / dropped on MP; `alias` → dropped; `page` → dropped by default on gtag/GTM (Enhanced Measurement / container tags already report SPA page views) — `trackPageViews: true` opts in. Catalog `track` names that fail GA4's naming rules are warned about and dropped by gtag, GTM, and Measurement Protocol via shared `warnUnlessGa4EventName`.
- **MP session attribution**: without a `session_id`/`engagement_time_msec`, GA4 accepts an MP hit but leaves it out of realtime and session-scoped reports — the destination defaults `engagement_time_msec` to `100` (overridable via params) and injects the configured `sessionId`, and stamps `timestamp_micros` from the event envelope so retried events don't drift.

### 6.1 EU data residency (Phase 2 — not built)

- PostHog is not implemented (see §6) — this section describes the intended shape once it is: an EU-hosted Cloud instance for visitors resolved to the EU region (Schrems II risk — GA4's US-based processing has drawn adverse EU DPA rulings), with region routing picking the destination endpoint rather than a different code path.

## 7. Consent & privacy

Consent model differs by region — this is not optional/simplifiable to one global rule, since GDPR and CCPA use opposite defaults.

| Region | Model                             | Mechanism                                                                                                                                                                 |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EU     | Opt-in (GDPR)                     | Banner blocks all non-essential tracking until explicit consent; consent stored with timestamp + policy version                                                           |
| VN     | Opt-in (PDPL — Luật 91/2025/QH15) | Same banner; explicit consent, no implied consent                                                                                                                         |
| US     | Opt-out (CCPA/CPRA)               | Tracking on by default; auto-honor `navigator.globalPrivacyControl` (GPC) as an ads opt-out; visible "Do Not Sell/Share" control (`ConsentToggle`, ads-scoped by default) |

- **Region detection**: `resolveRegion` (server, reads `x-vercel-ip-country` by default) + `resolveConsentMode` (core) — resolved server-side from the request's geo (and optional GPC) before the client tracker adopts a regional mode. On CDN-cached / prerendered HTML that resolution must not enter the shared render (cache poison); it rides a private server-fn lane after hydration while the HTML bakes the strictest default — see the `apps/ui` wiring below. `"eu"` covers EU member states plus UK (`GB`) and EEA/EFTA (`IS`/`LI`/`NO`) so they get opt-in rather than the `"other"` opt-out default. `EU_COUNTRY_CODES` / `OPT_IN_EQUIVALENT_COUNTRY_CODES` are exported for restricted edge runtimes that must duplicate the map; `resolveInitialConsent({ countryCode, requestedCategories, hasGlobalPrivacyControlSignal? })` is the pure region → mode → default-decision helper (server functions, or a fail-closed bake when country is unknown).
- **Consent UI — implemented, headless and composable, in `@codefast/tracking/react`** (not `@codefast/ui` — this package must not require installing the UI/design-system package): `useConsent` drives `ConsentBanner` as compound parts (`Title`/`Description`/`Actions`/`Accept`/`Reject`/`Customize`/`Preferences`/`Category`/`Save`) plus `ConsentToggle` (always-visible opt-out control). The root owns visibility (`isPromptNeeded`, overridable via `open` for a "Cookie settings" reopen) and the preferences-layer state; the action parts wire their own clicks and compose the consumer's `onClick`, so a design system's button styles slot in via `className` — this is how `apps/ui` dogfoods the banner with `buttonVariants`. Rendered as a labeled region — an open non-modal `<dialog>` neither traps focus nor blocks, so dialog semantics would over-promise. No styling is baked in: every part exposes a `data-slot` attribute (and the root a `prompt`/`preferences` `data-state`) for Tailwind `**:data-[slot=...]` targeting, and an optional plain-CSS default theme ships at `@codefast/tracking/css/consent.css` (custom-property themable, `light-dark()` aware, zero Tailwind dependency).
- **`useConsent` is a `useSyncExternalStore` bridge**: the stored `ConsentRecord` is the single source of truth (no mirrored React state), the server snapshot is always "no decision yet" (hydration-safe by construction on prerendered pages), and `ConsentStorage.subscribe` propagates same-tab saves and — via the `storage` event in `createLocalStorageConsentStorage` — decisions made in other tabs. A record whose `policyVersion` doesn't match the current one is ignored, so bumping the policy version re-prompts as documented.
- **Revoke**: wire `useConsent`'s `onDecision` to `createConsentWithdrawalHandler({ clearTracker, clearAnonymousId?, clearGoogleAnalyticsCookies? })` — clears only when analytics is denied (queue + in-memory `userId`, optional anon-id cookie, optional `_ga*` cookies via `clearGoogleAnalyticsCookies`). Not automatic on the tracker itself, since `core`/`client` intentionally don't know about consent (separation of concerns). Pair with `createIsAnalyticsAllowed({ config, storage, getMode, hasGlobalPrivacyControlSignal? })` for the tracker's `isAnalyticsAllowed` gate — or let `createConsentRuntime` wire it.
- **Consent is per-category** (`ConsentDecision = { ads, analytics }`, `core/consent`): GDPR consent must be granular per purpose, so a single granted/denied flag can't represent it. `useConsent` takes the `requestedCategories` the app's prompt actually asks about — `grantAll` grants exactly those, so an analytics-only banner can never grant ads consent it never asked for (the decision itself carries that truth; there is no destination-side ads override). `ConsentBanner` is compound parts: put the privacy-policy link inside `ConsentBannerDescription`, and the per-category preferences layer is `Customize` → `ConsentBannerCategory` checkboxes → `Save` (not monolithic `message`/`categories` props — those were removed). A GPC signal resolves to `ads: false` only — do-not-sell-or-share covers ads data sharing, not first-party analytics. `ConsentToggle` defaults to the same ads-only scope (`toggledCategories={["ads"]}`); pass `toggledCategories={["analytics"]}` (or both) for a broader opt-out — distinct from `useConsent`'s `requestedCategories` (what the prompt asks about).
- **Google Consent Mode v2 — implemented (advanced)**: `setGoogleConsentDefault(decision, { waitForUpdateMs, region })` (`destinations/google-analytics`) maps the per-category decision onto the v2 signals — `analytics` → `analytics_storage`, `ads` → `ad_storage`/`ad_user_data`/`ad_personalization` together — and forwards `wait_for_update`/`region` for CMP-style setups. Call it before the gtag.js script tag loads (it defines the standard queueing stub itself, so no snippet has to run first) with `resolveDefaultConsent({ mode, requestedCategories, hasGlobalPrivacyControlSignal })` as the input, so GA4/Ads never fire a hit before the region-resolved default is known. `buildGtagConsentBootstrapScript` / `buildGtmConsentBootstrapScript` follow Google's **advanced** Consent Mode recommendation: apply that default, then **always** load gtag.js / gtm.js (even when denied) so cookieless pings and consent modeling can run — this is distinct from the package's own first-party consent gate, which still blocks identifier minting and non-exempt destination fan-out without consent. Prefer `useGoogleConsentSync(consent, { loadGtagScript? })` (or an effect on `decision`) over putting `updateGoogleConsent` in `onDecision`, so privacy-page and cross-tab saves sync too. `setGoogleAdsDataRedaction`/`setGoogleUrlPassthrough` cover the denied-ads flags. Required for EU traffic — Google enforces Consent Mode v2 signals for EEA visitors since March 2024.
- **`createLocalStorageConsentStorage`/`createLocalStorageQueueStorage` are SSR-safe**: both guard `typeof globalThis.window === "undefined"` (server) and treat every call as a no-op with no decision — an unguarded `localStorage` access would crash the SSR render, not just degrade. In the browser, a blocked `localStorage` (private mode/quota) degrades to an in-memory record so the visitor's decision still applies for the session instead of re-prompting in a loop.
- **Region + consent wiring in `apps/ui` — implemented (hybrid ISR + server-fn lane, 2026-07-10)**: the entry pages are prerendered, the component pages are server-rendered on demand and CDN-cached via `Cache-Control` + `CDN-Cache-Control` route headers (TanStack Start's ISR pattern; the split is per route because on Vercel a prerendered file shadows the server function — the two are mutually exclusive per route). **The cached-render invariant**: a cached render is shared across visitors, so every render bakes the strictest default and reads _no_ per-request value (geo, `sec-gpc`) — a request-derived value would leak the first visitor's region to everyone behind that cache entry (verified empirically: the served slug HTML is byte-identical under different geo headers). Per-visitor personalization rides on the one lane a shared cache can't poison: a `GET` server function (`resolveVisitorConsent`) that reads the geo header, calls `resolveInitialConsent` directly, and answers `private, no-store` — called once per session after hydration (result in `sessionStorage`), feeding a `useSyncExternalStore` store that flips the consent UI and pushes the granted regional default to gtag for undecided opt-out visitors. Fail-closed at every step: before resolution, on fetch failure, and when the geo header is absent (a host without geo) — the missing-country case fails closed inside `resolveInitialConsent` itself, so no caller has to re-implement the guard (the app once did, and the version without it shipped grant-by-default on geo-less hosts).
- **The server-fn lane replaced the edge-middleware cookie (2026-07-10)**: `apps/ui` previously personalized the shared HTML via a Vercel Routing Middleware cookie read by `buildInitialConsentBootstrapScript` into `window.__INITIAL_CONSENT__`. That cookie/bootstrap path was removed from the package — the shipped lane is the server function (`resolveInitialConsent` + client snapshot; see `apps/ui` `visitor-consent.ts` / `resolve-visitor-consent.ts`): no per-host edge layer, no duplicated `EU_COUNTRY_CODES` sweep-tested copy (the resolver imports this package directly), no cookie, no window global — at the cost of one round trip before the consent UI appears and before an undecided opt-out visitor's first hits upgrade from cookieless pings to full measurement. The region-sharded ISR variant (`rewrite(url)` with `?region=` + nitro `isr: { allowQuery }`) stays declined: it moves compliance correctness into platform cache-key config, where both shipped channels fail closed instead.
- **Data subject rights**: deletion requests are forwarded to each active destination's deletion API (PostHog/GA4 support this) — no self-hosted store to purge in Phase 1.

> Not legal advice — the above is the technical shape inferred from GDPR/CCPA/PDPL; confirm specifics with legal counsel before shipping to EU/US/VN traffic.

## 8. Package layout

```
packages/tracking/
├── src/
│   ├── core/            # EventCatalog, EventsOf, assertValidEventProperties, TrackedEvent, Destination, consent types/logic + guards, consent-cookie codec, event-id
│   ├── client/          # createClientTracker, createConsentRuntime, self-scheduling queue, lifecycle, router, gpc, storage, createInitialConsentStore, withConsentCookieMirror, createIsAnalyticsAllowed, createConsentWithdrawalHandler
│   ├── server/          # createServerTracker (waitUntil, withContext), relay + ingest handler, region sets, resolveInitialConsent, anonymous-id + consent cookie readers/builders
│   ├── tanstack-start/  # request/response glue over @tanstack/react-start/server (optional peer) — server-only
│   ├── destinations/    # http, vercel, GA/GTM/MP, clearGoogleAnalyticsCookies; posthog not built (Phase 2)
│   ├── react/           # useConsent, useInitialConsent, ConsentBanner + ConsentToggle, GtagConsentBootstrap, useGoogleConsentSync — headless, no @codefast/ui dependency
│   └── css/             # consent.css — optional plain-CSS default theme for the react/ parts
├── tests/
│   ├── unit/            # core/client/server/tanstack-start/react — mock Destination/storage, fake timers, RTL
│   └── types/           # expectTypeOf over EventsOf filtering
└── tsdown.config.ts
```

`tests/integration/` and `tests/e2e/` don't exist yet — `package.json`'s `test:integration`/`test:e2e` scripts point at paths with no files. Intended coverage once built: `msw` contract tests per real destination (integration), and a consent-gating flow — no network call fires before consent is granted or a valid GPC/opt-out state resolves (e2e).

- Supported subpath exports: the intentional barrels (`.`, `./client`, `./server`, `./destinations`, `./react`, `./core`, `./tanstack-start`) plus selected deep paths for tree-shake targets (e.g. `./destinations/google-analytics`, `./react/use-consent`), and `./css/*` — see `package.json#exports`. The exports map is generated by `codefast mirror` (canonical `{source, types, import}` entries) — do not hand-maintain custom conditions in it. Package-private modules (`destinations/shared`, `destinations/google-consent`) are reachable only via `#/` imports inside the package.
- **Server/client isolation (2026-07-11)**: `./server`, `./server/*`, `./tanstack-start`, and `./destinations/ga4-measurement-protocol` (holds `apiSecret`) are server-only by contract, enforced at the consumer: on TanStack Start, `importProtection.client.specifiers` denies them in the client environment at build time with a traced violation (`apps/ui/vite.config.ts` is the reference), on top of the default `**/*.server.*` file rule. A `browser`-condition poison in `package.json#exports` was tried and dropped — `codefast mirror` owns the exports map and regenerates canonical entries, which strips (or reorders, and key order is what resolvers match on) custom conditions. The `./destinations` barrel is browser-lane only: `vercel-analytics` left it because its top-level `@vercel/analytics` value import made the optional peer mandatory for every barrel consumer (subpath import instead), and `ga4-measurement-protocol` left it for the secret. Client-only react modules carry `"use client"` (tsdown `unbundle` preserves the directive per chunk); `gtag-consent-bootstrap` stays directive-free — it renders an inline script server-side.
- **Server-first lanes (2026-07-11)**: `ServerTrackerOptions.waitUntil` defers destination delivery (with its retry ladder) past the response via the platform scheduler; `ServerTracker.withContext` binds the per-request `ServerTrackerContext` once; `relayTrackedEvents`/`createTrackedEventIngestHandler` are the receive half of the beacon lane (validate → re-stamp server-read identity → keep client `eventId`s for dedup → retry fan-out); the consent-cookie codec (core) + `withConsentCookieMirror` (client) + `readConsentDecisionCookie` (server) make server-owned tracking consent-aware. `ConsentConfig` (`defineConsentConfig`, core) is the one bag for the cross-surface constants (`storageKey`, `policyVersion`, `requestedCategories`, `decisionCookieName?`); `createConsentRuntime` (client) derives the shared storage (cookie-mirrored when configured), the initial-consent store, and the `isAnalyticsAllowed` gate from it. The client `EventQueue` owns its own time-based flush (one-shot timer armed only while non-empty, offline-aware, `keepalive` on unload flushes, `sendBatch` preferred) — `attachClientLifecycle` keeps only the triggers the queue can't own (hide/pagehide, `online`).
- `destinations/` file naming: a destination file is named after the `X` in its `create<X>Destination` factory (`google-analytics.ts` ↔ `createGoogleAnalyticsDestination`, `http.ts` ↔ `createHttpDestination` — no redundant `-destination` suffix; the directory already says it). Provider-specific helper files carry the provider prefix (`google-consent.ts`); cross-provider files are named by role (`shared.ts`). Official product names beat prefix uniformity (`ga4-measurement-protocol.ts`, not `google-analytics-4-…`). Deep-exported destination files are intentional tree-shake targets; renaming one is a breaking change.
- Internal imports via `#/*` (`package.json#imports`), no `compilerOptions.paths`.
- `react` is an optional peer (`react`/`react-dom` marked optional in `peerDependenciesMeta`) — importing `core`/`client`/`server` never requires React or `@codefast/ui` to be installed.

## 9. Testing strategy

| Category            | Covers                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit`        | Mock `Destination`/`EventQueueStorage`/`ConsentStorage`; verify enrichment, dedupe/retry, schema validation, consent state, RTL for `react/`       |
| `tests/integration` | Not built yet. Intended: contract tests per real destination via `msw`, asserting payload shape matches the provider's expected schema             |
| `tests/e2e`         | Not built yet. Intended: consent gating — no network call fires before consent is granted (or before a valid GPC/opt-out state is resolved for US) |
| `tests/types`       | `expectTypeOf` on catalog-inferred types, `EventsOf` filtering, `exactOptionalPropertyTypes` compatibility with Zod v4 optional fields             |

## 10. Open questions (Phase 2)

- Self-host event storage: schema, and whether it lives in the main Postgres instance (separate schema) or a dedicated store.
- Sampling / rate limiting once volume requires it.
- Dead-letter handling for server-side destination failures.
- Geo-detection fallback when the region header is absent (default to strictest — opt-in).
- `HttpOnly` anon-id via a first-party collection endpoint: client events POST identifier-free to the app's own `/api/track`, the server attaches identity from the (then-`HttpOnly`) cookie and fans out — also hides events from ad-blockers; pairs with the existing `flushWithBeacon` + server tracker. Until then the cookie must stay JS-readable.
- Mirror the consent decision into a cookie (alongside `localStorage`) once server-owned events ship — the server cannot gate on consent it cannot read; the same endpoint doubles as a server-side consent-evidence log.
- Candidate future destination: PostHog (EU-hosted, self-serve product analytics — see §6.1). No other provider is planned; a destination without a purpose-built implementation here can use `createHttpDestination` in the meantime (see README).

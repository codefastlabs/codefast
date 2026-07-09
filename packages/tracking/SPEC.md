# @codefast/tracking — Spec

Status: draft. Fullstack event tracking library for apps built on TanStack Start (isomorphic client + server).

## 1. Goals / Non-goals

**Goals**

- Type-safe `track()` across client and server, backed by a per-app Zod event catalog.
- Multi-destination fan-out (PostHog, GA4, ...) without changing call sites.
- Consent-first: no tracking before a lawful basis exists for the visitor's region.
- Correct identity correlation between client-side and server-side events.

**Non-goals (Phase 1)**

- Self-hosted event storage (Postgres/ClickHouse) — architecture stays destination-agnostic so this can be added later as one more destination.
- Sampling, rate limiting, dedup-at-ingestion — revisit once volume requires it.

## 2. Architecture

```
@codefast/tracking
├── core     # event catalog types, EventsOf filter, id generation, consent state machine
├── client   # browser: batching queue, sendBeacon, localStorage persistence, router hook
└── server   # node: server-function/middleware helpers, region detection
```

Each app defines its own event catalog (Zod schemas + owner tag) and passes it into `createClientTracker` / `createServerTracker`. The package ships no hardcoded events.

### 2.1 Event catalog & generics

```ts
interface EventDefinition<Schema extends z.ZodType = z.ZodType> {
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
    track<Name extends keyof ClientEvents>(name: Name, props: z.infer<ClientEvents[Name]["schema"]>): void {
      catalog[name].schema.parse(props);
      // ...enqueue/send
    },
  };
}
```

`createServerTracker` mirrors this, filtered to `EventsOf<Catalog, "server">`. Calling a server-owned event from the client tracker (or vice versa) is a type error, not a runtime surprise.

**Conventions (repo-wide, apply here too):**

- No `I`/`T` prefix on interfaces/types or generic params — `EventDefinition`, `Catalog`, `Schema`, `Owner`, not `IEventDefinition`/`TCatalog`.
- No `any` anywhere in the public API surface.
- Zod **v4** (`zod: ^4.4.3`, already in the workspace catalog) — pattern: `z.object({...}).strict()` + `z.infer<typeof schema>`, matching `packages/cli/src/core/config/schema.ts`.

### 2.2 Public API surface

| Function                    | Where          | Purpose                                                                           |
| --------------------------- | -------------- | --------------------------------------------------------------------------------- |
| `track(name, props)`        | client, server | fire a catalog event, 2-arg call style                                            |
| `identify(userId, traits)`  | client         | attach traits to the current user; local to the tracker instance, not server-side |
| `page(name?, props?)`       | client         | page/route view — driven by `router.subscribe('onResolved', ...)`, not `popstate` |
| `group(groupId, traits)`    | client, server | B2B account-level association                                                     |
| `alias(previousId, userId)` | server         | explicit anonymous → known-user merge, when `identify` timing can't do it         |

## 3. Identity & correlation

- **Caller-owned, not package-owned**: `createClientTracker`/`createServerTracker` take `anonymousId` as a required option (a string on the server; a `() => string` callback on the client, invoked per allowed event) — the package never mints or persists an ID itself. The app is responsible for generating a stable visitor ID and making it readable on both client and server (e.g. a cookie), so the same ID joins client and server events downstream.
- `ClientTracker.identify(userId, traits)` only sets the `userId` the client tracker attaches to subsequent client-owned events for the rest of the session — it does not exist on `ServerTracker`, and there is no cross-request identity-resolution logic. A server-owned event's `userId`/`anonymousId` come entirely from the `ServerTrackContext` the caller passes to `track`/`group`/`alias`.
- **GA4 exception**: GA4 joins hits on gtag.js's _own_ client ID (the `_ga` cookie), not on any app-generated ID — a Measurement Protocol event sent with our anonymous ID lands on a different GA4 user than the visitor's client-side hits. `extractGa4ClientId`/`extractGa4SessionId` read gtag's `_ga`/`_ga_<stream>` cookies from the request so the server destination can echo them (`clientId`/`sessionId` options).

## 4. Event IDs (dedup / idempotency)

- Client-owned events: always `generateEventId()` (`crypto.randomUUID()`) at enqueue time — random.
- Server-owned events: random `generateEventId()` by default; pass `requestId` on `ServerTrackContext` to switch to `deriveEventId(requestId, JSON.stringify(seed))` instead — a deterministic (non-cryptographic FNV-1a) hash of the request id and the event's own content, so retrying the same request with the same call re-sends the same `eventId` (a destination that dedupes on it treats the retry as a no-op) while distinct event kinds in the same request still get distinct ids. Two calls with an identical `requestId` and identical content collide by design.
- Every event carries `eventId` in its envelope; destinations that support idempotency keys receive it.

## 5. Transport

### 5.1 Client — implemented

- **Two delivery paths**: destinations marked `delivery: "immediate"` (gtag.js, Vercel — SDKs with their own batching/unload transport) receive each event synchronously at track time and never go through the queue; queueing in front of them only delayed events and replayed stale ones next session with wrong timing. Everything else is `"queued"` (default) and gets the batching/retry/persistence below.
- Batching: flush on whichever comes first — interval (`attachClientLifecycle`, default 10s), batch size (`EventQueue`, default 20, self-triggered on `enqueue`), or page unload.
- Unload flush uses `ClientTracker.flushWithBeacon()` (`navigator.sendBeacon`, wired to `pagehide`/`visibilitychange` by `attachClientLifecycle`) — fire-and-forget, re-queues the batch if the browser rejects it (payload too large, etc.).
- Offline queue (`EventQueue`): persisted via a pluggable `EventQueueStorage`; ships with `createLocalStorageQueueStorage`. Capped (default 500 events, drop-oldest on overflow). IndexedDB fallback for larger payloads is not built.
- Retry: failed events are re-queued up to `maxRetries` (default 3) and retried on the next flush cycle (interval / batch size / unload) — there is no in-flush exponential backoff on the client queue (unlike the server tracker). `EventQueue.clear()` drops everything without sending — used on consent revoke; `ClientTracker.clear()` also forgets the in-memory `userId` from `identify`.
- `attachRouterPageTracking` drives `tracker.page()` off `router.subscribe("onResolved", ...)`, duck-typed against TanStack Router's `Router["subscribe"]` so this package has no hard dependency on it — and flushes right after, since page views are low-frequency enough that immediate delivery beats waiting on the batch interval.

### 5.2 Server

- Sent synchronously inside the server function / middleware handling the request.
- Short retry + backoff on destination call failure; failures are logged, not queued to a dead-letter store (no self-host infra yet — revisit in Phase 2).

## 6. Destinations

- `Destination` is an adapter interface (`send(event)`, optional `delivery`/`consent`) — core and client/server trackers depend only on this interface, never on a specific provider SDK. There is no per-destination `flush()`; the client queue owns batching/retry for `"queued"` destinations, and `"immediate"` sinks own their own transport.
- Multiple destinations can be registered; a `track()` call fans out to all registered destinations.
- Phase 1 destinations: `createVercelAnalyticsDestination` (`@vercel/analytics/react`, optional peer) — implemented, used by `apps/ui`. `createGoogleAnalyticsDestination` (client, `window.gtag`, no peer dependency — requires the gtag.js snippet mounted by the app) — implemented, wired into `apps/ui`. `createGoogleTagManagerDestination` (client, pushes `{ event, … }` onto `dataLayer`) — implemented, with `buildGtmConsentBootstrapScript` / `loadGtmScript` for advanced Consent Mode container load. `createGa4MeasurementProtocolDestination` (server, plain `fetch`, no peer dependency) — implemented, not wired into `apps/ui` yet (no server-owned events in its catalog). PostHog is not built yet. Google Ads conversion tracking was built and then deliberately not adopted — removed, not a gap to fill.
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

- **Region detection**: `resolveRegion` (server, reads `x-vercel-ip-country` by default) + `resolveConsentMode` (core) — resolved server-side before the client tracker initializes, so the correct consent mode is known on first paint. `"eu"` covers EU member states plus UK (`GB`) and EEA/EFTA (`IS`/`LI`/`NO`) so they get opt-in rather than the `"other"` opt-out default.
- **Consent UI — implemented, headless and composable, in `@codefast/tracking/react`** (not `@codefast/ui` — this package must not require installing the UI/design-system package): `useConsent` drives `ConsentBanner` as compound parts (`Title`/`Description`/`Actions`/`Accept`/`Reject`/`Customize`/`Preferences`/`Category`/`Save`) plus `ConsentToggle` (always-visible opt-out control). The root owns visibility (`isPromptNeeded`, overridable via `open` for a "Cookie settings" reopen) and the preferences-layer state; the action parts wire their own clicks and compose the consumer's `onClick`, so a design system's button styles slot in via `className` — this is how `apps/ui` dogfoods the banner with `buttonVariants`. Rendered as a labeled region — an open non-modal `<dialog>` neither traps focus nor blocks, so dialog semantics would over-promise. No styling is baked in: every part exposes a `data-slot` attribute (and the root a `prompt`/`preferences` `data-state`) for Tailwind `**:data-[slot=...]` targeting, and an optional plain-CSS default theme ships at `@codefast/tracking/css/consent.css` (custom-property themable, `light-dark()` aware, zero Tailwind dependency).
- **`useConsent` is a `useSyncExternalStore` bridge**: the stored `ConsentRecord` is the single source of truth (no mirrored React state), the server snapshot is always "no decision yet" (hydration-safe by construction on prerendered pages), and `ConsentStorage.subscribe` propagates same-tab saves and — via the `storage` event in `createLocalStorageConsentStorage` — decisions made in other tabs. A record whose `policyVersion` doesn't match the current one is ignored, so bumping the policy version re-prompts as documented.
- **Revoke**: wire `useConsent`'s `onDecision` callback to `tracker.clear()` (and `createCookieAnonymousId(...).clear()` when using that helper) — revoking consent stops tracking immediately, drops the pending offline queue, and forgets the in-memory `userId`. Not automatic, since `core`/`client` intentionally don't know about consent (separation of concerns).
- **Consent is per-category** (`ConsentDecision = { ads, analytics }`, `core/consent`): GDPR consent must be granular per purpose, so a single granted/denied flag can't represent it. `useConsent` takes the `categories` the app's prompt actually asks about — `grantAll` grants exactly those, so an analytics-only banner can never grant ads consent it never asked for (the decision itself carries that truth; there is no destination-side ads override). `ConsentBanner` is compound parts: put the privacy-policy link inside `ConsentBannerDescription`, and the per-category preferences layer is `Customize` → `ConsentBannerCategory` checkboxes → `Save` (not monolithic `message`/`categories` props — those were removed). A GPC signal resolves to `ads: false` only — do-not-sell-or-share covers ads data sharing, not first-party analytics. `ConsentToggle` defaults to the same ads-only scope (`toggledCategories={["ads"]}`); pass `toggledCategories={["analytics"]}` (or both) for a broader opt-out — distinct from `useConsent`'s `categories` (what the prompt asks about).
- **Google Consent Mode v2 — implemented (advanced)**: `setGoogleConsentDefault(decision, { waitForUpdateMs, region })` (`destinations/google-analytics`) maps the per-category decision onto the v2 signals — `analytics` → `analytics_storage`, `ads` → `ad_storage`/`ad_user_data`/`ad_personalization` together — and forwards `wait_for_update`/`region` for CMP-style setups. Call it before the gtag.js script tag loads (it defines the standard queueing stub itself, so no snippet has to run first) with `resolveDefaultConsent(mode, categories, hasGpc)` as the input, so GA4/Ads never fire a hit before the region-resolved default is known. `buildGtagConsentBootstrapScript` / `buildGtmConsentBootstrapScript` follow Google's **advanced** Consent Mode recommendation: apply that default, then **always** load gtag.js / gtm.js (even when denied) so cookieless pings and consent modeling can run — this is distinct from the package's own first-party consent gate, which still blocks identifier minting and non-exempt destination fan-out without consent. `updateGoogleConsent(decision)` is wired the same way as `tracker.clear()`: from `useConsent`'s `onDecision` callback (or an effect on `decision`), so an already-loaded GA4/Ads tag picks up a consent change without a reload. `setGoogleAdsDataRedaction`/`setGoogleUrlPassthrough` cover the denied-ads flags. Required for EU traffic — Google enforces Consent Mode v2 signals for EEA visitors since March 2024.
- **`createLocalStorageConsentStorage`/`createLocalStorageQueueStorage` are SSR-safe**: both guard `typeof globalThis.window === "undefined"` (server) and treat every call as a no-op with no decision — an unguarded `localStorage` access would crash the SSR render, not just degrade. In the browser, a blocked `localStorage` (private mode/quota) degrades to an in-memory record so the visitor's decision still applies for the session instead of re-prompting in a loop.
- **Region + consent wiring in `apps/ui` — implemented**: `getRequestHeader("x-vercel-ip-country")`/`getRequestHeader("sec-gpc")` are read directly inside the SSR'd component that needs them (`GoogleTag`), not via a root-route `loader`/`beforeLoad` — empirically, TanStack Start's `shellComponent` renders before the root match's data functions resolve (loader/`beforeLoad` output stayed empty on first render in testing, only appearing after `router.invalidate()`), so anything mounted as a `shellComponent` sibling (`<GoogleTag />`, `<ConsentGate />`) can't read root `loaderData`/context. The resolved value is embedded into `window.__INITIAL_CONSENT__` via an inline script so the client reads the same value without a second, possibly different guess.
- **Data subject rights**: deletion requests are forwarded to each active destination's deletion API (PostHog/GA4 support this) — no self-hosted store to purge in Phase 1.

> Not legal advice — the above is the technical shape inferred from GDPR/CCPA/PDPL; confirm specifics with legal counsel before shipping to EU/US/VN traffic.

## 8. Package layout

```
packages/tracking/
├── src/
│   ├── core/           # EventCatalog, EventsOf, TrackedEvent, Destination, consent types/logic, event-id
│   ├── client/          # createClientTracker, queue (batch/retry/clear/drain), lifecycle, router hook, gpc, localStorage, consent-storage
│   ├── server/          # createServerTracker, region detection
│   ├── destinations/    # http, vercel-analytics, google-analytics, google-tag-manager, ga4-measurement-protocol, google-consent helpers; posthog not built (Phase 2)
│   ├── react/            # useConsent, ConsentBanner + ConsentToggle, GtagConsentBootstrap — headless, no @codefast/ui dependency
│   └── css/              # consent.css — optional plain-CSS default theme for the react/ parts
├── tests/
│   ├── unit/            # core/client/server/react — mock Destination/storage, fake timers, RTL
│   └── types/           # expectTypeOf over EventsOf filtering
└── tsdown.config.ts
```

`tests/integration/` and `tests/e2e/` don't exist yet — `package.json`'s `test:integration`/`test:e2e` scripts point at paths with no files. Intended coverage once built: `msw` contract tests per real destination (integration), and a consent-gating flow — no network call fires before consent is granted or a valid GPC/opt-out state resolves (e2e).

- Subpath exports: one per top-level module (`.`, `./client`, `./server`, `./destinations`, `./react`) **and** one per file within each (e.g. `./client/queue`, `./core/consent`, `./destinations/google-analytics`, `./react/use-consent`), plus `./css/*` — see `package.json#exports` for the full list.
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
- Candidate future destination: PostHog (EU-hosted, self-serve product analytics — see §6.1). No other provider is planned; a destination without a purpose-built implementation here can use `createHttpDestination` in the meantime (see README).

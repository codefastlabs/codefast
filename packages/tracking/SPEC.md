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
| `identify(userId, traits)`  | client, server | attach traits to the current user, merges anonymous ID                            |
| `page(name?, props?)`       | client         | page/route view — driven by `router.subscribe('onResolved', ...)`, not `popstate` |
| `group(groupId, traits)`    | client, server | B2B account-level association                                                     |
| `alias(previousId, userId)` | server         | explicit anonymous → known-user merge, when `identify` timing can't do it         |

## 3. Identity & correlation

- Anonymous ID generated client-side on first load, persisted in a cookie (not localStorage-only) so the **same ID is readable server-side** on the next request.
- Server reads the anonymous-ID cookie in middleware, attaches it to every server-owned event for that request — this is what lets client events and server events join to one user downstream.
- `identify()` merges anonymous ID → real `userId`; server is the source of truth for `userId` resolution (from session), never trusts a client-claimed ID for server-owned events.
- **GA4 exception**: GA4 joins hits on gtag.js's _own_ client ID (the `_ga` cookie), not on any app-generated ID — a Measurement Protocol event sent with our anonymous ID lands on a different GA4 user than the visitor's client-side hits. `extractGa4ClientId`/`extractGa4SessionId` read gtag's `_ga`/`_ga_<stream>` cookies from the request so the server destination can echo them (`clientId`/`sessionId` options).

## 4. Event IDs (dedup / idempotency)

- Client-owned events: client generates a UUID before enqueueing.
- Server-owned events: server generates the ID from the request (so retries of the same request don't double-count).
- Every event carries `eventId` in its envelope; destinations that support idempotency keys receive it.

## 5. Transport

### 5.1 Client — implemented

- **Two delivery paths**: destinations marked `delivery: "immediate"` (gtag.js, Vercel — SDKs with their own batching/unload transport) receive each event synchronously at track time and never go through the queue; queueing in front of them only delayed events and replayed stale ones next session with wrong timing. Everything else is `"queued"` (default) and gets the batching/retry/persistence below.
- Batching: flush on whichever comes first — interval (`attachClientLifecycle`, default 10s), batch size (`EventQueue`, default 20, self-triggered on `enqueue`), or page unload.
- Unload flush uses `ClientTracker.flushWithBeacon()` (`navigator.sendBeacon`, wired to `pagehide`/`visibilitychange` by `attachClientLifecycle`) — fire-and-forget, re-queues the batch if the browser rejects it (payload too large, etc.).
- Offline queue (`EventQueue`): persisted via a pluggable `EventQueueStorage`; ships with `createLocalStorageQueueStorage`. Capped (default 500 events, drop-oldest on overflow). IndexedDB fallback for larger payloads is not built.
- Retry: exponential backoff, default 3 attempts, per failed batch; still-failing batches stay queued for the next flush cycle. `EventQueue.clear()` drops everything without sending — used on consent revoke.
- `attachRouterPageTracking` drives `tracker.page()` off `router.subscribe("onResolved", ...)`, duck-typed against TanStack Router's `Router["subscribe"]` so this package has no hard dependency on it — and flushes right after, since page views are low-frequency enough that immediate delivery beats waiting on the batch interval.

### 5.2 Server

- Sent synchronously inside the server function / middleware handling the request.
- Short retry + backoff on destination call failure; failures are logged, not queued to a dead-letter store (no self-host infra yet — revisit in Phase 2).

## 6. Destinations

- `Destination` is an adapter interface (`send(event)`, `flush()`) — core and client/server trackers depend only on this interface, never on a specific provider SDK.
- Multiple destinations can be registered; a `track()` call fans out to all registered destinations.
- Phase 1 destinations: `createVercelAnalyticsDestination` (`@vercel/analytics/react`, optional peer) — implemented, used by `apps/ui`. `createGoogleAnalyticsDestination` (client, `window.gtag`, no peer dependency — requires the gtag.js snippet mounted by the app) — implemented, wired into `apps/ui`. `createGa4MeasurementProtocolDestination` (server, plain `fetch`, no peer dependency) — implemented, not wired into `apps/ui` yet (no server-owned events in its catalog). PostHog is not built yet. Google Ads conversion tracking was built and then deliberately not adopted — removed, not a gap to fill.
- **GA4 name translation**: GA4 rejects `$`-prefixed names (must start with a letter, ≤40 chars), so both GA4 destinations translate this package's built-ins instead of forwarding them verbatim — `$group` → the recommended `join_group` event (`group_id` param); `$identify` → `gtag('set', { user_id })` (client) / dropped on MP (`user_id` already rides in the payload); `$alias` → dropped (GA4 merges via `user_id`); `$page_viewed` → dropped by default on gtag, because `gtag('config')` + Enhanced Measurement (on by default in GA4 admin) already report page views — `trackPageViews: true` opts into a `page_view` translation for apps that disabled both. Other invalid names are warned about and dropped rather than sent to nowhere.
- **MP session attribution**: without a `session_id`/`engagement_time_msec`, GA4 accepts an MP hit but leaves it out of realtime and session-scoped reports — the destination injects `engagement_time_msec: 1` and the configured `sessionId`, and stamps `timestamp_micros` from the event envelope so retried events don't drift.

### 6.1 EU data residency

- PostHog: EU-hosted Cloud instance for visitors resolved to the EU region (Schrems II risk — GA4's US-based processing has drawn adverse EU DPA rulings). Region routing picks the destination endpoint, not a different code path.

## 7. Consent & privacy

Consent model differs by region — this is not optional/simplifiable to one global rule, since GDPR and CCPA use opposite defaults.

| Region | Model                      | Mechanism                                                                                                                                   |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| EU     | Opt-in (GDPR)              | Banner blocks all non-essential tracking until explicit consent; consent stored with timestamp + policy version                             |
| VN     | Opt-in (Nghị định 13/2023) | Same banner; explicit consent, no implied consent                                                                                           |
| US     | Opt-out (CCPA/CPRA)        | Tracking on by default; auto-honor `navigator.globalPrivacyControl` (GPC) as an opt-out signal; visible "Do Not Sell/Share My Info" control |

- **Region detection**: `resolveRegion` (server, reads `x-vercel-ip-country` by default) + `resolveConsentMode` (core) — resolved server-side before the client tracker initializes, so the correct consent mode is known on first paint.
- **Consent UI — implemented, headless and composable, in `@codefast/tracking/react`** (not `@codefast/ui` — this package must not require installing the UI/design-system package): `useConsent` drives `ConsentBanner` as compound parts (`Title`/`Description`/`Actions`/`Accept`/`Reject`/`Customize`/`Preferences`/`Category`/`Save`) plus `ConsentToggle` (always-visible opt-out control). The root owns visibility (`needsPrompt`, overridable via `open` for a "Cookie settings" reopen) and the preferences-layer state; the action parts wire their own clicks and compose the consumer's `onClick`, so a design system's button styles slot in via `className` — this is how `apps/ui` dogfoods the banner with `buttonVariants`. Rendered as a labeled region — an open non-modal `<dialog>` neither traps focus nor blocks, so dialog semantics would over-promise. No styling is baked in: every part exposes a `data-slot` attribute (and the root a `prompt`/`preferences` `data-state`) for Tailwind `**:data-[slot=...]` targeting, and an optional plain-CSS default theme ships at `@codefast/tracking/css/consent.css` (custom-property themable, `light-dark()` aware, zero Tailwind dependency).
- **`useConsent` is a `useSyncExternalStore` bridge**: the stored `ConsentRecord` is the single source of truth (no mirrored React state), the server snapshot is always "no decision yet" (hydration-safe by construction on prerendered pages), and `ConsentStorage.subscribe` propagates same-tab saves and — via the `storage` event in `createLocalStorageConsentStorage` — decisions made in other tabs. A record whose `policyVersion` doesn't match the current one is ignored, so bumping the policy version re-prompts as documented.
- **Revoke**: wire `useConsent`'s `onDecision` callback to `tracker.clear()` — revoking consent stops tracking immediately and drops the pending offline queue. Not automatic, since `core`/`client` intentionally don't know about consent (separation of concerns).
- **Consent is per-category** (`ConsentDecision = { ads, analytics }`, `core/consent`): GDPR consent must be granular per purpose, so a single granted/denied flag can't represent it. `useConsent` takes the `categories` the app's prompt actually asks about — `grantAll` grants exactly those, so an analytics-only banner can never grant ads consent it never asked for (the decision itself carries that truth; no destination-side `includeAds` override). `ConsentBanner`'s optional `categories` prop adds a per-category preferences layer ("Customize" → checkboxes → "Save preferences"), and `message` accepts a `ReactNode` so the privacy-policy link informed consent requires can live inside it. A GPC signal resolves to `ads: false` only — do-not-sell-or-share covers ads data sharing, not first-party analytics.
- **Google Consent Mode v2 — implemented**: `setGoogleConsentDefault(decision, { waitForUpdateMs, region })` (`destinations/google-analytics`) maps the per-category decision onto the v2 signals — `analytics` → `analytics_storage`, `ads` → `ad_storage`/`ad_user_data`/`ad_personalization` together — and forwards `wait_for_update`/`region` for CMP-style setups. Call it before the gtag.js script tag loads (it defines the standard queueing stub itself, so no snippet has to run first) with `resolveDefaultConsent(mode, categories, hasGpc)` as the input, so GA4/Ads never fire a hit before the region-resolved default is known. `updateGoogleConsent(decision)` is wired the same way as `tracker.clear()`: from `useConsent`'s `onDecision` callback, so an already-loaded GA4/Ads tag picks up a consent change without a reload. `setGoogleAdsDataRedaction`/`setGoogleUrlPassthrough` cover the denied-ads flags. Required for EU traffic — Google enforces Consent Mode v2 signals for EEA visitors since March 2024.
- **`createLocalStorageConsentStorage`/`createLocalStorageQueueStorage` are SSR-safe**: both guard `typeof globalThis.window === "undefined"` (server) and treat every call as a no-op with no decision — an unguarded `localStorage` access would crash the SSR render, not just degrade. In the browser, a blocked `localStorage` (private mode/quota) degrades to an in-memory record so the visitor's decision still applies for the session instead of re-prompting in a loop.
- **Region + consent wiring in `apps/ui` — implemented**: `getRequestHeader("x-vercel-ip-country")`/`getRequestHeader("sec-gpc")` are read directly inside the SSR'd component that needs them (`GoogleTag`), not via a root-route `loader`/`beforeLoad` — empirically, TanStack Start's `shellComponent` renders before the root match's data functions resolve (loader/`beforeLoad` output stayed empty on first render in testing, only appearing after `router.invalidate()`), so anything mounted as a `shellComponent` sibling (`<GoogleTag />`, `<ConsentGate />`) can't read root `loaderData`/context. The resolved value is embedded into `window.__INITIAL_CONSENT__` via an inline script so the client reads the same value without a second, possibly different guess.
- **Data subject rights**: deletion requests are forwarded to each active destination's deletion API (PostHog/GA4 support this) — no self-hosted store to purge in Phase 1.

> Not legal advice — the above is the technical shape inferred from GDPR/CCPA/NĐ 13/2023; confirm specifics with legal counsel before shipping to EU/US/VN traffic.

## 8. Package layout

```
packages/tracking/
├── src/
│   ├── core/           # EventCatalog, EventsOf, TrackedEvent, Destination, consent types/logic
│   ├── client/          # createClientTracker, queue (batch/retry/clear/drain), lifecycle, router hook, gpc, localStorage
│   ├── server/          # createServerTracker, region detection
│   ├── destinations/    # createHttpDestination — generic building block; posthog.ts/ga4.ts not built (Phase 2)
│   └── react/            # useConsent, ConsentBanner, ConsentToggle — headless, no @codefast/ui dependency
├── tests/
│   ├── unit/            # core/client/server/react — mock Destination/storage, fake timers, RTL
│   ├── integration/     # pre-wired (none yet) — msw contract tests per real destination once built
│   ├── e2e/             # pre-wired (none yet) — consent-gating flow
│   └── types/           # expectTypeOf over EventsOf filtering
└── tsdown.config.ts
```

- Subpath exports mirroring `packages/di`'s pattern: `.` (core), `./client`, `./server`, `./destinations`, `./react`.
- Internal imports via `#/*` (`package.json#imports`), no `compilerOptions.paths`.
- `react` is an optional peer (`react`/`react-dom` marked optional in `peerDependenciesMeta`) — importing `core`/`client`/`server` never requires React or `@codefast/ui` to be installed.

## 9. Testing strategy

| Category            | Covers                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit`        | Mock `Destination`/`EventQueueStorage`/`ConsentStorage`; verify enrichment, dedupe/retry, schema validation, consent state, RTL for `react/` |
| `tests/integration` | Contract tests per real destination via `msw`, asserting payload shape matches the provider's expected schema                                |
| `tests/e2e`         | Consent gating — no network call fires before consent is granted (or before a valid GPC/opt-out state is resolved for US)                    |
| `tests/types`       | `expectTypeOf` on catalog-inferred types, `EventsOf` filtering, `exactOptionalPropertyTypes` compatibility with Zod v4 optional fields       |

## 10. Open questions (Phase 2)

- Self-host event storage: schema, and whether it lives in the main Postgres instance (separate schema) or a dedicated store.
- Sampling / rate limiting once volume requires it.
- Dead-letter handling for server-side destination failures.
- Geo-detection fallback when the region header is absent (default to strictest — opt-in).

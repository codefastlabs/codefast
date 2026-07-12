# @codefast/tracking — Spec

Status: active. Consent-gated, client-side event tracking for apps built on TanStack Start.

## 1. Goals / Non-goals

**Goals**

- Type-safe `track()` backed by a per-app Standard Schema event catalog.
- Multi-destination fan-out (gtag, Vercel Analytics) without changing call sites.
- Consent-first: no tracking, and no identifier minting, before a lawful basis exists for the visitor's region — including on ISR/CDN-cached pages that cannot be personalized.
- A single `ConsentConfig` that every surface (hooks, tracker gate, tag bootstrap) takes, so cross-surface constants cannot drift.

**Non-goals (deliberate — cut on 2026-07-11 after shipping with zero call sites)**

- **Server-side tracking** (server tracker, beacon relay/ingest, consent-cookie mirror, GA4 Measurement Protocol) — no consumer tracked a server-owned event; re-add from git history when one does.
- **Offline queue / batching / unload beacon** — every real destination (gtag.js, Vercel) owns its own in-page queue and unload delivery; a second queue in front only delayed events and replayed stale ones.
- **Segment-style `identify`/`group`/`alias`/`page` kinds** — nothing called them; page views belong to gtag `config` + Enhanced Measurement and Vercel's native `<Analytics />`.
- **GTM** — the reference consumer loads gtag directly.
- Self-hosted event storage, sampling, rate limiting — revisit if volume ever requires it.

The standing rule: every exported API needs at least one real consumer call site (apps/ui is the reference) before it ships.

## 2. Architecture

```
@codefast/tracking
├── core          # catalog types + validation, TrackEvent envelope, consent model, ConsentConfig, cookie parser
├── client        # createClientTracker, createConsentRuntime, consent storage, initial-consent store, anon-id cookies, GPC
├── server        # region → initial-consent resolution, anon-id Set-Cookie builders (server-only)
├── tanstack-start# request/response glue over Start's server context (server-only)
├── destinations  # gtag destination + loader + Consent Mode bootstrap; Vercel on its own subpath
├── react         # useConsent, useInitialConsent, useGoogleConsentSync, ConsentBanner parts, GtagConsentBootstrap
└── css           # optional plain-CSS theme for the react parts
```

- The schema contract is [Standard Schema](https://standardschema.dev) (`@standard-schema/spec` is the only dependency): any conforming library works, validation runs through `assertValidEventProperties` (sync `~standard.validate`; async schemas throw by design; the parsed output is what destinations receive so unknown keys cannot ride along).
- The envelope is `TrackEvent` (`{ type: "track", name, properties, anonymousId, eventId, timestamp }`) — `type` stays a discriminant so a future kind is additive, not a wire break.
- `Destination` is `{ name, consentRequirement?, send }`. Destinations own their transport; `send` failures are swallowed at the tracker (tracking must never break the interaction). `consentRequirement: "exempt"` keeps a cookieless, identifier-free sink (Vercel) receiving events while the gate is closed — gated envelopes carry an empty `anonymousId` and no id is ever minted for them.

## 3. Consent & privacy

- **Per-category decisions** (`{ ads, analytics }`) mirroring Consent Mode v2; GPC resolves to `ads: false` only. Regions: EU/UK/EEA + VN → opt-in; US/other → opt-out. Unknown country fails closed to the strictest opt-in default.
- **`ConsentConfig`** (`storageKey`, `policyVersion`, `requestedCategories`) is defined once via `defineConsentConfig` and passed everywhere; a stored decision under a superseded `policyVersion` reads as "no decision".
- **`createConsentRuntime`** derives the live client instances: one `localStorage`-backed `ConsentStorage`, the initial-consent store over the app's server-fn lane (single-flight, session cache, fail-closed-but-retryable), and the `isAnalyticsAllowed` gate wired to the store's resolved mode.
- **ISR lane**: shared HTML bakes `STRICTEST_INITIAL_CONSENT`; `resolveInitialConsentFromRequest` (tanstack-start) answers per visitor with `cache-control: private, no-store`.
- **Google Consent Mode v2 (advanced)**: the bootstrap applies the `default` signal (stored decision wins), then always loads gtag.js; `useGoogleConsentSync` pushes `update` signals for banner, privacy-page, and cross-tab decisions. `clearGoogleAnalyticsCookies` + the withdrawal handler clear `_ga*` and the anonymous id on denial.
- **Anonymous id**: client mints lazily post-consent (UUID only), server re-issues via `Set-Cookie` (Safari ITP). Both sides validate UUID shape so the public persist endpoint cannot echo attacker input into a header.
- **Import protection**: `./server` and `./tanstack-start` are denied in client bundles via `SERVER_ONLY_IMPORT_SPECIFIERS`, which ships with the package (no runtime guard; no exports-map conditions — `codefast mirror` owns the exports map and the 10 group entries are hand-curated under its `preserve` mode).

## 4. Testing

- `tests/unit/**` mirrors `src/**` per the repo taxonomy; jsdom for browser surfaces.
- Consent flows are tested behaviorally where possible (real gtag stub + `dataLayer` assertions) instead of spying package internals.
- apps/ui carries the integration matrix: real `useSiteConsent` + tracker + GA/Vercel fan-out with only the network boundaries faked.
- apps/ui also owns **browser e2e** (`apps/ui/tests/e2e/**`, Playwright) for consent-gated catalog events end-to-end. Run via `pnpm test:e2e:ui`. That suite is distinct from package CLI e2e and from `@codefast/ui` Storybook browser tests — see root `TESTING.md`. CI runs it in a dedicated job, not inside packages-only verify.

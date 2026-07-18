# Consent-Gated Event Tracking — Specification

Status: active. Language-neutral specification of the tracking system implemented by `@codefast/tracking`. Any conforming implementation — in any modern language, on any client/server pairing — must satisfy the normative documents below; the TypeScript package is the reference implementation.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

## Documents

| Document                                     | Scope                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| [SPEC-EVENT-MODEL.md](SPEC-EVENT-MODEL.md)   | Event catalog, property validation, the `TrackEvent` envelope                           |
| [SPEC-CONSENT.md](SPEC-CONSENT.md)           | Consent categories, regions and modes, decision records, the effective-consent rule     |
| [SPEC-IDENTITY.md](SPEC-IDENTITY.md)         | Anonymous-id lifecycle: client minting, cookie contract, server persistence, withdrawal |
| [SPEC-TRACKER.md](SPEC-TRACKER.md)           | The tracking pipeline: gate evaluation, envelope construction, fan-out, error handling  |
| [SPEC-DESTINATIONS.md](SPEC-DESTINATIONS.md) | Destination interface, the exempt lane, property flattening, reference destinations     |
| [SPEC-SERVER-LANE.md](SPEC-SERVER-LANE.md)   | Initial-consent resolution over shared/cached HTML: server endpoint + client store      |

Each document ends with a Conformance section of language-neutral test vectors (JSON input → JSON output) that an implementation can turn into its own test suite.

## Goals

- Type-safe (or schema-validated) `track()` backed by an app-defined event catalog.
- Multi-destination fan-out without changing call sites.
- Consent-first: no tracking, and no identifier minting, before a lawful basis exists for the visitor's region — including on ISR/CDN-cached pages that cannot be personalized.
- One consent configuration object shared by every surface (UI, tracker gate, tag bootstrap), so cross-surface constants cannot drift.

## Non-goals (deliberate — cut on 2026-07-11 after shipping with zero call sites)

- Server-side tracking (server tracker, beacon relay/ingest, consent-cookie mirror, GA4 Measurement Protocol) — re-add when a consumer tracks a server-owned event.
- Offline queue / batching / unload beacon — every real destination owns its own in-page queue and unload delivery; a second queue in front only delayed events and replayed stale ones.
- Segment-style identify/group/alias/page event kinds — page views belong to the analytics tag's own page tracking.
- Tag managers (GTM) — the reference consumer loads the analytics tag directly.
- Self-hosted event storage, sampling, rate limiting — revisit if volume ever requires it.

The standing rule: every exported API needs at least one real consumer call site before it ships.

## Architecture (conceptual layers)

```
core          # consent model, event catalog + validation, envelope, cookie parsing — pure, no I/O
client        # tracker, consent storage, initial-consent store, anonymous-id cookies, GPC — browser-side state
server        # region → initial-consent resolution, anonymous-id Set-Cookie builders — request-scoped, no client state
framework glue# request/response adapters over the host framework's server context
destinations  # fan-out targets; each owns its transport
ui bindings   # reactive surface over the same core rules (hooks/components in the reference implementation)
```

Layer rules:

- The core layer MUST be pure: no I/O, no clock or randomness beyond what callers inject, portable to any runtime.
- Server-lane modules MUST NOT be reachable from client bundles (enforce with whatever boundary the platform offers — build-time import protection, package layout, separate binaries).
- Both halves (client, server) share the same core rules — normalization, validation, and defaults are specified once and reused, never re-implemented per side.

## Terminology

- **Visitor** — the end user of the consuming application.
- **Consent category** — a purpose the visitor grants or denies individually: `ads`, `analytics`.
- **Consent decision** — the per-category boolean map recording the visitor's choice.
- **Consent mode** — the regional legal regime: `opt-in` (explicit consent required first) or `opt-out` (tracking allowed by default, visitor may refuse).
- **Effective consent** — what tags must obey right now: the stored decision if one exists under the current policy version, else the regional default.
- **GPC** — Global Privacy Control, a browser-level "do not sell or share" opt-out signal.
- **Anonymous id** — a UUID identifying the browser, minted client-side only after tracking is allowed.
- **Exempt destination** — a cookieless, identifier-free sink that keeps receiving (identifier-stripped) events while the consent gate is closed.

## Reference implementation notes (TypeScript-specific, non-normative)

These bind the spec to this repository and do not constrain other implementations:

- The schema contract is [Standard Schema](https://standardschema.dev) (`@standard-schema/spec` is the only dependency); any conforming validation library works.
- The reactive surface is React (`useConsent`, `useInitialConsent`, `useGoogleConsentSync`, `ConsentBanner` parts, `GtagConsentBootstrap`), built on external-store subscriptions over the same core rules.
- Consent storage is `localStorage`; the initial-consent session cache is `sessionStorage`; cross-tab sync rides the `storage` event.
- The server lane is a TanStack Start server function; `./server` and `./tanstack-start` subpaths are denied in client bundles via `SERVER_ONLY_IMPORT_SPECIFIERS` (no runtime guard; `codefast mirror` owns the exports map — the group entries are hand-curated under its preserve mode).
- Testing: `tests/unit/**` mirrors `src/**` per the repo taxonomy (jsdom for browser surfaces); consent flows are tested behaviorally (real gtag stub + dataLayer assertions). apps/ui carries the integration matrix and the browser e2e suite (`apps/ui/tests/e2e/**`, Playwright, `pnpm test:e2e:ui`).

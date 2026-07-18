# Consent-Gated Event Tracking — Specification

Status: active. **Spec version 1.0.0** ([CHANGELOG](CHANGELOG.md)). Language-neutral specification of the tracking system implemented by `@codefast/tracking`. Any conforming implementation — in any modern language, on any client/server pairing — must satisfy the normative documents below; the TypeScript package is the reference implementation.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

## Documents

**Core (implemented in the reference package):**

| Document                                     | Scope                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| [spec-event-model.md](spec-event-model.md)   | Event catalog, property validation, the `TrackEvent` envelope                           |
| [spec-consent.md](spec-consent.md)           | Consent categories, regions and modes, decision records, the effective-consent rule     |
| [spec-identity.md](spec-identity.md)         | Anonymous-id lifecycle: client minting, cookie contract, server persistence, withdrawal |
| [spec-tracker.md](spec-tracker.md)           | The tracking pipeline: gate evaluation, envelope construction, fan-out, error handling  |
| [spec-destinations.md](spec-destinations.md) | Destination interface, the exempt lane, property flattening, reference destinations     |
| [spec-server-lane.md](spec-server-lane.md)   | Initial-consent resolution over shared/cached HTML: server endpoint + client store      |
| [spec-security.md](spec-security.md)         | Security & Privacy Considerations, consolidated across all documents                    |

**Commercial-scope extensions (implementation status varies by document — see each Status line and below):**

| Document                                                       | Scope                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [spec-regions.md](spec-regions.md)                             | Data-driven worldwide jurisdictional consent rules, replacing the four-value region enum    |
| [spec-consent-receipts.md](spec-consent-receipts.md)           | Server-side audit trail for demonstrable consent (GDPR Art. 7, ISO/IEC TS 27560)            |
| [spec-ad-consent-frameworks.md](spec-ad-consent-frameworks.md) | IAB TCF / GPP interop for programmatic advertising (read an external CMP, don't be one)     |
| [spec-data-subject-rights.md](spec-data-subject-rights.md)     | DSR obligations for the pseudonymous id: delegate to destinations, keep the surface minimal |

Each document ends with a Conformance section of language-neutral test vectors (JSON input → JSON output) that an implementation can turn into its own test suite. Machine-readable projections of every vector live in [vectors/](vectors/README.md) (one `*.json` per document, validated by `vector.schema.json`) so a conformance suite can be run directly, in any language, without transcribing prose. The extension documents additionally cite the governing legal instrument or industry spec for every normative claim, with access dates, and flag items needing legal-counsel review — they are an engineering specification, not legal advice.

## Goals

- Type-safe (or schema-validated) `track()` backed by an app-defined event catalog.
- Multi-destination fan-out without changing call sites.
- Consent-first: no tracking, and no identifier minting, before a lawful basis exists for the visitor's region — including on ISR/CDN-cached pages that cannot be personalized.
- One consent configuration object shared by every surface (UI, tracker gate, tag bootstrap), so cross-surface constants cannot drift.

## Non-goals (deliberate — cut on 2026-07-11 after shipping with zero call sites)

- Server-side tracking (server tracker, beacon relay/ingest, consent-cookie mirror, GA4 Measurement Protocol) — re-add when a consumer tracks a server-owned event.
- Offline queue / batching / unload beacon — every real destination owns its own in-page queue and unload delivery; a second queue in front only delayed events and replayed stale ones.
- Segment-style identify/group/alias/page event kinds — page views belong to the analytics tag's own page tracking. If a first-party pageview or trait-sync destination ever appears, `page` and `identify` are the anticipated additive members of the reserved `type` discriminant (spec-event-model §3); they are documented as a seam, not implemented.
- Tag managers (GTM) — the reference consumer loads the analytics tag directly.
- Self-hosted event storage, sampling, rate limiting — revisit if volume ever requires it. A competitor teardown (Segment, RudderStack, PostHog, Snowplow, Plausible/Fathom/Umami, Amplitude/Mixpanel) confirmed every one of these cuts is defensible for a first-party, consent-first, destinations-own-transport dispatcher — notably, _no_ comparable system samples client-side, and a tracker-level offline queue is actively hazardous here because it can replay events after consent was withdrawn.

The standing rule: every exported API needs at least one real consumer call site before it ships.

## Commercial-scope extensions

The core documents describe what the reference package implements today. The extension documents (regions, consent receipts, ad-consent frameworks, data-subject rights) specify what a **full commercial deployment** — worldwide jurisdictions, programmatic advertising, legally-defensible audit trails — additionally requires. Their implementation status now **varies by document** (see each Status line): the consent-receipt mechanism and the ad-framework interop reconciler are **implemented in the reference package** (2026-07-18), the data-subject-rights posture is **largely met**, while worldwide data-driven regions remains a **design target**. What is still the consumer's is called out per document — a backend/retention/key for receipts, the live-CMP purpose mapping for ad frameworks, and legal-counsel review of every UNCERTAIN item. All four follow three principles:

- **Every normative claim is sourced.** Legal claims cite the governing statute/regulator guidance; industry-framework claims cite the IAB/ISO spec. Each carries an access date, and items that are newly-in-force, contested, or reachable only via secondary aggregation are flagged **UNCERTAIN — needs legal counsel review**. The research behind them was verified against primary sources as of 2026-07-18, but privacy law moves quarterly: re-verify load-bearing citations before relying on them.
- **Lean by construction.** The same "real call site before it ships" rule governs extensions. The DSR document, for instance, argues _from the sources_ for a minimal surface (delegate to destinations; don't build a subject-data store); the ad-frameworks document chooses CMP interop over becoming a CMP. The one genuine capability gap found — an optional, consent-gated `context` envelope for attribution — is _reserved_, not populated (spec-event-model §4).
- **Extensions compose with the core, never fork it.** The region rule generalizes the existing GPC rule; consent receipts reuse the `{ ads, analytics }` decision shape; the CMP resolver sits above the existing `effectiveConsent` rule. No extension redefines a core contract.

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
- The server lane is a TanStack Start server function; `./server` and `./adapters/tanstack-start` subpaths are denied in client bundles via `SERVER_ONLY_SUBPATHS` (no runtime guard; `codefast mirror` owns the exports map — generated from `dist/`).
- Testing: `tests/unit/**` mirrors `src/**` per the repo taxonomy (jsdom for browser surfaces); consent flows are tested behaviorally (real gtag stub + dataLayer assertions). apps/ui carries the integration matrix and the browser e2e suite (`apps/ui/tests/e2e/**`, Playwright, `pnpm test:e2e:ui`).

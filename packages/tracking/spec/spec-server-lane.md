# spec-server-lane — Initial-Consent Resolution over Shared HTML

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. The problem

Prerendered/ISR/CDN-cached HTML is shared across visitors, so it can carry **nothing region-specific**: baking "US visitor, opt-out" into cached markup would grant analytics by default to every visitor, EU included. Therefore:

- Shared HTML bakes the **strictest initial consent** (spec-consent §8) — all denied, opt-in.
- The region-correct default comes only from a **per-visitor server endpoint**, resolved after load.

## 2. Server resolution

`resolveInitialConsent(countryCode, requestedCategories, hasGpcSignal)`:

1. **Missing country code → the strictest initial consent.** A missing geo header means "unknown visitor" (a prerender crawl, a host without geo), never "known non-EU visitor" — conflating the two would default-grant analytics to everyone on a geo-less host. This check MUST run before region resolution (whose own fallback for unrecognized codes is `other`).
2. Otherwise: region from the country code (spec-consent §2), mode from the region, default decision from mode + requested categories + GPC (spec-consent §3).
3. Return `{ defaultConsent, mode, region }`.

**Request adapter requirements** (however the endpoint is wired):

- Country comes from the platform's geo header (e.g. `x-vercel-ip-country`, ISO 3166-1 alpha-2); GPC from the `sec-gpc` request header equal to `"1"`.
- The response is per-visitor by definition, so the endpoint MUST answer with `cache-control: private, no-store` — no shared cache may ever store it.
- The endpoint MUST be server-only: unreachable from client bundles (build-time import protection, package layout, or separate deployables).

## 3. Client store

The client holds the resolved value in a subscribable store with snapshots:

```json
{ "initialConsent": { "defaultConsent": {…}, "mode": "…", "region": "…" }, "isResolved": false }
```

**States and transitions:**

- **Initial**: the strictest initial consent, `isResolved: false`. This is also the permanent server-render snapshot (hydration-safe: it matches what shared HTML could know).
- `ensureResolved()` — idempotent kick-off; callers SHOULD invoke it early so the round trip overlaps app startup:
  1. Already resolved successfully, or a request in flight → no-op (**single-flight**).
  2. **Session cache hit** (optional): a cached value that passes the initial-consent guard (spec-consent §8) publishes immediately, no request. Cache entries MUST be re-validated before use, never trusted.
  3. Otherwise call the endpoint. Success → write the session cache, publish `{ value, isResolved: true }`; success is **sticky** for the store's lifetime.
  4. Failure (including a synchronous throw from the resolver, which MUST be folded into the same path) → publish **fail-closed**: the strictest value with `isResolved: true` — consent UI can render, under the strictest default — but the failure is **not sticky**: resolution stays retryable.
- **Retry**: after a failure, re-attempt when the tab becomes visible again, the page is restored from cache, or connectivity returns — a visitor who never leaves the tab must not stay fail-closed for the whole session over one network blip. Retries coalesce through the same single-flight guard, and retry listeners are torn down once a resolve succeeds.
- Session-cache read/write failures (private mode, quota) are swallowed — resolve again next page load.

**Consumption.** The live consent mode used by the effective-consent rule (spec-consent §7) and the prompt rule MUST be **re-read from the store per evaluation**, so a post-hydration region resolve wins over the baked strictest default without recreating any gate or tracker.

## 4. Composition (the consent runtime)

One factory composes the client half from the single consent configuration, so every surface shares the same instances by construction:

- one consent storage (from `storageKey`),
- one initial-consent store (over the app's endpoint, with an optional session-cache key),
- one `isAnalyticsAllowed` gate wired to live GPC and the store's current mode.

The UI surface, the tracker gate, and the tag bootstrap MUST all consume these shared instances — two storages or two configs is a spec violation (drifting constants are exactly what the single config exists to prevent).

## Conformance vectors

**V1 — fail-closed on missing geo.** (countryCode: none, requested `["analytics"]`, gpc false) → the strictest initial consent `{defaultConsent:{ads:false,analytics:false}, mode:"opt-in", region:"other"}` — not `other`'s opt-out.

**V2 — resolution.** (`"DE"`, `["analytics"]`, false) → `{mode:"opt-in", region:"eu", defaultConsent:{ads:false,analytics:false}}`. (`"US"`, `["ads","analytics"]`, true) → `{mode:"opt-out", region:"us", defaultConsent:{ads:false,analytics:true}}`.

**V3 — response caching.** Every endpoint response carries `cache-control: private, no-store`.

**V4 — single-flight.** Three concurrent `ensureResolved()` calls → exactly one request.

**V5 — sticky success.** After a successful resolve, further `ensureResolved()` calls make no request and the snapshot keeps the resolved value.

**V6 — retryable failure.** Endpoint fails → snapshot is the strictest value with `isResolved:true`; a subsequent tab-visible/online signal triggers exactly one new request; when it succeeds the resolved value is published and retry listeners stop.

**V7 — cache validation.** A session-cache entry failing the initial-consent guard (e.g. `{mode:"opt-out", region:"eu", …}`) is ignored and the endpoint is called.

**V8 — mode re-read.** Gate evaluated before resolution uses opt-in (all denied ⇒ analytics false); after a resolve to `us`/opt-out with `analytics` requested and no stored decision, the same gate instance evaluates to true.

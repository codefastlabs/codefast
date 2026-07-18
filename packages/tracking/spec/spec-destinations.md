# spec-destinations — Fan-Out Targets and Reference Destinations

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. The destination interface

A destination is the tracker's only dependency for delivery — never a specific provider SDK:

- `name` — a stable identifier for logs/warnings.
- `consentRequirement` — `"required"` (default) or `"exempt"` (§2).
- `send(envelope)` — accepts a `TrackEvent` (spec-event-model §3) and returns a deferred/awaitable result. Destinations own their transport: queueing, batching, and unload delivery are the destination's (or its underlying tag's) job — the tracker adds no queue in front.

`send` SHOULD never throw synchronously; the tracker contains both failure shapes regardless (spec-tracker §4).

## 2. Exemption rules

`consentRequirement: "exempt"` asserts the sink is **cookieless and identifier-free**: it may then receive identifier-stripped envelopes while the consent gate is closed (spec-tracker §3). The default MUST be `"required"` so pre-consent delivery is an explicit opt-in by the integrator, never a silent default.

## 3. Property flattening

Analytics sinks accept flat scalar params only. Before handing properties to such a sink:

- `string`, `number`, `boolean` values pass through.
- `null` passes through only when the sink accepts it (a per-sink `allowNull` switch); otherwise it is dropped.
- `undefined`/absent values are dropped.
- Any other value (object, array, …) is JSON-serialized to a string — never silently dropped by the destination layer.

## 4. Reference destination: Google Analytics 4 via gtag.js (Consent Mode v2, advanced)

Normative for any implementation targeting GA4; the mapping and ordering rules are what keep the integration lawful.

**Consent signal mapping.** One decision drives four signals; the mapping MUST be defined once so runtime updates and the page-load bootstrap cannot drift:

| Consent Mode v2 signal | Driven by category |
| ---------------------- | ------------------ |
| `analytics_storage`    | `analytics`        |
| `ad_storage`           | `ads`              |
| `ad_user_data`         | `ads`              |
| `ad_personalization`   | `ads`              |

`true` → `"granted"`, `false` → `"denied"`.

**Page-load bootstrap** (runs before any tag, e.g. an inline head script):

1. Ensure the command-queue stub exists (the `dataLayer` array + a `gtag()` that pushes into it). First stub wins — recreating would orphan already-queued commands; every helper on one page MUST use the same queue name (default `dataLayer`).
2. Read the stored consent record synchronously from the consent store (this is why the record is plain JSON — spec-consent §5), validating policy version and decision shape inline; failures fall back to the baked-in default decision. Shared/cached HTML MUST bake the strictest default and upgrade after hydration (spec-server-lane).
3. Issue the consent **default** signal from that decision.
4. **Then always load the tag** — advanced Consent Mode: the tag runs even when storage is denied (cookieless pings/modeling). The default signal MUST precede tag load.
5. Queue the tag's own init commands (`js`, `config`) before injecting the script; the tag replays the queue in order once it boots. Script injection is idempotent — a second load call that finds the script already present is a no-op. A CSP nonce, when used, MUST reach both the inline bootstrap and the injected script element.

**Runtime updates.** Whenever the visitor's decision changes (banner choice, preferences page, cross-tab sync), issue the consent **update** signal with the same mapping so already-loaded tags pick up the change without a reload. Implementations SHOULD also run an idempotent tag load when analytics becomes effective, as a safety net when the bootstrap did not run.

**Event delivery.** Forward catalog events as GA4 custom events with flattened properties (§3, null not allowed). GA4 event names must match `^[A-Za-z][A-Za-z0-9_]{0,39}$` — names failing this are accepted by the transport but silently dropped at GA4 processing, so the destination MUST warn and skip instead of sending nowhere. Page views are not this destination's job (the tag's own config/enhanced measurement handles them). If the tag/queue is absent, `send` is a silent no-op.

**Withdrawal.** Consent Mode stops using Google's cookies once denied but never removes them. On analytics withdrawal the implementation MUST expire `_ga` and every `_ga_*` cookie, on `path=/` for both the host and its parent-domain variant (the tag sets its cookie on the broadest domain it can reach).

## 5. Reference destination: cookieless counter (Vercel Analytics shape)

A sink that is cookieless and attaches no identifier from this system — hence exempt-eligible (`"exempt"` still opt-in per §2). Delivery only pushes onto the provider's own in-page queue; the provider script is loaded once elsewhere by the app. Properties flatten per §3 with null allowed.

## Conformance vectors

**V1 — flattening.** `{a:"x", b:2, c:true, d:null, e:undefined, f:{g:1}, h:[1]}` with null disallowed → `{a:"x", b:2, c:true, f:"{\"g\":1}", h:"[1]"}`; with null allowed → same plus `d:null`.

**V2 — consent mapping.** `{ads:false, analytics:true}` → `{ad_personalization:"denied", ad_storage:"denied", ad_user_data:"denied", analytics_storage:"granted"}`.

**V3 — bootstrap fallback.** Stored record valid under the current policy version → its decision drives the default signal. Record under an old version, malformed, or absent → the baked default drives it. In every case the default signal precedes tag load, and the tag loads even when all-denied.

**V4 — GA4 name guard.** `"newsletter_signup"` sent; `"9lives"`, `"has-dash"`, and a 41-char name → warned and skipped, nothing sent.

**V5 — cookie cleanup.** Cookies `_ga`, `_ga_ABC123`, `_gcl_au` present; withdrawal expires `_ga` and `_ga_ABC123` (both domain variants) and leaves `_gcl_au` untouched.

# spec-destinations — Fan-Out Targets and Reference Destinations

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. The destination interface

A destination is the tracker's only dependency for delivery — never a specific provider SDK:

- `name` — a stable identifier for logs/warnings.
- `consentRequirement` — `"required"` (default) or `"exempt"` (§2).
- `send(envelope)` — accepts a `TrackEvent` (spec-event-model §3) and returns a deferred/awaitable result. Destinations own their transport: queueing, batching, and unload delivery are the destination's (or its underlying tag's) job — the tracker adds no queue in front.

`send` SHOULD never throw synchronously; the tracker contains both failure shapes regardless (spec-tracker §4).

## 2. Exemption rules

`consentRequirement: "exempt"` asserts the sink is cookieless and identifier-free: it may then receive identifier-stripped envelopes while the consent gate is closed (spec-tracker §3). The default MUST be `"required"` so pre-consent delivery is an explicit opt-in by the integrator, never a silent default.

**Conditions for exemption.** A sink MAY be declared `"exempt"` only if it satisfies **all** of the following (CNIL Sheet n°16, the audience-measurement exemption; access 2026-07-18):

1. No client-side persistent storage or read-back of a stable device identifier — no cookies, no local-storage ids, no fingerprint. A **daily-salted rotating hash qualifies; a stable hash does not.**
2. Purpose strictly limited to first-party audience measurement — no ad or marketing use.
3. Single-site scope; no cross-site/cross-app linkage of the same user.
4. No cross-referencing with other datasets (CRM, other-site stats).
5. IP address truncated/discarded, never stored raw.
6. Output is aggregate/anonymous, not directly or indirectly re-identifiable.
7. Retention capped (CNIL: tracker life ≤ 13 months).
8. Transparency plus a free, simple opt-out even when banner-exempt.

**The non-negotiable caveat.** Exemption is from the ePrivacy **consent banner only** — GDPR still requires a documented legal basis for server-side IP processing (IP is personal data), and EDPB _Guidelines 2/2023 on the Technical Scope of Art. 5(3)_ hold that pixels and fingerprinting are in scope regardless of cookies. Exemption is **jurisdiction-dependent** (France/Luxembourg eligible if all conditions hold; UK conditionally eligible post the DUAA/PECR "statistical purposes" exception — **UNCERTAIN**; Germany treats it as consent-likely) and there is **no EU-wide regulator-certified "no consent" status** — vendor "no cookie banner needed" claims are self-assertions. **Design implication: exemption MUST be gateable per-jurisdiction, not assumed global** — wire it to the region rule ([spec-regions](spec-regions.md)), not to a build-time constant.

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

### 4a. Per-region Consent Mode defaults

To bake a stricter EEA baseline while defaulting the rest of the world differently, Consent Mode v2's `default` command takes a `region` array of ISO 3166-2 codes — accepting both country (`"ES"`, `"US"`) and subdivision (`"US-CA"`) codes. Rules stack, **most-specific region wins**, and a `default` command with **no** `region` is the catch-all for visitors not covered by a region-specific command. Emit region-specific defaults first, then the global catch-all. This mirrors [spec-regions](spec-regions.md) §4's "most-specific ISO 3166-2 wins, unknown → strictest" resolution. `wait_for_update` (milliseconds) gives an async consent source time to `update` before tags fire. (`url_passthrough`/`ads_data_redaction` are `gtag('set', …)` flags, **not** consent-command fields — do not place them in the consent object.)

## 5. Additional platform destinations

> **Status: reference mappings implemented; transports are the integrator's.** The reference implementation ships GA4 (§4), the cookieless counter (§6), and reference `{ ads, analytics }` mappings for Meta, TikTok, and Microsoft UET (`createMetaDestination` / `createTiktokDestination` / `createMicrosoftUetDestination` plus their consent mappers) — consent-restriction mapping only; the Pixel/CAPI/`ttq`/`uetq` transports, tag ids, and credentials remain the integrator's. These mappings specify how the normalized `{ ads, analytics }` decision drives other ad platforms. Access dates 2026-07-18; **UNCERTAIN** items need verification against live platform docs (these APIs change frequently).

Unlike GA4's unified Consent Mode object, other platforms expose per-vendor shapes. Each MUST consume the same `{ ads, analytics }` decision:

| Platform                      | Gate driven by `analytics`                                                                                     | Restriction driven by `ads`                                                                                           | Notes                                                                                                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Microsoft UET**             | —                                                                                                              | `ad_storage` (the **only enforced** signal) via `uetq.push('consent','default'\|'update',{...})`                      | no `analytics_storage`; absent-signal default is region-dependent (denied in EEA/UK/CH, enforced 2025-05-05). `ad_user_data`/`ad_personalization` accepted but no documented behavior — **UNCERTAIN**, don't model as functional |
| **Meta Pixel / CAPI**         | transmission gate: `fbq('consent','revoke'\|'grant')` (Pixel); gate at send boundary (CAPI — no consent field) | Limited Data Use: `fbq('dataProcessingOptions',['LDU'],0,0)` (Pixel); `data_processing_options` (CAPI)                | `0,0` = let Meta geolocate (recommended). Only country `1`=USA, state `1000`=California are documented codes — **not FIPS**; use `0,0` beyond California                                                                         |
| **TikTok Pixel / Events API** | `ttq.holdConsent()` before load, then `ttq.grantConsent()`/`revokeConsent()`                                   | LDU: `ttq.load(id,{limited_data_use:true})` or per-event; server `limited_data_use:true` (**requires IP in payload**) | single boolean, **not** Meta's `data_processing_options` structure; no signal object; `ttq.updateConsent()` is legacy — do not use                                                                                               |

Cross-cutting: a US opt-out (`ads = false` via GPC/GPP) maps to LDU on Meta/TikTok and `ad_storage: denied` on UET/GA4, but MUST NOT withdraw first-party `analytics` (spec-consent §3). What breaks if consent is wrong is legal (EEA users excluded from ad audiences; unlawful pre-consent hits) and often silent (a left-on `revoke` withholds everything; LDU without an IP does nothing) — so these mappings are normative, not advisory. For programmatic ad serving in the EEA/UK/CH the platform decision comes from a CMP, not this native mapping — see [spec-ad-consent-frameworks](spec-ad-consent-frameworks.md).

## 6. Reference destination: cookieless counter (Vercel Analytics shape)

A sink that is cookieless and attaches no identifier from this system — hence exempt-eligible (`"exempt"` still opt-in per §2, and still subject to §2's per-jurisdiction caveat: some regulators require consent even for cookieless analytics). Delivery only pushes onto the provider's own in-page queue; the provider script is loaded once elsewhere by the app. Properties flatten per §3 with null allowed.

## Conformance vectors

**V1 — flattening.** `{a:"x", b:2, c:true, d:null, e:undefined, f:{g:1}, h:[1]}` with null disallowed → `{a:"x", b:2, c:true, f:"{\"g\":1}", h:"[1]"}`; with null allowed → same plus `d:null`.

**V2 — consent mapping.** `{ads:false, analytics:true}` → `{ad_personalization:"denied", ad_storage:"denied", ad_user_data:"denied", analytics_storage:"granted"}`.

**V3 — bootstrap fallback.** Stored record valid under the current policy version → its decision drives the default signal. Record under an old version, malformed, or absent → the baked default drives it. In every case the default signal precedes tag load, and the tag loads even when all-denied.

**V4 — GA4 name guard.** `"newsletter_signup"` sent; `"9lives"`, `"has-dash"`, and a 41-char name → warned and skipped, nothing sent.

**V5 — cookie cleanup.** Cookies `_ga`, `_ga_ABC123`, `_gcl_au` present; withdrawal expires `_ga` and `_ga_ABC123` (both domain variants) and leaves `_gcl_au` untouched.

# spec-tracker — The Tracking Pipeline

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. Tracker construction

A client tracker is created from:

- `catalog` — the app's event catalog (spec-event-model §1).
- `destinations` — the fan-out list (spec-destinations).
- `anonymousId` — a **callable** returning the visitor id, not a pre-resolved value. It is invoked per allowed event, so
  id minting stays lazy (spec-identity §1) and never happens as a construction side effect.
- `getConsent` — an optional **callable** returning the visitor's effective consent decision (spec-consent §7). Omitted
  means every destination is permitted.

## 2. The `track(name, properties)` algorithm

1. **Resolve the definition.** `catalog[name]`; unknown → raise `Unknown event: <name>`. This is a programmer error and
   MUST propagate (unlike delivery errors).
2. **Validate.** Run schema validation per spec-event-model §2; failures propagate. The parsed output replaces the raw
   input from here on.
3. **Evaluate the gate — per event, per destination, at track time.** Read `getConsent` once for the event, then ask
   each destination whether that decision permits it (spec-destinations §1, `isPermittedBy`; default: `analytics`
   granted). Never cache either result at construction: a consent change mid-session MUST apply to the very next event.
   Each destination is gated on its own purpose — an `analytics` grant MUST NOT open an `ads` destination, and an `ads`
   grant MUST NOT be blocked by an `analytics` denial.
4. **Short-circuit.** If no destination is permitted and no unpermitted destination is exempt, return — nothing is
   built, nothing is sent, and no id is minted.
5. **Build the envelope** (spec-event-model §3): `eventId` a fresh random UUID, `timestamp` now, `type` `"track"`,
   `properties` the parsed output.
   - `anonymousId` for permitted destinations: invoke the `anonymousId` callable once (this is the one place minting may
     happen). It MUST NOT be invoked when no destination is permitted, so no id is ever minted as a side effect of a
     gated event.
   - `anonymousId` for the exempt lane: the empty string.
6. **Fan out.** Every permitted destination receives the identified envelope; every exempt destination the decision does
   not permit receives the identifier-free one (§3). Both share one `eventId`, so a downstream join can dedupe them;
   every other destination receives nothing.

## 3. The exempt lane

Destinations marked `consentRequirement: "exempt"` (spec-destinations §2) keep receiving events while their own consent
is not met, under strict conditions:

- Gated envelopes are **identifier-free**: `anonymousId` is `""` and no id is minted for them.
- Nothing is persisted on the visitor's device for the exempt delivery.
- Exemption is only for cookieless, identifier-free sinks; it is the destination author's assertion, and the default is
  `"required"` so pre-consent delivery stays an explicit opt-in.

## 4. Delivery error handling

Tracking MUST never break the tracked interaction:

- A destination's `send` is fire-and-forget at track time; the tracker does not await it.
- Both failure shapes MUST be contained: an asynchronous rejection **and** a synchronous throw from a non-conforming
  destination (the interface says `send` returns a deferred value, but a third-party implementation may violate that).
  Neither may propagate to the `track()` caller, and a failing destination MUST NOT prevent the remaining destinations
  from receiving the event.
- Contrast with steps 1–2: unknown-event and validation errors are caller bugs and MUST propagate.

## Conformance vectors

Setup for all vectors: catalog `{ "signup": schema {plan: string} }`; destinations `D_req` (required, default
`analytics` permission) and `D_ex` (exempt, default permission); id callable returns `A` and counts invocations.
"Granted" is `{ads:true, analytics:true}`, "denied" `{ads:false, analytics:false}`.

**V1 — consent granted.** Consent → granted. `track("signup", {"plan":"pro"})` → both `D_req` and `D_ex` receive one
envelope with `anonymousId == A`; id callable invoked once.

**V2 — consent denied, exempt lane.** Consent → denied. Same call → only `D_ex` receives the envelope, with
`anonymousId == ""`; id callable invoked zero times.

**V3 — consent denied, no exempt destinations.** Destinations `[D_req]`, consent → denied. Same call → no delivery, no
envelope, id callable invoked zero times, caller sees no error.

**V4 — mid-session consent change.** Consent is denied for the first call, granted for the second → first delivers per
V2/V3 semantics, second per V1. No construction-time caching.

**V5 — destination failure isolation.** `D_req.send` throws synchronously; a second destination `D_ok` is registered.
`track()` returns normally and `D_ok` still receives the event. Same outcome when `D_req.send` rejects asynchronously.

**V6 — validation failures propagate.** `track("signup", {"plan": 5})` raises; `track("nope", {})` raises; no
destination receives anything in either case.

**V7 — per-destination purpose.** Add `D_ads`, permitted only when `ads` is granted. Consent
`{ads:false, analytics:true}` → `D_req` receives the identified envelope, `D_ads` nothing. Consent
`{ads:true, analytics:false}` → `D_ads` receives the identified envelope (id callable invoked once), `D_req` nothing,
and `D_ex` the identifier-free envelope with the same `eventId`.

## License

Released under the [MIT License](../LICENSE).

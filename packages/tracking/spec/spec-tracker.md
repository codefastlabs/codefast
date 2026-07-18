# spec-tracker — The Tracking Pipeline

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. Tracker construction

A client tracker is created from:

- `catalog` — the app's event catalog (spec-event-model §1).
- `destinations` — the fan-out list (spec-destinations).
- `anonymousId` — a **callable** returning the visitor id, not a pre-resolved value. It is invoked per allowed event, so id minting stays lazy (spec-identity §1) and never happens as a construction side effect.
- `isAnalyticsAllowed` — an optional **callable** consent gate. Omitted means "always allowed".

## 2. The `track(name, properties)` algorithm

1. **Resolve the definition.** `catalog[name]`; unknown → raise `Unknown event: <name>`. This is a programmer error and MUST propagate (unlike delivery errors).
2. **Validate.** Run schema validation per spec-event-model §2; failures propagate. The parsed output replaces the raw input from here on.
3. **Evaluate the gate — per event, at track time.** Never cache the gate result at construction: a consent change mid-session MUST apply to the very next event.
4. **Short-circuit.** If the gate is closed and no destination is exempt, return — nothing is built, nothing is sent, and no id is minted.
5. **Build the envelope** (spec-event-model §3):
   - `anonymousId`: if the gate is open, invoke the `anonymousId` callable (this is the one place minting may happen); if closed, the empty string — the callable MUST NOT be invoked, so no id is ever minted as a side effect of a gated event.
   - `eventId`: fresh random UUID. `timestamp`: now. `type`: `"track"`. `properties`: the parsed output.
6. **Fan out.** Gate open → every destination receives the envelope; gate closed → only exempt destinations receive it. All destinations receive the same envelope value.

## 3. The exempt lane

Destinations marked `consentRequirement: "exempt"` (spec-destinations §2) keep receiving events while the gate is closed, under strict conditions:

- Gated envelopes are **identifier-free**: `anonymousId` is `""` and no id is minted for them.
- Nothing is persisted on the visitor's device for the exempt delivery.
- Exemption is only for cookieless, identifier-free sinks; it is the destination author's assertion, and the default is `"required"` so pre-consent delivery stays an explicit opt-in.

## 4. Delivery error handling

Tracking MUST never break the tracked interaction:

- A destination's `send` is fire-and-forget at track time; the tracker does not await it.
- Both failure shapes MUST be contained: an asynchronous rejection **and** a synchronous throw from a non-conforming destination (the interface says `send` returns a deferred value, but a third-party implementation may violate that). Neither may propagate to the `track()` caller, and a failing destination MUST NOT prevent the remaining destinations from receiving the event.
- Contrast with steps 1–2: unknown-event and validation errors are caller bugs and MUST propagate.

## Conformance vectors

Setup for all vectors: catalog `{ "signup": schema {plan: string} }`; destinations `D_req` (required) and `D_ex` (exempt); id callable returns `A` and counts invocations.

**V1 — gate open.** Gate → true. `track("signup", {"plan":"pro"})` → both `D_req` and `D_ex` receive one envelope with `anonymousId == A`; id callable invoked once.

**V2 — gate closed, exempt lane.** Gate → false. Same call → only `D_ex` receives the envelope, with `anonymousId == ""`; id callable invoked zero times.

**V3 — gate closed, no exempt destinations.** Destinations `[D_req]`, gate → false. Same call → no delivery, no envelope, id callable invoked zero times, caller sees no error.

**V4 — mid-session consent change.** Gate returns false for the first call, true for the second → first delivers per V2/V3 semantics, second per V1. No construction-time caching.

**V5 — destination failure isolation.** `D_req.send` throws synchronously; a second destination `D_ok` is registered. `track()` returns normally and `D_ok` still receives the event. Same outcome when `D_req.send` rejects asynchronously.

**V6 — validation failures propagate.** `track("signup", {"plan": 5})` raises; `track("nope", {})` raises; no destination receives anything in either case.

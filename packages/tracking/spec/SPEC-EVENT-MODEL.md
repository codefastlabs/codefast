# SPEC-EVENT-MODEL — Catalog, Validation, Envelope

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. Event catalog

An **event catalog** is an app-defined map from event name to an event definition. The tracking library MUST NOT ship any events of its own — every consuming app builds and passes in its own catalog.

- An **event definition** carries, at minimum, a **schema** for that event's properties.
- Event names are the catalog's keys; the tracker accepts only names present in the catalog.

The schema mechanism is implementation-defined (the reference implementation uses Standard Schema), but it MUST provide:

- **Synchronous validation.** Tracking sits on synchronous call paths; a schema that can only validate asynchronously MUST be rejected with an error at track time — not awaited, not silently skipped.
- **A parsed output.** Validation returns the value destinations receive. Unknown keys MUST NOT survive validation (either the schema strips them or the implementation forwards only the parsed output), so arbitrary caller data cannot ride along to third-party sinks.
- **Failure detail.** A validation failure MUST raise an error identifying the event name and the schema's issue messages.

## 2. Property validation

Given `(schema, eventName, rawProperties)`:

1. Run the schema's synchronous validation on `rawProperties`.
2. If the schema reports it validates asynchronously → error: async schemas are unsupported by design.
3. If validation reports issues → error carrying `eventName` and the joined issue messages.
4. Otherwise return the **parsed output** (transforms applied, unknown keys stripped). Destinations MUST receive this output, never the raw input.

## 3. The `TrackEvent` envelope

Every event handed to a destination is one JSON-representable envelope:

```json
{
  "type": "track",
  "name": "newsletter_signup",
  "properties": { "plan": "pro" },
  "anonymousId": "6f1c2a4e-9b0d-4c3e-8f5a-1d2e3c4b5a69",
  "eventId": "0d9b8a7c-6e5f-4d3c-2b1a-9f8e7d6c5b4a",
  "timestamp": 1752796800000
}
```

| Field         | Type   | Rules                                                                                                            |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `type`        | string | Always `"track"`. A discriminant: a future event kind is an additive union member, never a change to this shape. |
| `name`        | string | The catalog key the caller tracked.                                                                              |
| `properties`  | object | The parsed output of schema validation (section 2).                                                              |
| `anonymousId` | string | The visitor's anonymous id — or the empty string `""` when the consent gate is closed (see SPEC-TRACKER §3).     |
| `eventId`     | string | A freshly generated random UUID (RFC 4122 v4), stamped at track time. Destinations that dedupe MAY key on it.    |
| `timestamp`   | number | Milliseconds since the Unix epoch, stamped at track time.                                                        |

- `eventId` MUST be unique per `track()` call — never reused across retries or destinations.
- The envelope is immutable once built: every destination in a fan-out receives the same envelope value.

## Conformance vectors

**V1 — parsed output forwarded, unknown keys stripped.** Schema: `{ plan: string }`. Input properties `{ "plan": "pro", "injected": "x" }` → destinations receive `{ "plan": "pro" }`.

**V2 — validation failure.** Schema requires `plan: string`. Input `{ "plan": 5 }` → error whose message contains the event name and the schema's issue message; no destination receives anything.

**V3 — async schema rejected.** A schema whose validation returns a deferred/promise value → error stating the event uses an async schema; no destination receives anything.

**V4 — unknown event name.** `track("not_in_catalog", …)` → error `Unknown event: not_in_catalog`; no destination receives anything.

**V5 — envelope shape.** A permitted `track("signup", {"plan":"pro"})` with anonymous id `A` produces an envelope where `type == "track"`, `name == "signup"`, `properties == {"plan":"pro"}`, `anonymousId == A`, `eventId` matches `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` (case-insensitive), and `timestamp` is the current epoch-milliseconds.

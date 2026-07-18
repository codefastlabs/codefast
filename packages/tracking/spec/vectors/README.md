# Conformance Vectors

Machine-readable versions of the conformance vectors from each spec document, so an implementation in **any language** can run them as a test suite instead of transcribing prose.

Each `<area>.json` file mirrors one spec document's Conformance section. The prose vectors remain in the spec documents (they are the human-readable source of truth); these JSON files are the executable projection, cross-linked by the `source` field.

## File format

```jsonc
{
  "area": "consent", // short area name
  "spec": "spec-consent.md", // the spec document these vectors project
  "specVersion": "1.0.0", // the spec version they were written against (see ../CHANGELOG.md)
  "vectors": [/* Vector[] */],
}
```

A **Vector** is one of two kinds:

- **`"pure"`** — a deterministic function of its input. Runnable as `assert(operation(input) ≈ expect)`.

  ```jsonc
  {
    "id": "consent.region.de", // stable, unique, dotted
    "source": "V1", // the prose vector id in the spec document
    "summary": "German country code resolves to the eu region",
    "kind": "pure",
    "operation": "resolveRegionFromCountryCode",
    "input": { "countryCode": "de" },
    "expect": { "region": "eu" },
  }
  ```

- **`"scenario"`** — a behavioural given/when/then. The implementation supplies a harness that sets up `given`, invokes `when`, and asserts `expect`.

  ```jsonc
  {
    "id": "tracker.gate-closed.exempt-only",
    "source": "V2",
    "summary": "Gate closed: only exempt destinations receive, identifier-free",
    "kind": "scenario",
    "given": { "gate": "closed", "destinations": ["required:D_req", "exempt:D_ex"] },
    "when": "track('signup', { plan: 'pro' })",
    "expect": { "received": { "D_ex": 1, "D_req": 0 }, "anonymousId": "", "anonymousIdCallableInvocations": 0 },
  }
  ```

## `expect` conventions

`expect` is a free object; these keys are conventional across files:

- pure value fields (`region`, `mode`, `decision`, …) — assert equality with the operation's return.
- `"error": true` (optionally `"errorContains": [ "substring", … ]`) — the operation MUST raise.
- `"valid": true | false` — for guard/predicate operations.
- `"none": true` — the operation returns the language's "absent" (null/undefined/None/Option.none).

## `operation` / `when` names

These name the spec's abstract operation, not a TypeScript symbol — an implementation maps them to its own function names (e.g. `resolveEffectiveConsent`, `flattenEventProps`, `buildAnonymousIdSetCookie`). They are stable identifiers, kebab/camel per the spec's own vocabulary.

## Legal vectors are not law

Vectors in `regions.json`, `ad-consent-frameworks.json`, `consent-receipts.json`, and `data-subject-rights.json` encode the **engineering behaviour** the spec specifies. Where the underlying legal fact is flagged **UNCERTAIN** in the spec document, the vector carries `"uncertain": true` — it tests that the implementation behaves as the spec says, not that the spec's legal premise is settled. Re-verify those premises with counsel (see the parent spec documents).

## Running them

There is no bundled runner — each implementation writes a thin adapter that (a) loads a file, (b) for each `pure` vector calls the named operation and compares to `expect`, (c) for each `scenario` vector drives its own harness. The `vector.schema.json` here validates the file shape itself.

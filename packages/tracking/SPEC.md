# @codefast/tracking — Spec

The specification lives in [spec/](spec/README.md) as a language-neutral contract: any modern language can implement it,
and this package is the reference implementation.

Each document is named for the identifier it is cited by — `spec-consent §3` in a comment or a test points at
[spec/spec-consent.md](spec/spec-consent.md).

- [spec/README.md](spec/README.md) — index: goals, non-goals, architecture layers, terminology, and the
  TypeScript-binding notes.
- [spec/spec-event-model.md](spec/spec-event-model.md) — catalog, validation, the `TrackEvent` envelope.
- [spec/spec-consent.md](spec/spec-consent.md) — categories, regions/modes, records, effective consent.
- [spec/spec-identity.md](spec/spec-identity.md) — anonymous-id lifecycle and cookie contract.
- [spec/spec-tracker.md](spec/spec-tracker.md) — the tracking pipeline.
- [spec/spec-destinations.md](spec/spec-destinations.md) — destination interface and reference destinations.
- [spec/spec-server-lane.md](spec/spec-server-lane.md) — initial-consent resolution over shared/cached HTML.
- [spec/spec-security.md](spec/spec-security.md) — Security & Privacy Considerations, consolidated across all documents.

Each document ends with a prose Conformance section, projected into machine-readable vectors under
[spec/vectors/](spec/vectors/README.md) so an implementation in any language can run them. This package ships **no
runner for them** — `tests/unit/**` implements the same contract independently, so a vector and a unit test agreeing is
evidence, not a tautology. The index above lists the seven core documents; four commercial-scope extensions sit
alongside them.

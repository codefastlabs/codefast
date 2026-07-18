# @codefast/tracking — Spec

The specification now lives in [spec/](spec/spec.md), rewritten as a language-neutral contract: any modern language can implement it, and this package is the reference implementation.

- [spec/spec.md](spec/spec.md) — index: goals, non-goals, architecture layers, terminology, and the TypeScript-binding notes.
- [spec/spec-event-model.md](spec/spec-event-model.md) — catalog, validation, the `TrackEvent` envelope.
- [spec/spec-consent.md](spec/spec-consent.md) — categories, regions/modes, records, effective consent.
- [spec/spec-identity.md](spec/spec-identity.md) — anonymous-id lifecycle and cookie contract.
- [spec/spec-tracker.md](spec/spec-tracker.md) — the tracking pipeline.
- [spec/spec-destinations.md](spec/spec-destinations.md) — destination interface and reference destinations.
- [spec/spec-server-lane.md](spec/spec-server-lane.md) — initial-consent resolution over shared/cached HTML.

Each document ends with conformance test vectors (JSON input → output) mirroring this package's `tests/unit/**` suite.

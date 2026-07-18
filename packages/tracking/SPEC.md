# @codefast/tracking — Spec

The specification now lives in [spec/](spec/SPEC.md), rewritten as a language-neutral contract: any modern language can implement it, and this package is the reference implementation.

- [spec/SPEC.md](spec/SPEC.md) — index: goals, non-goals, architecture layers, terminology, and the TypeScript-binding notes.
- [spec/SPEC-EVENT-MODEL.md](spec/SPEC-EVENT-MODEL.md) — catalog, validation, the `TrackEvent` envelope.
- [spec/SPEC-CONSENT.md](spec/SPEC-CONSENT.md) — categories, regions/modes, records, effective consent.
- [spec/SPEC-IDENTITY.md](spec/SPEC-IDENTITY.md) — anonymous-id lifecycle and cookie contract.
- [spec/SPEC-TRACKER.md](spec/SPEC-TRACKER.md) — the tracking pipeline.
- [spec/SPEC-DESTINATIONS.md](spec/SPEC-DESTINATIONS.md) — destination interface and reference destinations.
- [spec/SPEC-SERVER-LANE.md](spec/SPEC-SERVER-LANE.md) — initial-consent resolution over shared/cached HTML.

Each document ends with conformance test vectors (JSON input → output) mirroring this package's `tests/unit/**` suite.

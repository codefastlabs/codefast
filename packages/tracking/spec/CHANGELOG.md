# Spec Changelog

Versioning for the tracking specification itself, independent of the `@codefast/tracking` package version. The spec follows SemVer: **major** = a breaking change to a normative contract (wire format, algorithm, guard); **minor** = additive normative content (a new document, a new optional field, new vectors); **patch** = clarifications, citation refreshes, non-normative edits.

Because the extension documents cite fast-moving law and platform contracts, a **citation refresh** (re-verifying a source, correcting an access-dated fact) is a patch even when it changes a jurisdictional claim — the _engineering_ contract is unchanged. When a re-verified legal fact changes what an implementation must _do_ (e.g. a region's `optOutSignalBinding` flips), that is a minor.

## 1.0.0 — 2026-07-18

Initial published specification.

### Core (implemented in the reference package)

- `spec-event-model`, `spec-consent`, `spec-identity`, `spec-tracker`, `spec-destinations`, `spec-server-lane` — the language-neutral contract for consent-gated, first-party event tracking, extracted from the `@codefast/tracking` TypeScript implementation.
- Reserved (not populated): an optional consent-gated `context` envelope on `TrackEvent` (`spec-event-model` §4); `page`/`identify` as anticipated future `type` discriminant members.

### Commercial-scope extensions (design targets, not yet implemented)

- `spec-regions` — data-driven worldwide jurisdictional consent rules replacing the four-value region enum.
- `spec-consent-receipts` — server-side audit trail for demonstrable consent (GDPR Art. 7, EDPB 05/2020, ISO/IEC TS 27560).
- `spec-ad-consent-frameworks` — IAB TCF/GPP interop (read an external CMP, don't become one).
- `spec-data-subject-rights` — minimal DSR surface, delegating to destinations.

### Infrastructure

- `vectors/` — machine-readable conformance vectors (`*.json`) projecting each document's prose Conformance section, with `vector.schema.json` and a format `README.md`.
- `spec-security` — consolidated Security & Privacy Considerations.
- This changelog + spec versioning.

### Known verification debt (see per-document UNCERTAIN flags)

- US per-state effective dates and the "~12-state GPC" list are a moving target; several official state sites were unreachable during research and rest on mirrors. **Montana** (2025 SB 297 may have repealed its UOOM mandate) and **Maryland** (permissive "may utilize" wording) are flagged CONTESTED rather than settled.
- Fast-moving external facts to re-confirm before any extension becomes normative: TCF v2.3 mandatory date, Vietnam PDPL article numbering, Google GVL vendor id, Consent Mode v2 platform mechanics.
- All UNCERTAIN legal premises require counsel review before implementation.

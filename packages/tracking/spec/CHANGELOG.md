# Spec Changelog

Versioning for the tracking specification itself, independent of the `@codefast/tracking` package version. The spec follows SemVer: **major** = a breaking change to a normative contract (wire format, algorithm, guard); **minor** = additive normative content (a new document, a new optional field, new vectors); **patch** = clarifications, citation refreshes, non-normative edits.

Because the extension documents cite fast-moving law and platform contracts, a **citation refresh** (re-verifying a source, correcting an access-dated fact) is a patch even when it changes a jurisdictional claim — the _engineering_ contract is unchanged. When a re-verified legal fact changes what an implementation must _do_ (e.g. a region's `optOutSignalBinding` flips), that is a minor.

## 1.0.3 — 2026-07-18

### Status refresh across the implemented extensions (patch)

- **spec-destinations §5** — "not yet implemented" → reference `{ ads, analytics }` mappings for Meta / TikTok / Microsoft UET now ship (consent-restriction mapping only; transports the integrator's).
- **spec-consent-receipts** — the durable store frame (`createDurableReceiptStore` over an injected backend) and the integrity `sign` seam (HMAC wired in the reference app) now ship; what remains is a backend client, retention, and counsel review.
- **spec-data-subject-rights** — "partially met" → "largely met": the per-destination `onErasure` hook + `tracker.erase` and the GA4 delete delegation now ship alongside the gate + `clear()`.

Non-normative across all three: contracts and vectors are unchanged.

## 1.0.2 — 2026-07-18

### spec-ad-consent-frameworks — status refresh (patch)

- **Interop reconciler now implemented.** The status line flips from "not yet implemented" to note that `@codefast/tracking` ships `reconcileAdFrameworkConsent` + `hasTcfApi`/`hasGppApi` (§3 precedence, vectors V1–V6), while deriving the `CmpConsentSignal` from a live CMP's `TCData`/GPP (the purpose set + Google GVL vendor id) remains ad-ops policy the integrator supplies. Non-normative: the §3 contract and vectors are unchanged.

## 1.0.1 — 2026-07-18

### spec-data-subject-rights — citation refresh (patch)

- **GA4 User Deletion — corrected to the current API.** The legacy v3 `userDeletionRequests:upsert` cited in §3 and vector DSR-V3 was sunset with Universal Analytics. Updated to the Analytics Admin API `properties.submitUserDeletion` (`analytics.edit` scope), keyed by a flat `clientId`. DSR-V3 and `data-subject-rights.json` now snapshot `{ body: { clientId }, url }` at `.../v1alpha/properties/{propertyId}:submitUserDeletion`. Implemented in the reference package as `buildGa4UserDeletionRequest` / `submitGa4UserDeletion`.

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

### Post-publication verification (2026-07-18)

A verification pass against primary sources, same day. Each item is CONFIRMED (matched primary), CORRECTED (fact changed), or STILL-UNREACHABLE (official source blocked this session; claim kept flagged, not fabricated).

- **CORRECTED — Montana dropped from the GPC-mandate list.** Verified against `mca.legmt.gov` and the enrolled SB 297 (both reachable): 2025 SB 297 repealed the universal-opt-out-mechanism duty (Section 15 of Ch. 681, L. 2023). Current MCDPA prescribes only a controller-established opt-out means + a manual link. `spec-regions` Montana row flipped to "no GPC mandate"; the count is now ~11 states. (Under the versioning policy this touches a normative value — a state's `optOutSignalBinding` — but the affected document is a pre-implementation design target and the claim was already UNCERTAIN-flagged, so it is folded into 1.0.0 rather than cut as a minor.)
- **CORRECTED — Vietnam PDPL article numbering.** Enacted PDPL (Law 91/2025/QH15) uses **Art. 9 (consent) / Art. 10 (withdrawal)**, not the predecessor Decree 13/2023's Art. 11–12. `spec-consent-receipts` updated.
- **CONFIRMED — TCF v2.3** mandatory 2026-02-28, reader-unaffected (reasoned inference); **Google GVL vendor id 755** for Google Advertising Products (corroborated via Google's TCF validation error 1.4, not a direct read of the live vendor list); **Consent Mode v2 `region`** ISO 3166-2 array with most-specific-wins and a no-region catch-all. `spec-ad-consent-frameworks` de-hedged accordingly.
- **STILL-UNREACHABLE — six US state primary sites** (Texas served only a JS shell; Connecticut, Rhode Island, Utah, Nebraska, New Jersey refused TLS connections). The TX §541.055(e)/§541.156, CT §42-520(e) (vs the mis-cited §42-518), RI, Utah post-2026-amendment, NE no-PRA, and NJ rulemaking-status citations therefore remain **primary-unverified** and stay flagged; re-run when those hosts are reachable (Texas needs a JS-executing browser).

### Known verification debt (see per-document UNCERTAIN flags)

- US per-state effective dates and the (now ~11-state) GPC list remain a moving target; the six state citations above are mirror-based pending primary re-verification.
- **Maryland** (permissive "may utilize" wording) is still flagged CONTESTED rather than settled.
- All remaining UNCERTAIN legal premises require counsel review before implementation.

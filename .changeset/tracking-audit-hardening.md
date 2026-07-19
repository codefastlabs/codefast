---
"@codefast/tracking": minor
---

Harden the package from a full audit — correctness, coverage, and a leaner public surface.

- **`isConsentReceiptInput` now validates `method` and `subjectIdType` against their enums**, not just `typeof === "string"` — the untrusted-body guard no longer narrows a bogus value to a closed union member.
- **`CookieAnonymousId` gains `current()`** — a non-minting read of the existing id (`undefined` when none) so a consent receipt stamps the id the visitor already carries instead of a throwaway that never correlates for erasure.
- **`coarsenIp` rejects out-of-range IPv4 octets** (`"999.…"`) rather than storing a malformed coarse value.
- **Microsoft UET consent routes through the shared `toAdConsentState` ad lever**, so its `ad_storage` mapping can't drift from Meta/TikTok.
- **Dropped unused foreign type re-exports** so each type has one home: `InitialConsent` no longer re-exported from `adapters/tanstack-start` or `server/initial-consent` (import it from `core/consent`), and the `AnonymousIdResponseCookieOptions` alias is gone — `setAnonymousIdResponseCookie` takes `AnonymousIdCookieOptions` from `server/anonymous-id-cookie` directly.
- **Collapsed the `TrackedEvent` envelope to a single interface** — the unused `TrackedEventBase` and `TrackEvent` names are gone (`TrackedEvent` keeps the `type: "track"` discriminant for a future additive union).

Also adds test coverage for the previously-untested `recordConsentReceiptFromRequest` adapter path (no-store header, body-IP rejection, coarsened IP, PII-free ack).

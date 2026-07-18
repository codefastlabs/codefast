# spec-security — Security & Privacy Considerations

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

This document consolidates the security and privacy properties asserted piecemeal across the other spec documents into one auditable place. Each item cross-links its home document; the home document remains the normative source, and this is the index a reviewer reads to see the whole boundary at once.

## 1. Trust boundaries

- **Untrusted client storage.** The consent record and the anonymous-id cookie live in client-controlled storage and are tamperable. Every read from them MUST be shape-guarded before use ([spec-consent](spec-consent.md) §5–6; [spec-identity](spec-identity.md) §2). A malformed value reads as "no record" and re-prompts — it MUST NOT be interpreted as a decision, and MUST NOT silently deny or grant.
- **Public server endpoints.** The anonymous-id persist endpoint and (in the extension) the consent-receipt endpoint are public and echo input into response headers or a durable store. They MUST validate every input against a strict shape before use (§2, §4).
- **Third-party destinations.** Destinations own their transport and may be plain-JS/third-party code that violates the interface contract. The tracker MUST contain both a synchronous throw and an asynchronous rejection from `send`, and MUST NOT let either break the tracked interaction or starve other destinations ([spec-tracker](spec-tracker.md) §4).
- **Observed platform state (CMP, GPC).** In the extension, a CMP's consent signal is read via its documented API, never scraped from a cookie ([spec-ad-consent-frameworks](spec-ad-consent-frameworks.md) §3). It is data, reconciled under fixed precedence, not an instruction.

## 2. Injection resistance

- **UUID-only anonymous ids.** The persist endpoint echoes its input into a `Set-Cookie` header, so it MUST accept only an exactly-UUID-shaped value; anything else is a header-injection attempt or corruption and MUST be rejected ([spec-identity](spec-identity.md) §1, §4). Cookie names MUST match a conservative token pattern.
- **Allow-list-by-default properties.** Schema validation forwards only the parsed output, so unknown caller keys cannot ride along to third-party sinks ([spec-event-model](spec-event-model.md) §2). This is an allow-list, the safer inversion of the blocklist redaction the wider field uses.
- **No PII in URLs.** Identifiers and receipt data MUST NOT appear in URL query strings — path params and opaque ids only ([spec-consent-receipts](spec-consent-receipts.md) §3). `sourceUrl` captured in a receipt MUST have its query string stripped.

## 3. Consent-first minimisation

- **No identifier before lawful basis.** The anonymous id is minted lazily, only on an event that is actually allowed to send — never at init, never while the gate is closed, never for the exempt lane, which ships `anonymousId == ""` ([spec-tracker](spec-tracker.md) §2–3; [spec-identity](spec-identity.md) §1). Shared/CDN-cached HTML bakes the strictest default so nothing region-specific and no identifier leaks through a cache ([spec-server-lane](spec-server-lane.md) §1).
- **Context stripped in the exempt lane.** When the optional `context` envelope is populated, it MUST be gated exactly like the identifier and stripped from exempt-lane deliveries ([spec-event-model](spec-event-model.md) §4) — `page.url`/`referrer`/`campaign` can carry PII and tracking signal.
- **IP is minimised, never stored raw.** Cookieless "exempt" sinks MUST truncate/discard IP ([spec-destinations](spec-destinations.md) §2); consent receipts MUST derive a truncated/pseudonymised `ipCoarse` server-side and MUST reject a full IP supplied in the body ([spec-consent-receipts](spec-consent-receipts.md) §3–4).
- **The identifier is pseudonymous, not anonymous.** It is personal data / a unique identifier under GDPR and CCPA; controller-facing documentation MUST NOT call it "anonymous" ([spec-data-subject-rights](spec-data-subject-rights.md) §1).

## 4. Confidentiality of per-visitor responses

- **No shared caching of personalised responses.** The per-visitor initial-consent endpoint MUST answer `cache-control: private, no-store`, and no CDN cache may store it ([spec-server-lane](spec-server-lane.md) §2). The consent-receipt endpoint carries PII and MUST additionally bypass any CDN cache with `Cache-Control: no-store` ([spec-consent-receipts](spec-consent-receipts.md) §3).
- **Cookie attributes.** Identifier and receipt cookies are `SameSite=Lax`, `Secure` (always on server-issued Set-Cookie; on HTTPS for client writes), and never `HttpOnly` where the client must read them back ([spec-identity](spec-identity.md) §2).

## 5. Fail-closed defaults

- **Unknown geo fails closed.** A missing/unrecognized/low-confidence geo signal resolves to the strictest opt-in default, never to a permissive bucket — unknown is not known-elsewhere ([spec-server-lane](spec-server-lane.md) §2; [spec-regions](spec-regions.md) §4). US/Canada without a required subdivision fail closed to the strictest rule in that country.
- **Unresolved CMP fails closed.** A detected-but-not-ready CMP denies the governed categories until it resolves ([spec-ad-consent-frameworks](spec-ad-consent-frameworks.md) §3).
- **Resolution failure is fail-closed but retryable.** A failed initial-consent resolve publishes the strictest value (consent UI still renders) without locking the session against a later retry ([spec-server-lane](spec-server-lane.md) §3).
- **More-restrictive wins.** When two consent sources disagree, the reconciliation takes the more restrictive; a native GPC opt-out can only tighten a CMP grant ([spec-ad-consent-frameworks](spec-ad-consent-frameworks.md) §3).

## 6. Integrity of the audit trail (extension)

- Consent receipts are **append-only**: updates and withdrawals are new records referencing the prior `receiptId`; existing receipts are never mutated ([spec-consent-receipts](spec-consent-receipts.md) §3). An optional `integrityKey` lets the tamperable client state be verified against the stored original, which is authoritative for legal proof.

## 7. Residual risks / out of scope

- **Mislabelled exempt sinks.** A destination wrongly declared `"exempt"` that secretly sets a stable id or stores raw IP voids the exemption and makes every pre-consent hit unlawful — this is the destination author's assertion and cannot be verified by the tracker ([spec-destinations](spec-destinations.md) §2). Exemption is jurisdiction-dependent and MUST be gateable per region.
- **Destination-held data.** The system cannot delete data already forwarded to a destination; erasure is delegated to the destination's own tooling, and some destinations (e.g. Meta pixel/CAPI) expose no per-visitor deletion API ([spec-data-subject-rights](spec-data-subject-rights.md) §3).
- **Legal premises.** The security properties here are engineering guarantees; the _legal sufficiency_ of any of them (is the id personal data here? is this sink consent-exempt in this jurisdiction?) is fact-dependent and flagged UNCERTAIN in the home documents — counsel review is required before relying on them.

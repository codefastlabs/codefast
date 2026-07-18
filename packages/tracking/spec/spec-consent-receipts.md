# spec-consent-receipts — Server-Side Audit Trail

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

> **Status: mechanism implemented (2026-07-18); a backend client and legal sufficiency still the consumer's.** The package now ships the receipt model (`ConsentReceipt`/`ConsentReceiptInput` + `isConsentReceiptInput`), a pluggable `ReceiptStore` with an in-memory reference (`createInMemoryReceiptStore`) and a durable adapter over an injected backend (`createDurableReceiptStore`), the server builder (`buildConsentReceipt` + `coarsenIp`) with an optional integrity `sign` seam, and the TanStack Start endpoint helper (`recordConsentReceiptFromRequest`); the reference app wires an HMAC signer over that seam. What remains for a production deployment: a **backend client** to inject into `createDurableReceiptStore` (the in-memory one is dev-only), a configured **retention** period, an optional **notice-snapshot store**, an HMAC/signature **key** for the signer, and **counsel review** of legal sufficiency. This document remains the contract those pieces satisfy. Access dates for all citations: 2026-07-18. Items flagged **UNCERTAIN** need legal counsel review before reliance.

## 1. Why a client record is not proof

The controller carries the burden of proving consent (GDPR Art. 7(1); Recital 42 — [gdpr-info.eu/art-7-gdpr](https://gdpr-info.eu/art-7-gdpr/)). The operative standard is **EDPB Guidelines 05/2020 on consent, §5.1 (paras 104–110)**. Para 108 is decisive:

> a controller should retain, in an online context, information on the session in which consent was expressed, documentation of the consent workflow at the time, and a copy of the information presented to the data subject — and **"it would not be sufficient to merely refer to a correct configuration of the respective website."**

A tamperable client `ConsentRecord` in local storage is exactly such a "website configuration": it can be cleared, forged, or diverge across devices. It therefore **MUST NOT** be the record of proof. Analogous burden-of-proof duties: Brazil LGPD Art. 8 §2; Vietnam PDPL (Law 91/2025/QH15, in force 2026-01-01) **Art. 9 (consent) / Art. 10 (withdrawal)** — verified 2026-07-18, the enacted-law numbering, superseding the predecessor Decree 13/2023's Art. 11–12; both require a printable/verifiable format; Quebec Law 25 s.14 (**UNCERTAIN** — precise record-keeping article).

The five dimensions a receipt MUST make demonstrable: **who** consented, **when**, **to what** (purposes), **how** (the workflow/method), and **under which notice text/version** presented at that moment.

## 2. The receipt data model

"Required" is derivable from EDPB §5.1 para 108 + Art. 7 burden. "Recommended" strengthens the proof per ISO/IEC TS 27560:2023 (Consent record information structure — [iso.org/standard/80392.html](https://www.iso.org/standard/80392.html)) and market practice.

| Field                                                                           | Req?   | Basis                                                           | PII sensitivity                                                            |
| ------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `receiptId` (UUID/ULID)                                                         | MUST   | ISO 27560 record id; correlates client ↔ server                 | Low (pseudonymous key)                                                     |
| `schemaVersion`                                                                 | MUST   | ISO 27560 `conformsTo`                                          | None                                                                       |
| `subjectId`                                                                     | MUST\* | EDPB "who"; Art. 7(1)                                           | **High** — the linking id; a pseudonymous cookie id for anonymous visitors |
| `subjectIdType` (`cookie`/`userId`/`email-hash`)                                | MUST   | ISO 27560; OneTrust `identifierType`                            | Medium                                                                     |
| `timestamp` (epoch ms, UTC)                                                     | MUST   | EDPB "when"                                                     | Low                                                                        |
| `decision` (`{ ads, analytics }`)                                               | MUST   | EDPB "to what"; reuses [spec-consent](spec-consent.md) §1 shape | Low                                                                        |
| `purposes` (`{ id, version }[]`)                                                | MUST   | ISO 27560 purpose + version resolved by consent date            | Low                                                                        |
| `policyVersion`                                                                 | MUST   | EDPB "under which policy text"                                  | None                                                                       |
| `noticeVersion` + `noticeSnapshotRef`                                           | MUST   | EDPB para 108 "copy of the information presented"               | None (but the snapshot store must exist)                                   |
| `noticeLanguage` (BCP-47)                                                       | MUST   | EDPB informed-consent                                           | None                                                                       |
| `method` (`banner-accept`/`banner-reject`/`granular`/`gpc-signal`/`withdrawal`) | MUST   | ISO 27560 method of expression; EDPB "how"                      | None                                                                       |
| `eventType` (`give`/`update`/`withdraw`)                                        | MUST   | ISO 27560 consent events; PDPL Art. 10                          | None                                                                       |
| `sourceUrl`                                                                     | SHOULD | Cookiebot; session context                                      | Low (**strip query string**)                                               |
| `userAgent`                                                                     | SHOULD | market practice                                                 | **Medium** — store browser/OS family only                                  |
| `ipCoarse` (truncated/pseudonymized)                                            | SHOULD | Cookiebot bit-truncation; TrustArc pseudonymization             | **High if full** — never store full IP                                     |
| `jurisdiction` (ISO 3166)                                                       | SHOULD | ISO 27560 `hasJurisdiction`; drives retention                   | Low                                                                        |
| `integrityKey` (HMAC/signature)                                                 | SHOULD | Cookiebot tamper-verification                                   | None                                                                       |
| `retentionUntil`                                                                | SHOULD | EDPB para 107 proportionality                                   | None                                                                       |

\* `subjectId` is conceptually required (something must link the receipt to a person/session); it MAY be a pseudonymous cookie id for anonymous visitors.

Market corroboration (vendor docs, primary only for "what this vendor stores"): Cookiebot stores a Consent ID + state + timestamp + UA + submission URL + **anonymized IP** (last 16 bits IPv4 / 96 bits IPv6 removed) + an integrity key; Didomi retains the full notice configuration as presented, UA + parsed device, **5-year** retention; OneTrust's Create Consent Receipt API links purpose-version and notice-version by consent date; TrustArc pseudonymizes full IP immediately, **13-month** default. IP is consistently minimized, never stored raw.

## 3. Server endpoint contract

```
POST /api/consent/receipts        # write a receipt at consent time
  Body: receipt input (model above minus server-derived fields)
  Server derives: receiptId, authoritative timestamp, ipCoarse (from the
                  socket, truncated server-side), integrityKey
  → 201 Created { receiptId, integrityKey, retentionUntil }

GET  /api/consent/receipts/:id     # auth-gated read for the controller's DSAR handler
```

Because the response carries PII, the endpoint MUST:

- Set `Cache-Control: no-store` and carry **no** CDN caching (`s-maxage`, `CDN-Cache-Control` must be absent) — it is a function route that must bypass any CDN cache. This is the same per-visitor no-store discipline as [spec-server-lane](spec-server-lane.md) §2, and applies with more force because a receipt is PII, not just a region default.
- **Derive `ipCoarse` server-side from the connection**, never accept an IP from the request body (client-supplied IP is untrustworthy, and full IP must not transit). Reject bodies carrying a full IP.
- Be **append-only**: an update or withdrawal is a new receipt with a new `eventType` referencing the prior `receiptId`; existing receipts are never mutated in place.
- Never place `subjectId` or receipt data in a URL query string (path param, opaque ids only) — consistent with the privacy rules in the root spec.

## 4. Retention and minimization

- **R1 (MUST)** — retain the receipt while the associated processing is active. _(EDPB §5.1 para 107.)_
- **R2 (MUST)** — after processing ends, delete once no longer strictly necessary for a legal obligation or to establish/exercise/defend legal claims. _(EDPB para 107; GDPR Art. 17(3)(b),(e).)_
- **R3 (MUST)** — the retention period MUST be configurable per jurisdiction (default SHOULD track the local limitation period for claims, commonly ~3–6 years), never indefinite and never hard-coded. _(EDPB para 110: no fixed statutory period; market: TrustArc 13 mo, Didomi 5 yr.)_ — the exact number is **UNCERTAIN per jurisdiction, a legal-review call.**
- **R4 (MUST)** — the receipt MUST NOT collect more personal data than necessary to evidence the consent link. _(EDPB para 106 — a minimization ceiling on the receipt itself.)_
- **R5 (MUST)** — a full IP address MUST NOT be persisted; only a truncated/pseudonymized form.
- **R6 (SHOULD)** — `userAgent` SHOULD be reduced to browser/OS family unless the full string is justified as evidence.
- **R7 (MUST)** — withdrawal events MUST be retained in the same provable, exportable format as grants. _(PDPL Art. 10; GDPR Art. 7(3).)_

## 5. Authoritative-source rule

The client `ConsentRecord` (local storage) is authoritative **only for runtime UX gating** on the current device — a cache of the decision used to gate ad/analytics firing. The **server receipt is the sole authoritative record for legal proof.** On any divergence, the server receipt governs for compliance and audit; the client governs only "what to do right now on this device." A missing, cleared, or tampered client record triggers re-prompting (per [spec-consent](spec-consent.md) §6) and never invalidates a stored server receipt. The client SHOULD carry the `receiptId` (+ `integrityKey`) so its state can be verified against the stored original.

## Conformance vectors

**V1 — grant, both categories.** Input `{ decision:{ads:true,analytics:true}, policyVersion:"2026-05", noticeVersion:"banner-v3", lang:"en" }` → stored receipt has `eventType:"give"`, `method:"banner-accept"`, `purposes` resolved to their versions as of the timestamp, server-set `receiptId`/`timestamp`/`integrityKey`, `ipCoarse` truncated; response `Cache-Control: no-store`.

**V2 — granular.** `decision:{ads:false,analytics:true}`, `method:"granular"` → the exact per-category split is recorded, never collapsed to one boolean.

**V3 — GPC.** `method:"gpc-signal"`, `decision.ads:false`, analytics unaffected — matches the GPC-denies-ads-only rule (spec-consent §3).

**V4 — withdrawal.** A new receipt `eventType:"withdraw"` referencing the prior `receiptId`; the original grant receipt remains intact (append-only) and the withdrawal is itself printable/verifiable.

**V5 — full IP rejected.** A body carrying a full IP is rejected/ignored; the server persists only its own truncated `ipCoarse`.

**V6 — anonymous visitor.** `subjectId` = pseudonymous cookie id, `subjectIdType:"cookie"`; the receipt is still valid.

**V7 — retention expiry.** A receipt past `retentionUntil` with no active processing or claim hold is purged (R2/R3); one under an active claim hold is retained past the default.

**V8 — notice snapshot integrity.** Given `noticeVersion:"banner-v3"`, `noticeSnapshotRef` MUST resolve to the exact text presented (EDPB para 108); a dangling ref is a conformance failure.

## Uncertainties requiring legal review

Quebec Law 25's precise record-keeping article vs. its s.14 validity provision; and the concrete retention number per target jurisdiction (make it configurable, do not hard-code). (Vietnam's PDPL numbering — Art. 9 consent / Art. 10 withdrawal — was resolved in the 2026-07-18 verification pass; see §1.)

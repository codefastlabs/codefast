# spec-data-subject-rights — DSR Obligations for the Anonymous Id

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

> **Status: design target for commercial scope, partially met today.** The system already owns the two load-bearing primitives (the consent gate and `clear()` + server expiry). This document specifies the minimal-but-sufficient data-subject-rights (DSR) posture around them, and — importantly — argues from the sources _against_ over-building. Access dates 2026-07-18; the "is it personal data" question is fact-dependent and flagged **UNCERTAIN — needs legal review**.

## 1. The identifier is pseudonymous, not anonymous

Treat the "anonymous id" ([spec-identity](spec-identity.md)) as a **pseudonymous device identifier** — personal data / a unique identifier — and design as if DSR obligations attach.

- **GDPR:** Recital 30 names cookie identifiers as online identifiers; Art. 4(1) lists an online identifier among what makes a person identifiable; Art. 4(5) + Recital 26 hold that pseudonymised data (attributable to a person only with additional information) **remains personal data** (EDPB Guidelines 01/2025 on Pseudonymisation). A standalone random UUID in the system's _own_ store is genuinely borderline under the Recital 26 "reasonable means" test — **UNCERTAIN** — but once forwarded to a destination (GA4, Meta) that joins it to a graph, it is personal data at the system boundary, not borderline.
- **CCPA/CPRA:** Cal. Civ. Code § 1798.140 "unique identifier" **expressly enumerates** cookies, persistent identifiers, and probabilistic identifiers, and "personal information" reaches data linkable to a **device or household**. "No directly-identifying data attached" is therefore **not** a CCPA exemption.

Consequence for wording: **do not call the id "anonymous" in privacy-policy-facing language** — call it a pseudonymous device identifier. (The internal `anonymousId` field name is a precedent-locked API contract; this is about controller-facing documentation, not the symbol.)

## 2. Rights → responsibility matrix

Actors: **System** = this library (near-stateless; forwards to destinations, owns only the id cookie + consent record). **Controller** = the consuming operator (owns the privacy policy, fields DSARs, holds destination admin access). **Destination** = GA4, Meta, etc.

| Right (GDPR / CCPA)                     | Primary responsible party              | What the SYSTEM MUST provide                                                                                                                 |
| --------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Access / Know (Art. 15 / §1798.110)     | Controller, executing at Destination   | **Expose the id** (and destination-side ids, e.g. GA4 `client_id` from `_ga`) to the controller's DSAR handler.                              |
| Erasure / Delete (Art. 17 / §1798.105)  | Split: System + Controller             | (a) `clear()` — expire the id cookie + drop cache; (b) a **per-destination erasure hook**; (c) expose the id for destination-keyed deletion. |
| Opt-out of Sale/Share (§1798.120 / GPC) | System enforces; Controller configures | The **consent gate** — closing it stops forwarding, which _is_ the technical enforcement of opt-out.                                         |
| Withdraw consent (Art. 7(3))            | System                                 | Already core: withdrawal → `clear()` + server expiry + destination cookie clear (spec-consent §9, spec-identity §5).                         |
| Rectification (Art. 16)                 | Not applicable                         | Nothing — a random UUID has no factual content to correct; document as N/A.                                                                  |
| Portability (Art. 20)                   | Controller, at Destination             | Nothing beyond id exposure — the portable data lives in the destination.                                                                     |

**Synthesis:** the system owns exactly two DSR-relevant primitives — the **gate** (opt-out/withdraw enforcement) and **`clear()` + a per-destination erasure hook** (erasure) — plus **id exposure** so the controller can drive access/deletion at the destination. Everything else is the controller's or the destination's job.

## 3. Destination delegation

Platforms ship their own DSR tooling; the system MUST delegate rather than reimplement.

- **GA4 — a real per-visitor deletion API exists.** The User Deletion API accepts `CLIENT_ID` / `USER_ID` / `APP_INSTANCE_ID`; GA4's `client_id` (in the `_ga` cookie) is the per-device analog of an analytics id ([developers.google.com/analytics/devguides/config/userdeletion/v3](https://developers.google.com/analytics/devguides/config/userdeletion/v3)). Limits the spec MUST state honestly: removed from the Individual User report within ~72 hours, purged at the next ~bimonthly run, and it does **not** reach previously-aggregated reports or BigQuery exports.
- **Meta — no per-browser-UUID deletion API.** Meta's Data Deletion Request Callback is Facebook-Login-specific (an app-scoped `user_id` in a `signed_request`); it does **not** delete pixel/Conversions-API browser data. The system's realistic lever is **stop-send (gate) + clear Meta cookies** (spec-destinations §5). **The spec MUST NOT imply a Meta per-visitor deletion hook exists.**

**Posture:** the destination interface gains a generic `onErasure(id)` capability; a **GA4 reference binding** calls the User Deletion API with the destination `client_id`; the **Meta reference behavior** is cookie-clear + stop-send, documented as "no per-visitor deletion API upstream." Do **not** build a bespoke deletion store.

## 4. Retention and rotation

There is **no hard legal number** — it is proportionality (GDPR Art. 5(1)(e) storage limitation, 5(1)(c) minimisation).

- **T1 (SHOULD)** — the 1-year cookie `Max-Age` ([spec-identity](spec-identity.md) §2) is a defensible default, not a legal ceiling; document it as a controller-configurable proportionality choice. Destinations impose their own retention (GA4 property retention 2–14 months) the controller MUST align.
- **T2 (SHOULD, optional)** — id rotation aids minimisation but is **not** legally mandated, and it is **in tension** with the server ITP re-issue (spec-identity §4), which deliberately prolongs one id to beat Safari's cap. Offer rotation as an _optional_ posture the controller may enable, never a default that would fight the ITP-survival design.
- **T3 (MUST)** — withdrawal MUST expire the id (`Max-Age` 0) — already specified; this discharges the identifier-erasure obligation at the system layer.
- **T4 (MUST)** — the system sets **no** retention for destination-held data; that is the destination's/controller's configuration.

## 5. Minimal-but-sufficient posture

The system stores almost nothing (id cookie + consent record) and forwards to destinations that each ship their own DSR tooling or their own limits. The correct posture — consistent with the project's no-speculative-features rule — is: **delegate to destinations + provide a withdrawal/clear primitive + expose the id lifecycle for the controller's privacy policy and DSAR handler.** Do **not** build a DSR request portal, a subject-data store, or a rectification/portability path the system has no data to serve.

The spec asserts only:

- **(a)** the id is a pseudonymous device identifier (personal data / unique identifier) — stated plainly for the controller's privacy notice;
- **(b)** the system's DSR surface is exactly the gate, `clear()` + server expiry, a per-destination erasure hook, and id exposure;
- **(c)** access, portability, and destination-data deletion are delegated to destinations (GA4 reference binding calls the User Deletion API; Meta = stop-send + cookie-clear);
- **(d)** rectification and portability are not applicable at the system layer — say so, do not build them;
- **(e)** retention is a controller proportionality choice (1-year default configurable; rotation optional and noted in tension with the ITP re-issue).

## Conformance vectors

**DSR-V1 — withdrawal clears id.** An `analytics = false` decision → cookie `Max-Age` 0 + cache dropped + one server-expiry request; no further events send. (Extends spec-identity §5.)

**DSR-V2 — withdrawal triggers destination erasure hook.** On withdrawal, each registered destination's `onErasure(id)` is invoked exactly once with the resolved destination identifier, and swallows failures (tracking never breaks the app).

**DSR-V3 — GA4 delete binding.** Given a `client_id`, the GA4 destination emits a User Deletion API request with `id.type = CLIENT_ID`, `id.userId = <client_id>` — snapshot the request shape (no network).

**DSR-V4 — Meta erasure is cookie-clear + stop-send only.** The Meta destination `onErasure` clears Meta cookies and halts sending, and does **not** fabricate a non-existent per-visitor deletion API call.

**DSR-V5 — id exposure without minting.** A read-only accessor returns the current id (for the controller's DSAR handler) without minting one when the gate is closed (composes with the lazy-mint rule, spec-identity §3).

**DSR-V6 — GPC → opt-out-of-share.** A GPC signal present → `ads = false`, ad destinations receive no events; the analytics gate is independent.

## Uncertainties requiring legal review

The standalone-UUID-in-the-system's-own-store personal-data status is **UNCERTAIN**; the Meta "no per-visitor deletion API for pixel/CAPI" point should be re-verified against Meta docs at finalization (platform DSR tooling changes); GA4 deletion timelines are Google-operational and may shift.

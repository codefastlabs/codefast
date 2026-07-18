# spec-ad-consent-frameworks — TCF / GPP Interop

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

> **Status: interop reconciler implemented; the CMP read and purpose mapping are the integrator's.** The reference implementation models advertising consent as one boolean `ads` ([spec-consent](spec-consent.md) §1) mapping to Google Consent Mode v2's four signals. That is sufficient for measurement and for non-programmatic ads, but **not** for serving programmatic ads in the EEA/UK/CH, which require an IAB-certified CMP and a TC String. This document specifies how the system interoperates with those frameworks. `@codefast/tracking` ships `reconcileAdFrameworkConsent` plus `hasTcfApi`/`hasGppApi` (§3, vectors V1–V6); deriving the `CmpConsentSignal` from a live CMP's `TCData`/GPP — the purpose set and the Google GVL vendor id — remains ad-ops policy the integrator supplies (§5). Access dates 2026-07-18; **UNCERTAIN** items need legal/ad-ops review.

## 1. Decision: interop, not become a CMP

**The system reads an external CMP as source of truth; it does not become one.**

Becoming a certified CMP means IAB Europe registration (annual CMP fee ~€1,575, per-environment validation for a CMP ID) plus Google's separate certification, plus a standing enforcement relationship (live-installation monitoring, 10-business-day breach remediation, delisting risk) and ownership of the consent UI, Global Vendor List ingestion, TC String **encoding**, and audit liability ([IAB Europe TCF for CMPs](https://iabeurope.eu/tcf-for-cmps/); [TCF Compliance Programmes](https://iabeurope.eu/tcf-compliance-programmes/)). That is a compliance-operations product outside this package's scope, and the project's standing no-speculative-features rule applies: there is no call site that needs the system to _mint_ TC Strings.

Publishers running programmatic ads already have a certified CMP on the page (they must — see §2). The value the system adds is **reading** that CMP and reconciling it with the native `{ ads, analytics }` model, over the standardized `__tcfapi`/`__gpp` read APIs every certified CMP exposes — bounded, dependency-free, and consistent with the package's server-first philosophy.

## 2. When each layer is required

| Scenario                                                | Region          | Required consent layer                                                                                         |
| ------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| Measurement only (first-party analytics, no ad serving) | anywhere        | **native `{ ads, analytics }` + Consent Mode v2**. No TCF, no GPP.                                             |
| Monetized programmatic ads (AdSense / Ad Manager / RTB) | **EEA + UK**    | certified CMP + **TCF TC String** + Consent Mode v2 + Google AC. System **reads** via `__tcfapi`.              |
| Same                                                    | **Switzerland** | same as EEA/UK                                                                                                 |
| Monetized ads, US opt-out states                        | US              | **GPP `usnat`/`us…` sections** honored via `__gpp`; native GPC already covers the opt-out. TCF not applicable. |
| Monetized ads, rest of world                            | other           | native + Consent Mode v2; no framework string                                                                  |

**Rule:** TCF is required **iff** the page serves or measures _programmatic_ ads to users in the EEA/UK/CH; GPP US sections apply **iff** serving ads to a US opt-out state; everywhere else, and for all measurement-only use, native `{ ads, analytics }` + Consent Mode v2 suffices. The interop layer is inert unless a `__tcfapi`/`__gpp` provider is actually present.

Dates: a Google-certified CMP integrated with IAB TCF has been required to serve/measure ads to EEA+UK users since **2024-01-16**, Switzerland since **2024-07-31** ([Google Ad Manager Help 13554116](https://support.google.com/admanager/answer/13554116)). Without a certified CMP, traffic may receive only non-personalized/limited ads.

**Version note (verified 2026-07-18 against IAB Europe primary):** TCF v2.2 (since 2023) is superseded by **TCF v2.3, released 2025-06-19 and mandatory 2026-02-28** — TC strings created on/after 2026-03-01 without the Disclosed Vendors segment are invalid. v2.3's only wire change is making the previously-optional **Disclosed Vendors** segment mandatory (a separate segment appended after the Core string); the Core-string bit-format and the CMP API (`__tcfapi`, version 2) are unchanged, so a reader that parses standard consent/LI bits keeps working — the burden falls on CMPs (must emit the segment) and on vendors that check disclosure. (The "reader unaffected" conclusion is reasoned from the documented change, not a verbatim IAB statement.)

## 3. The CMP interop resolver

A **CMP-source-of-truth resolver** sits _above_ `effectiveConsent` ([spec-consent](spec-consent.md) §7). When a compliant CMP governs a category in the relevant scope, its signal **overrides** the stored/default decision for that category; where no CMP exists, native consent stands.

**Detection.** TCF: `typeof window.__tcfapi === "function"`, confirmed live via `__tcfapi("ping", 2, cb)` → `cmpStatus === "loaded"`. GPP: `typeof window.__gpp === "function"` → `__gpp("ping", cb)` → `signalStatus === "ready"`. Both may be iframe-proxied (`__tcfapiLocator`/`__gppLocator`, postMessage transport). The resolver MUST use the API and MUST NOT scrape the raw string from a cookie. ([IAB TCF CMP API v2](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md); [IAB GPP CMP API](https://github.com/InteractiveAdvertisingBureau/Global-Privacy-Platform/blob/main/Core/CMP%20API%20Specification.md).)

**Read — TCF.** Register `__tcfapi("addEventListener", 2, cb)` (the current API; `getTCData` is deprecated); act on `eventStatus ∈ {tcloaded, useractioncomplete}`. From the `TCData`:

- `gdprApplies === false` → TCF is out of scope for this user; **defer to native consent** (do not force-deny).
- Else derive `ads` from consent for the ads-relevant TCF purposes **and** the Google vendor, and `analytics` from the measurement purposes. The exact purpose set and Google's GVL vendor id are **policy owned by ad-ops, not to be hard-coded from memory** — see §5.
- Capture `tcString` and `addtlConsent` (Google Additional Consent — [Ad Manager Help 9681920](https://support.google.com/admanager/answer/9681920)) and forward them **verbatim** to Google tags. The system reads them; it never mints them.

**Read — GPP / US.** `__gpp("getSection", cb, "usnat")` plus any applicable `us…` state section. Map any Sale / Share / targeted-advertising opt-out → `ads = false`. Per the existing GPC rule (spec-consent §3), a US opt-out MUST NOT withdraw first-party `analytics`. Treat "any `us…` sale/share/targeted-ad opt-out" **generically** — the section list grows continuously (currently `usnat`, `usca`, `usva`, `usco`, `usut`, `usct`, and more), so ad-ops owns the list rather than the spec enumerating states.

**Reconciliation — precedence.**

1. In a scope where a live CMP governs a category → the **CMP value wins** for that category; the stored decision is ignored for it.
2. `gdprApplies === false` / no applicable GPP section / no CMP → **native `effectiveConsent` stands.**
3. **Fail closed:** a CMP is detected but not yet `loaded`/`ready` → treat the governed categories as **denied** until it resolves (consistent with [spec-server-lane](spec-server-lane.md) §2's strictest default and opt-in mode).
4. Always take the **more restrictive** of `{ CMP-derived, native GPC }` — a native GPC opt-out can only tighten, never loosen, a CMP grant.
5. Re-read on **every** CMP `addEventListener` fire (the user can change consent mid-session), mirroring the existing "re-read GPC at each evaluation" rule.

Withdrawal side effects ([spec-consent](spec-consent.md) §9) fire whenever the **reconciled** `analytics` flips false, regardless of source.

## 4. Native consent without a CMP

For sites without a CMP (measurement-only, or ads outside EEA/UK/CH), native `{ ads, analytics }` maps directly to Consent Mode v2 (the four signals in [spec-destinations](spec-destinations.md) §4): `analytics → analytics_storage`; `ads → ad_storage + ad_user_data + ad_personalization`. The server-lane strictest default (all denied) is the correct Consent Mode default for EEA visitors; the client `update` fires after the decision resolves. Without a CMP the system does **not** synthesize an Additional Consent string.

## 5. Uncertainties requiring legal / ad-ops review

1. The exact TCF purpose set for `ads` (typically Purposes 1/3/4) and `analytics` (typically 7–10). "Google Advertising Products" is **GVL vendor id 755** (verified 2026-07-18 — corroborated by Google's own TCF validation error 1.4, which flags requests lacking vendor 755; not read directly from the live vendor-list.json, which is too large to machine-search). Still confirm the purpose set and re-check the id against the current Global Vendor List before relying — ids and purpose semantics are policy owned by ad-ops, not memory.
2. Collapsing a granular multi-vendor TC String into one boolean is lossy by design — legal should confirm the system may reduce it to `{ ads, analytics }` for _its own_ gating while forwarding the full `tcString`/`addtlConsent` untouched to Google tags.
3. TCF v2.3's 2026-02-28 mandatory date and reader-impact are **verified** against IAB Europe primary (2026-07-18); the "reader unaffected" point is reasoned inference, not a verbatim IAB statement — re-confirm if a v2.4 lands.
4. `gdprApplies === undefined` — legal/ad-ops decide whether to fail closed (recommended) or fall through to native.
5. Google Basic vs Advanced Consent Mode is a product decision with revenue/privacy trade-offs — out of scope for this library to mandate; default to Basic, document both.

## Conformance vectors

**V1 — no CMP present.** No `__tcfapi`/`__gpp` on the page → resolver is inert, native `effectiveConsent` governs unchanged.

**V2 — TCF grants ads.** `gdprApplies === true`, ads purposes + Google vendor consented → reconciled `ads = true`; `tcString` + `addtlConsent` captured for forwarding.

**V3 — CMP not ready.** `__tcfapi` present, `cmpStatus !== "loaded"` → governed categories denied until it resolves (fail closed).

**V4 — GPP US opt-out.** `usca` section signals a sale/share opt-out → reconciled `ads = false`, `analytics` unaffected.

**V5 — GPC tightens a CMP grant.** CMP grants `ads` but native GPC signal present → reconciled `ads = false` (more restrictive wins).

**V6 — out of scope.** `gdprApplies === false` → defer to native consent, do not force-deny.

**V7 — mid-session change.** A second `addEventListener` fire with a changed decision → the reconciled decision updates and withdrawal side effects fire if `analytics` flipped false.

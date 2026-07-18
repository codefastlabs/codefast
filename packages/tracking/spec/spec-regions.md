# spec-regions — Jurisdictional Consent Rules

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as described in RFC 2119.

> **Status: design target for commercial scope, not yet implemented.** The reference implementation today resolves only four regions (`eu`/`vn`/`us`/`other`, see [spec-consent](spec-consent.md) §2). This document specifies the data-driven model that replaces that enum for worldwide commercial use. Every jurisdictional claim carries a primary-source citation and an access date; claims flagged **UNCERTAIN** rest on regulator guidance, newly-in-force law, or secondary aggregation and **MUST be re-verified with legal counsel before being relied on**. This is an engineering specification, not legal advice.

## 1. Why the enum is insufficient

The four-value model fails commercially in ways that create direct legal exposure. In ranked order of risk:

1. **`us` as one bucket is the top risk.** US privacy law is state-level, not federal: 20+ states have in-force comprehensive laws with _divergent_ rules. As of 2026-01-01, roughly **a dozen states legally mandate honoring a universal opt-out signal (GPC)** — CA, CO, CT, DE, MD, MN, NE, NH, NJ, OR, TX — while others (VA, UT) do not (this count is a moving target: **Montana was dropped** after 2025 SB 297 repealed its mandate, verified against primary text; **Maryland**'s "may utilize" wording may be permissive rather than a mandate — see §3). Sensitive-data handling splits opt-out-to-limit (CA) vs opt-in (VA/CO/CT/TX/OR/MT). A single `us` rule cannot encode this, and missing GPC in a mandate state is an active enforcement target (California AG, Sephora settlement $1.2M, 2022-08-24; CPPA Todd Snyder order $345,178, effective 2025-05-01).
2. **No universal-opt-out-signal handling exists at all.** GPC binds in roughly a dozen US states; California from 2026-01-01 additionally requires a _visible confirmation_ that the signal was processed (11 CCR §7025).
3. **Washington's health-data law (MHMDA) is entirely unmodeled** — opt-in for "consumer health data," a 2,000-ft geofence ban, and a **private right of action** (the highest per-incident litigation exposure of any US regime).
4. **`other` fails open, backwards.** Brazil, China, South Korea, India, and Quebec are largely opt-in; the unknown/default case MUST fail _closed_ to opt-in, not permit tracking.
5. **`eu` as one rule ignores national divergence** — minors' consent age (13–16), France's 13-month cookie cap, Germany's TDDDG regime.
6. **`vn` is stale** — Vietnam moved from Decree 13/2023 to the PDPL (Luật 91/2025/QH15, in force 2026-01-01), which adds a cross-border-transfer impact assessment.
7. **No sensitive-data, minors, or cookie-lifetime dimensions** exist in a flat enum.

## 2. The region-rule record

A region is resolved to a **rule record**, not an enum member. Implementations MUST model at least these fields:

| Field                      | Type                                                                       | Drives                                                  |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| `id`                       | string (`"us-ca"`, `"eu-fr"`, `"eu"` baseline)                             | identity / override precedence                          |
| `matches.countries`        | ISO 3166-1 alpha-2[]                                                       | geo match                                               |
| `matches.subdivisions`     | ISO 3166-2[] (optional)                                                    | state/province match (required for US)                  |
| `consentMode`              | `opt-in` \| `opt-out` \| `mixed`                                           | banner default (block-until-consent vs load-then-honor) |
| `analyticsBasis`           | `consent` \| `opt-out` \| `legitimate-interest`                            | whether first-party analytics needs consent             |
| `advertisingBasis`         | `consent` \| `opt-out`                                                     | whether ad/tracking flows need consent                  |
| `requiredOptOutSignals`    | `"GPC"[]`                                                                  | which signals are read                                  |
| `optOutSignalBinding`      | `mandatory` \| `best-practice` \| `none`                                   | whether a present signal legally binds                  |
| `requiresStateGranularity` | boolean                                                                    | whether ISO 3166-2 resolution is required               |
| `sensitiveDataRules`       | `{ model, categories[], healthDataSpecialRegime?, geofenceRadiusMeters? }` | category gating                                         |
| `minorsRule`               | `{ ageThreshold, mechanism }`                                              | age gating                                              |
| `cookieLifetimeCapMonths`  | number (optional)                                                          | identifier max-age ceiling                              |
| `dataLocalization`         | `none` \| `transfer-assessment` \| `localization-required`                 | cross-border delivery constraints                       |
| `withdrawalMustBeEasy`     | boolean                                                                    | withdrawal UX obligation                                |
| `privateRightOfAction`     | boolean                                                                    | litigation-risk flag                                    |
| `uncertain`                | boolean                                                                    | needs counsel review before relying                     |
| `notes`                    | string                                                                     | free text                                               |

`consentMode: "mixed"` means an opt-out baseline with opt-in for enumerated categories (e.g. Switzerland: analytics opt-out, advertising/profiling opt-in).

## 3. Jurisdiction table

All access dates 2026-07-18. Citations are the governing instrument + a locating URL.

### Europe

| Jurisdiction            | Consent basis (non-essential analytics/ads)                                                                              | GPC binding | Special                                                                                                                    | Geo granularity                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **EU/EEA baseline**     | **opt-in** (ePrivacy Dir 2002/58/EC art 5(3); analytics in scope)                                                        | none        | minors GDPR art 8 (16, states may lower to 13); sensitive art 9 explicit consent; withdrawal art 7(3)                      | country + per-country override |
| **France (CNIL)**       | opt-in (French DPA art 82); narrow first-party audience-measurement exemption                                            | none        | **cookie lifetime ≤ 13 months**, data ≤ 25 months, no auto-renewal (CNIL Sheet n°16, updated 2025-07-04)                   | country                        |
| **Germany (TDDDG)**     | opt-in (§25 TDDDG, the 2024 rename of TTDSG)                                                                             | none        | minors 16; §26 "recognized consent-management services" (PIMS) emerging, not operational — **UNCERTAIN**                   | country                        |
| **UK (UK GDPR+PECR)**   | opt-in (PECR reg 6; ICO: analytics "almost always need consent")                                                         | none        | **Data (Use and Access) Act 2025 in force 2026-02-05** adds low-risk analytics exceptions — **UNCERTAIN scope**; minors 13 | country                        |
| **Switzerland (nFADP)** | **mixed** — analytics opt-out with clear info; advertising/profiling opt-in (FDPIC guidance ~2025-02-03) — **UNCERTAIN** | none        | fines to CHF 250k on the responsible individual                                                                            | country                        |

EDPB _Guidelines 2/2023 on the Technical Scope of Art. 5(3)_ (adopted Oct 2024) confirms fingerprinting, server-side tagging, pixels, and hashed-email matching are all in scope of the consent requirement. Member-state minors' ages diverge (13: BE/DK/EE/FI/LV/PT/SE; 14: AT/IT/ES/LT/BG; 15: CZ/FR/GR; 16: DE/IE/NL/HR/HU/LU) — **UNCERTAIN, per-country transposition needs confirmation.**

### United States — requires ISO 3166-2 state granularity

Country code `US` alone is **categorically insufficient**: the obligation to honor GPC itself varies by state, effective dates differ, and several statutes (CTDPA expressly; CO/TX operationally) require the controller to first determine the consumer is a resident of that specific state.

A load-bearing nuance for [spec-destinations](spec-destinations.md): **plain first-party analytics** (a site measuring its own traffic, no disclosure/sale to third parties, no cross-context behavioral advertising) generally falls **outside** "sale"/"targeted advertising" in the opt-out states and needs **no consent and no opt-out** — provided the data is not shared with third parties for their own use and is not sensitive. Opt-out/GPC bites on sale/share/targeted-advertising/profiling (the third-party ad-tech flows), which validates a cookieless first-party analytics lane legally in the US.

| State                    | Basis                                              | GPC mandatory                                                | Sensitive data                                                               | Notes                                                                                               |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **California** CCPA/CPRA | opt-out (sale/share + targeted ads)                | **YES** (11 CCR §7025; visible-confirmation from 2026-01-01) | opt-out-to-limit (§1798.121)                                                 | precise geo = 1,850 ft; minors under-16 opt-in                                                      |
| **Virginia** VCDPA       | opt-out                                            | **NO** (silent — structural gap)                             | **opt-in** (§59.1-578)                                                       | precise geo = 1,750 ft; minors COPPA known-child only                                               |
| **Colorado** CPA         | opt-out                                            | **YES** (since 2024-07-01; 4 CCR 904-3 R5.08)                | **opt-in**                                                                   | precise geo = 1,850 ft (2025 amend — **UNCERTAIN**); SB24-041 under-18 from 2025-10-01              |
| **Connecticut** CTDPA    | opt-out                                            | **YES** (since 2025-01-01)                                   | **opt-in**                                                                   | precise geo = 1,750 ft; residency-conditioned; PA 23-56 under-18                                    |
| **Texas** TDPSA          | opt-out                                            | **YES** (since 2025-01-01; §541.055(e))                      | **opt-in** (§541.101)                                                        | precise geo = 1,750 ft; very broad applicability; $7,500/violation                                  |
| **Utah** UCPA            | opt-out                                            | **NO**                                                       | notice-only (weaker)                                                         |                                                                                                     |
| **Oregon** OCPA          | opt-out                                            | **YES** (since 2026-01-01)                                   | **opt-in**                                                                   |                                                                                                     |
| **Montana** MCDPA        | opt-out                                            | **NO** (2025 SB 297 repealed it — see note)                  | **opt-in**                                                                   | verified against MCA 2025; only a controller-established opt-out means + manual link remain         |
| **Washington** MHMDA     | **opt-in** for _consumer health data_ (RCW 19.373) | n/a (consent regime)                                         | health/biometric/genetic/precise-location — reaches health-related analytics | **2,000-ft geofence ban** (RCW 19.373.080); **private right of action** via WA CPA (treble damages) |

20 states have enacted comprehensive laws; roughly **11** mandate GPC as of 2026-01-01 (list in §1) — Montana was removed after the verification below. GPC's binding force rests on regulator enforcement and §7025's text, not appellate precedent — **flag for counsel on litigation-risk framing.** Nevada (SB220 opt-out of sale + SB370 health, with a 1,750-ft geofence ban that binds even with consent) is a narrower regime — **UNCERTAIN.**

> **Montana UOOM — RESOLVED (verified 2026-07-18 against primary text).** The original 2023 MCDPA required honoring an opt-out preference signal from 2025-01-01, which is why practitioner trackers still list Montana as a GPC-mandate state. **2025 SB 297 (Ch. 567, in force 2025-10-01) repealed that duty** — its enrolled title expressly repeals Section 15 of Chapter 681, Laws of 2023 (the standalone provision that created the signal mandate), and the current _Montana Code Annotated 2025_ contains no universal-opt-out-mechanism language: §30-14-2808(2) prescribes only "a secure and reliable means established by the controller," and §30-14-2812(4) a manual "your opt-out rights" link. **Montana does not mandate honoring GPC under the current MCDPA** (mca.legmt.gov and the enrolled SB 297 were reachable and read directly; residual: the identification of 2023 §15 as the repealed UOOM provision is cross-referenced from secondary descriptions, ~90% confidence). This is why the count is data-driven and re-verified: a state can leave the list between annual trackers.

Washington MHMDA is the strongest reason `sensitiveDataRules` must be a first-class field: even inside a US "opt-out" state, health-related data flips the rule to opt-in, adds a geofence ban, removes any UOOM path, and carries private-litigation exposure. Its `geofenceRadiusMeters ≈ 610` (2,000 ft) and its dual applicability (WA residents _or_ data collected in WA) mean US-WA geo is a floor, not a sufficient test — **UNCERTAIN.**

### Rest of world — country-level (ISO 3166-1)

| Jurisdiction                  | Basis                                                                                                        | Special                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Brazil** LGPD               | opt-in for non-essential cookies; ANPD permits legitimate interest for audience measurement — **UNCERTAIN**  | children best-interest standard                                                                                                        |
| **Canada / Quebec Law 25**    | PIPEDA consent (softer); Quebec §8.1 profiling tech off-by-default → CAI reads as **opt-in** — **UNCERTAIN** | Quebec override on a CA baseline; minors under-14                                                                                      |
| **Vietnam** PDPL 91/2025/QH15 | **strong opt-in** (in force 2026-01-01)                                                                      | cross-border transfer impact assessment + 60-day MPS filing (`dataLocalization: transfer-assessment`) — **UNCERTAIN, little guidance** |
| **China** PIPL                | **opt-in**, separate consent for sensitive/sharing/cross-border                                              | data localization + security assessment (`localization-required`); under-14 sensitive                                                  |
| **Japan** APPI                | more permissive: notice/purpose-based, opt-out route for third-party provision                               | pending amendment (~2028) may pull cookie IDs into scope — **UNCERTAIN**                                                               |
| **South Korea** PIPA          | **strong opt-in** — behavioral cookies = personal information                                                | under-14 parental; among the strictest globally                                                                                        |
| **India** DPDP 2023           | **opt-in** (phased; full cookie rules ~2027-05-13 — **UNCERTAIN**)                                           | **under-18 verifiable parental consent** (de-facto age-gating)                                                                         |
| **Australia** Privacy Act     | no cookie-consent statute, opt-out-ish; 2024 amendment adds a privacy tort                                   | multi-tranche reform in flight — **UNCERTAIN**                                                                                         |

## 4. Geo-resolution rule

1. **Inputs.** Resolve the visitor to `{ country: ISO-3166-1-alpha2, subdivision?: ISO-3166-2 }` from the edge geo signal. Country is always required; subdivision is required when the matched country has `requiresStateGranularity: true`.
2. **Lookup — most-specific wins.** (a) exact `country + subdivision` (`US-CA`, `US-WA`, `CA-QC`); (b) else `country` (`FR`, `VN`, `GB`); (c) else regional baseline (the EU/EEA baseline rule for any EEA country lacking a specific override).
3. **State-granularity countries** (`requiresStateGranularity: true`): **US** (mandatory) and **Canada** (Quebec override). If the subdivision is missing or unrecognized for such a country, **fail closed to the strictest rule in that country** — US → opt-in + honor all UOOM signals + sensitive opt-in; Canada → apply Quebec §8.1 opt-in.
4. **Global fail-closed default.** If the country is missing, unrecognized, a VPN/unknown, or geo confidence is low → apply the **strictest baseline: EU-style opt-in**. Block all non-essential analytics and advertising until affirmative consent, and honor any GPC present. This is the guarantee the current `other` bucket fails to make: unknown is not known-elsewhere (the same principle as [spec-server-lane](spec-server-lane.md) §2's missing-geo rule).
5. **GPC is orthogonal to geo.** Read the opt-out signal on every evaluation. In any rule with `optOutSignalBinding: mandatory`, a present GPC is a legally binding opt-out of sale/share/targeted advertising and MUST be applied before render, independent of banner state — consistent with [spec-consent](spec-consent.md) §3 (GPC denies `ads` only, never first-party `analytics`).

## 5. Relationship to the existing model

- The current `resolveConsentMode`/`resolveDefaultConsent` (spec-consent §2–3) become the `consentMode` + `*Basis` fields of a rule record; the region enum becomes the `id`/`matches` of a lookup table.
- `STRICTEST_INITIAL_CONSENT` (spec-consent §8) remains the fail-closed value of §4.4 and the baked default for shared HTML.
- The GPC rule (spec-consent §3) generalizes to `requiredOptOutSignals` + `optOutSignalBinding`.
- Sensitive-data, minors, cookie-lifetime, and localization are **new dimensions** with no current equivalent — they gate specific event categories and identifier lifetimes, and are the reason a flat enum cannot scale.

## Conformance vectors

**V1 — US state granularity.** Geo `US` with no subdivision → fail closed to the strictest US rule (opt-in, GPC honored, sensitive opt-in). Geo `US-VA` → opt-out, GPC **not** binding. Geo `US-CA` with GPC present → `ads` denied, `analytics` unaffected.

**V2 — GPC mandate divergence.** Same GPC-present visitor: `US-CO` → binding opt-out of sale/targeted-ads; `US-UT` → not mandated (best-practice only).

**V3 — health carve-out.** Geo `US-WA`, event category tagged health-related → opt-in required regardless of the opt-out baseline; a geofence-derived location event within 610 m of an in-person health facility is prohibited.

**V4 — fail-closed unknown.** Geo missing / unrecognized / low-confidence → EU-style opt-in, all non-essential blocked until consent, GPC honored.

**V5 — EU national override.** Geo `FR` → EU baseline opt-in plus `cookieLifetimeCapMonths: 13`; geo `DE` → minors threshold 16; a generic EEA country with no override → EU baseline.

**V6 — rest-of-world opt-in.** Geo `KR`, `CN`, `VN`, `IN` → opt-in (not the old `other` fail-open); `VN` and `CN` additionally carry a `dataLocalization` constraint.

## Uncertainties requiring legal review

Every row flagged **UNCERTAIN** above, plus: EU member-state minors' ages; UK DUAA 2025 analytics-exception scope; Swiss analytics opt-out latitude where GDPR also applies; Brazil legitimate-interest-for-analytics; Quebec §8.1 interpretation; Vietnam PDPL implementing detail; India DPDP staging; Japan/Australia pending reforms; and the exact per-state effective dates and the 12-state GPC list (verify against each state's own AG/legislature page before this becomes normative). Several US precise-geolocation radii (CA/CO 1,850 ft vs VA/CT/TX 1,750 ft) and the Colorado 2025 amendment's bill number need direct statutory confirmation.

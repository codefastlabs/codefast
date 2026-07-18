# SPEC-CONSENT — Categories, Regions, Records, Effective Consent

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. Categories and decisions

Consent is **per category**, mirroring Google Consent Mode v2's split:

- `analytics` — gates measurement (maps to `analytics_storage`).
- `ads` — gates advertising storage and data sharing (maps to `ad_storage`, `ad_user_data`, `ad_personalization`).

A **consent decision** is a map with exactly these keys, each an explicit boolean:

```json
{ "ads": false, "analytics": true }
```

- `createConsentDecision(granted)` — a decision granting exactly the given categories and denying every other one.
- **Shape guard**: a value read from untrusted storage is a valid decision only if it is a plain object (not an array, not null) and every category is an explicit boolean. A single granted/denied flag, a string, or a missing category MUST be rejected — GDPR consent must be granular per purpose.
- **Normalization**: re-derive a clean decision from a tamperable record — extra keys dropped, every category an explicit boolean. Client and server MUST share this one normalization rule.

## 2. Regions and modes

Region values: `eu`, `vn`, `us`, `other`.

**Region resolution from an ISO 3166-1 alpha-2 country code** (case-insensitive):

| Input                                                                                    | Region  |
| ---------------------------------------------------------------------------------------- | ------- |
| AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE (EU-27) | `eu`    |
| GB IS LI NO (UK GDPR + EEA/EFTA, GDPR-equivalent)                                        | `eu`    |
| VN                                                                                       | `vn`    |
| US                                                                                       | `us`    |
| any other non-empty code                                                                 | `other` |

A **missing** country code is handled one level up (SPEC-SERVER-LANE §2): unknown is not known-elsewhere, so it MUST fail closed to the strictest default — never fall through to `other`'s opt-out.

**Mode resolution**: GDPR (EU) and Vietnam's PDPL (Luật 91/2025/QH15) require explicit opt-in; CCPA/CPRA (US) defaults to opt-out. There is no single global default satisfying both, so:

| Region        | Mode      |
| ------------- | --------- |
| `eu`, `vn`    | `opt-in`  |
| `us`, `other` | `opt-out` |

## 3. Default consent (before the visitor decides)

`resolveDefaultConsent(mode, requestedCategories, hasGpcSignal)`:

1. `opt-in` mode → all categories denied.
2. `opt-out` mode → grant exactly `requestedCategories` (the purposes the app's prompt asks about), deny the rest.
3. If a GPC signal is present, force `ads` to denied. GPC is a "do not sell or share" opt-out (CCPA/CPRA): it MUST NOT withdraw first-party `analytics` measurement, and it only bites under opt-out (opt-in is already all-denied).

## 4. Consent configuration

One configuration object, defined once and passed to every surface (UI, tracker gate, tag bootstrap), so cross-surface constants hold by construction:

- `storageKey` — the persistence key holding the visitor's consent record.
- `policyVersion` — an opaque string; bumping it re-prompts every visitor (a stored decision under any other version is ignored).
- `requestedCategories` — the categories the app's prompt asks about; grant-all and opt-out defaults grant exactly these.

## 5. The consent record and storage

The persisted record:

```json
{ "decision": { "ads": false, "analytics": true }, "policyVersion": "2026-07", "timestamp": 1752796800000 }
```

- Persisted as **plain JSON with exactly this shape** — a stable contract, so a pre-hydration bootstrap script (SPEC-DESTINATIONS §4) can read the decision synchronously before any tag fires.
- **Record guard**: valid only if `decision` passes the shape guard (§1), `policyVersion` is a string, and `timestamp` is a number.

**Storage contract** (implementation supplies the backend):

- `load() → record | none`, `save(record)`, `clear()`, and `subscribe(listener) → unsubscribe`.
- `subscribe` MUST notify on any change to the stored record, **including writes from other tabs/processes** where the platform allows it.
- Degradation: corrupt state, a blocked store (private mode, quota), or a missing platform store MUST degrade to an in-memory record for the session — the visitor's decision still applies instead of re-prompting in a loop. A malformed persisted value reads as "no record", never as a decision.
- After a successful persistent write, any in-memory fallback copy MUST be dropped — the persistent store is authoritative, and a lingering memory copy would shadow an external clear (e.g. the visitor wiping site data).
- Implementations SHOULD cache parse+validate per raw value so per-event gate checks cost a memory read, not a parse.

## 6. Reading the stored decision

`readStoredDecision(storage, policyVersion) → decision | none`:

1. `load()` the record; none → none.
2. `record.policyVersion` differs from the current `policyVersion` → none (superseded policy re-prompts).
3. `record.decision` fails the shape guard → none (garbage re-prompts, never silently denies or grants).
4. Otherwise return the **normalized** decision (§1).

## 7. Effective consent

The consent a tracker and every tag MUST honor right now:

```
effectiveConsent = readStoredDecision(storage, policyVersion)
                   ?? resolveDefaultConsent(mode, requestedCategories, hasGpcSignal)
```

- `isAnalyticsAllowed = effectiveConsent.analytics` — this single boolean gates the tracking pipeline.
- The GPC signal MUST be re-read at each evaluation (it can change mid-session).
- **Prompt rule**: a consent prompt is needed iff `mode == "opt-in"` and no stored decision exists. Opt-out regions never block on a prompt.
- Saving a decision writes `{ decision, policyVersion (current), timestamp (now) }` and notifies subscribers; deny-all saves all-false, grant-all saves exactly `requestedCategories` granted.

## 8. Initial consent (region-resolved defaults)

The server lane resolves a per-visitor value handed to the client so it never re-guesses the mode:

```json
{ "defaultConsent": { "ads": false, "analytics": false }, "mode": "opt-in", "region": "other" }
```

- **Strictest initial consent** — the constant `{ defaultConsent: all denied, mode: "opt-in", region: "other" }`: the one default safe to show any visitor anywhere. Shared/CDN-cached HTML MUST bake this and nothing region-specific.
- **Guard** for values read from untrusted storage (a session cache, a cookie): `mode` and `region` must be valid enum members, `defaultConsent` must pass the decision shape guard, and the pairing must satisfy `mode == resolveConsentMode(region)` — with exactly one exception, the strictest constant's own pairing (`opt-in` + `other`), which is stricter than the region's usual mode, never looser.

## 9. Withdrawal side effects

When a decision is saved with `analytics == false` (deny or withdraw), the implementation MUST clear first-party tracking state: the anonymous id (SPEC-IDENTITY §5) and any destination identifier cookies (e.g. Google's `_ga*`, SPEC-DESTINATIONS §4). Grant paths are a no-op.

## Conformance vectors

**V1 — region table.** `"de"` → `eu`; `"GB"` → `eu`; `"vn"` → `vn`; `"US"` → `us`; `"BR"` → `other`; `"JP"` → `other`.

**V2 — mode table.** `eu` → `opt-in`; `vn` → `opt-in`; `us` → `opt-out`; `other` → `opt-out`.

**V3 — defaults.** (`opt-in`, requested `["ads","analytics"]`, gpc any) → `{ads:false, analytics:false}`. (`opt-out`, requested `["analytics"]`, gpc false) → `{ads:false, analytics:true}`. (`opt-out`, requested `["ads","analytics"]`, gpc true) → `{ads:false, analytics:true}`.

**V4 — decision guard.** `{"ads":true,"analytics":false}` valid; `{"ads":true}` invalid; `{"ads":"yes","analytics":true}` invalid; `"granted"` invalid; `["ads"]` invalid; `null` invalid.

**V5 — normalization.** `{"ads":true,"analytics":true,"extra":"x"}` → `{"ads":true,"analytics":true}` (extra key dropped).

**V6 — policy supersession.** Stored record with `policyVersion:"v1"`, current version `"v2"` → `readStoredDecision` returns none; effective consent falls back to the regional default; prompt needed under opt-in.

**V7 — effective consent precedence.** Opt-out region, requested `["analytics"]`, stored decision `{ads:false, analytics:false}` → effective `{ads:false, analytics:false}` (stored wins over the granting default).

**V8 — initial-consent guard.** `{defaultConsent:{ads:false,analytics:false}, mode:"opt-in", region:"other"}` valid (strictest exception). `{…, mode:"opt-out", region:"other"}` valid (usual pairing). `{…, mode:"opt-out", region:"eu"}` invalid (looser than the region's mode). `{…, mode:"opt-in", region:"us"}` invalid (only the strictest constant's pairing may deviate).

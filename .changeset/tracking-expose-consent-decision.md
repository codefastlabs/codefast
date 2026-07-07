---
"@codefast/tracking": minor
---

Expose the stored decision from `useConsent` and ignore tampered consent records.

- `UseConsentResult` gains `decision` — the stored decision under the current policy version, `undefined` until the visitor makes one. Consumers need it to replay a returning visitor's decision into Google Consent Mode (e.g. from an effect) without conflating "denied" with "no decision yet", which the boolean `isTrackingAllowed` cannot distinguish.
- `useConsent` now counts only a well-formed `decision` (`"granted"`/`"denied"`): the record is tamperable plain JSON, and a garbage value re-prompts instead of silently denying. This matches how a pre-hydration Consent Mode bootstrap reading the same record should treat it.
- Documented that `createLocalStorageConsentStorage` persists the record as plain `JSON.stringify(ConsentRecord)` — a stable contract, so inline scripts can read the decision synchronously before any tag fires.

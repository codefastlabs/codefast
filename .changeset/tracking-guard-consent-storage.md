---
"@codefast/tracking": patch
---

Guard `createLocalStorageConsentStorage` with `isConsentRecord` so malformed localStorage JSON cannot be treated as a valid consent record.

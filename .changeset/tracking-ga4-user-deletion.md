---
"@codefast/tracking": minor
---

Adds GA4 DSR delegation (spec-data-subject-rights §3): the system delegates per-visitor deletion to the platform rather than building a deletion store. `buildGa4UserDeletionRequest({ propertyId, clientId })` returns the network-free request shape and `submitGa4UserDeletion({ …, accessToken, transport? })` POSTs it — targeting the current **Analytics Admin API** `properties.submitUserDeletion` (the legacy v3 `userDeletionRequests:upsert` was sunset with Universal Analytics), keyed by a flat `clientId`. Authorization is the caller's: pass a bearer token for the `analytics.edit` scope; no OAuth or HTTP client is baked in. Server-only (`@codefast/tracking/server`).

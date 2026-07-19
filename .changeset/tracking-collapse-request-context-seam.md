---
"@codefast/tracking": minor
---

Remove two leftover indirection layers in the server lane that no call site used.

Breaking:

- The `@codefast/tracking/adapters/request-context` subpath is gone. Its `RequestContext` seam (a `getHeader`/`setHeader` interface) plus the parallel `*FromContext`/`*OnContext` helpers existed only to back a hypothetical future `./next`/`./remix` adapter, but there was exactly one adapter and it duplicated every signature and doc comment. `@codefast/tracking/adapters/tanstack-start` now calls `getRequestHeader`/`setResponseHeader` directly; its public surface (`resolveInitialConsentFromRequest`, `setAnonymousIdResponseCookie`, `clearAnonymousIdResponseCookie`, `recordConsentReceiptFromRequest`) is unchanged.
- `resolveRegion(headers)` is removed from `@codefast/tracking/server/region`. It was a pre-fail-closed leftover with no production call site, and its missing-geo semantics (unknown region → opt-out) contradicted the fail-closed invariant the server-first path relies on. Use `resolveRegionFromCountryCode` (what the production path already uses via `resolveInitialConsent`), or `resolveInitialConsentFromRequest` for the full per-request resolution.

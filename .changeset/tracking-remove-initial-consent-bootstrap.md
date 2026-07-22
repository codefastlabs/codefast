---
"@codefast/tracking": minor
---

Remove the deprecated edge-middleware cookie bootstrap path:

- Drop `buildInitialConsentBootstrapScript` and the `@codefast/tracking/destinations/initial-consent-bootstrap` subpath.
- Resolve region consent via a server function (`resolveInitialConsent`) plus a client snapshot instead — see `apps/ui` `visitor-consent.ts` / `resolve-visitor-consent.ts`.

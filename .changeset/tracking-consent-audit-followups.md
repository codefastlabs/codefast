---
"@codefast/tracking": minor
---

Remove `defaultConsentExpression` from gtag/GTM consent bootstraps. Pass a literal `defaultConsent` (strictest bake on shared HTML) and upgrade after hydration via the server-fn lane + `updateGoogleConsent`.

---
"@codefast/tracking": minor
---

Rename `UseConsentResult.needsPrompt` to `isPromptNeeded` — a boolean should read as an assertion, matching `isTrackingAllowed` on the same result (Swift API Design Guidelines pass).

**Breaking:** consumers of `useConsent`/`ConsentBanner` reading `needsPrompt` must switch to `isPromptNeeded`.

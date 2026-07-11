---
"@codefast/tracking": minor
---

`resolveInitialConsent` (née `buildInitialConsent`) now fails closed for a missing country code: an unknown visitor (prerender crawl, host without a geo header) resolves to the strictest opt-in default instead of `"other"`'s analytics-granted opt-out. A known non-EU country still resolves to opt-out — unknown is not known-elsewhere. Behavior change only for callers that passed `countryCode: undefined` and relied on the opt-out fallback; callers that guarded the missing case themselves can drop the guard.

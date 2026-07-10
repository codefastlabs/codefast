---
"@codefast/tracking": minor
---

Consent internals cleanup. The gtag and GTM bootstraps now share one preamble builder (`googleConsentBootstrapPreamble` — generated output unchanged), `toGoogleConsentParams` derives from the signal map instead of hand-writing it, the runtime consent setters (`updateGoogleConsent`, `setGoogleConsentDefault`, `setGoogleAdsDataRedaction`, `setGoogleUrlPassthrough`) accept a `dataLayerName`, `VercelAnalyticsDestinationOptions` is exported from the destinations barrel, and the cookie-string parser is shared as `readCookieValue` (`@codefast/tracking/core/cookie`). Removed never-consumed exports: `GOOGLE_CONSENT_SIGNAL_CATEGORIES`, `GoogleConsentSignal`, `isGa4EventName`, `consentDecisionShapeCheckExpression`, `consentSignalAssignmentsExpression`.

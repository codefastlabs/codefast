---
"@codefast/tracking": minor
---

Add three helpers that pull common consent/tracking wiring out of consumer apps and into the package:

- `resolveEffectiveConsent(storage, policyVersion, categories, mode, hasGpc)` and `readStoredDecision(storage, policyVersion)` (`@codefast/tracking/core`) — the same "stored decision, else region default" rule `useConsent` applies internally, now exposed so a non-React gate (e.g. a tracker's `isTrackingAllowed` option) doesn't have to reimplement it by hand.
- `buildGtagConsentBootstrapScript(options)` (`@codefast/tracking/destinations`) — generates the pre-hydration `<script>` source that applies Google Consent Mode v2's default signal from the stored decision (or a supplied fallback) and conditionally loads gtag.js, replacing a hand-written JS string per app.
- `createCookieAnonymousId(options)` (`@codefast/tracking/client`) — an opt-in `document.cookie`-backed anonymous id `getOrCreate`/`clear` pair for apps that don't need a custom identity strategy.

None of these change existing exports' behavior; `useConsent` is refactored internally to use `readStoredDecision` but its output is unchanged.

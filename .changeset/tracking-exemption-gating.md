---
"@codefast/tracking": minor
---

`createClientTracker` now accepts an optional `isExemptionAllowed` gate, consulted before an `exempt` destination receives an event while the consent gate is closed. ePrivacy audience-measurement exemption is jurisdiction-dependent (spec-destinations §2), so it must be gateable per region rather than assumed global — returning `false` withholds even exempt sinks where exemption is not defensible. Omit it to keep the prior behavior (exempt everywhere). The gate is irrelevant once consent is granted, since every destination then receives the full envelope.

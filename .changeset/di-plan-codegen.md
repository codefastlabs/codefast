---
"@codefast/di": patch
---

A compiled instantiation plan that keeps running — sync or async — is generated as a function of its own through the
`Function` constructor and takes the closure's place, so its call sites carry feedback for one plan only instead of for
every plan the process has compiled; below the threshold a plan stays a closure, so a cold container or a per-request
child never compiles one. A runtime whose Content Security Policy refuses the constructor keeps every plan a closure and
behaves identically. `RESOLUTION_DIAGNOSTICS` reports `generatedPlanCount`.

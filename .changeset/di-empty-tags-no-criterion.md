---
"@codefast/di": patch
---

A dependency slot declaring `tags: []` states no criterion, as a binding slot already did:
`injectionSlotToResolveOptions` answers `undefined` for it, and such a dependency no longer escapes a compiled plan.

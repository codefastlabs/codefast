---
"@codefast/tracking": patch
---

Skip `clearOnServer` when the anonymous-id cookie is already gone, so a second withdrawal clear in the same tick does not fire a redundant server round-trip.

---
"@codefast/di": patch
---

Allocate the deactivation-pair list only when an unbind, rebind or teardown actually owes a deactivation; the hot-swap
shape, a binding nothing ever cached, hands back a shared empty list instead.

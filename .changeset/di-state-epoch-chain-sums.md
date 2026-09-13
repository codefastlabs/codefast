---
"@codefast/di": patch
---

Memoize the chain-summed registry and activation versions against a process-wide state epoch that every registry
mutation and activation-hook registration advances. A resolve from a deep child no longer walks its whole ancestor chain
on every lookup while nothing has changed; the first read after any change re-sums exactly as before.

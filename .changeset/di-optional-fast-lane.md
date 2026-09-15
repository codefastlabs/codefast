---
"@codefast/di": patch
---

`resolveOptional` with no options answers a lone default binding in its own registry on the lane a plain `resolve`
takes, and a root that keeps no records answers a miss without the selection walk; a generated `toResolved` plan checks
its factory's result for a promise inline instead of through a call.

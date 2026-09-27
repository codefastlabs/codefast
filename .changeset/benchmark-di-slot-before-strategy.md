---
"@benchmark/di": patch
---

The codefast scenarios declare each binding's slot before `to*()`, as `@codefast/di` 0.12 requires, and the refined bind
row now measures a slot declared before registration and a scope after it.

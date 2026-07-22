---
"@codefast/di": patch
---

Extend the compiled-plan and memoization coverage: `toResolved(...)` transient bindings with pure-static explicit deps now compile into factory-call plans (same refusal rules and sync-only check as class plans), and name-only resolves gain a chain-versioned memo that fast-paths constants and cached singletons — predicates, aliases, and anything context-dependent keep the full selection path. Measured: `named-constant-get` ~21M → ~30M hz/op, `to-resolved-3-deps` ~39M → ~52M hz/op.

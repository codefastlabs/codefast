---
"@codefast/di": patch
---

Fix a crash on cyclic aliases: `bind(a).toAlias(b)` + `bind(b).toAlias(a)` previously recursed until `RangeError: Maximum call stack size exceeded` on both `resolve` and `resolveAsync`. Alias following is now an iterative loop with exact revisit detection — a genuine cycle throws `CircularDependencyError` naming the alias chain, and legitimately long alias chains resolve with no arbitrary hop cap.

Also splits the magic `32` that served two unrelated roles: the transient-dynamic fast lanes keep their own `DEEP_LANE_THRESHOLD = 32` (a shared-context/pool design point), while the cycle-scan Set attachment moves to a measured `RESOLUTION_SET_THRESHOLD = 128` — benchmarking showed `Array.includes` beats the Set's has/add/delete churn up to at least depth 96, so mid-depth graphs now skip the Set entirely.

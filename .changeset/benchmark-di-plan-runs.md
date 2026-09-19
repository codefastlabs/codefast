---
"@benchmark/di": minor
---

Add the `plan-runs-*` engine rows: a fresh container resolving a transient class chain exactly `k` times, at two depths,
so the compiled plan's closure tier, its generation on the thirty-second run, the generated function's warm-up and its
warm run are each priced as the difference between two rows.

---
"@benchmark/di": patch
---

`RESULTS.md` is rewritten from a pass over the tree with the cold class lane, rebind and teardown changes. That pass
moves the 100-singleton pair from 0.58× and 0.55× ditox to 0.66× both, and lifts the decorated boot and the plan escapes
by a tenth or more. The teardown entry now measures the teardown on its own rather than inferring it from two ratios.
The page also names the rows that fell in the pass but read level in a paired probe. The run's `observations.jsonl`
replaces the previous one under `baselines/`.

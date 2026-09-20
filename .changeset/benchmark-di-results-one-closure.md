---
"@benchmark/di": patch
---

`RESULTS.md` is rewritten from a pass of the harness that runs every trial over the one closure built before the first,
on the same engine as the previous page. The previous harness built a fresh closure per trial and so measured two of
every three trials without V8's function-context specialization; the median moved on 43 codefast rows by more than 10%
for that alone, and the warm-read gap the page had filed as harness-only is gone with it. The run's `observations.jsonl`
is committed under `baselines/`; the pass it replaces is removed.

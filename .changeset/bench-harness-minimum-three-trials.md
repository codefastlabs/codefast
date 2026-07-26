---
"@codefast/benchmark-harness": patch
---

Raise the minimum per-scenario trial count from 2 to 3 in every profile. A median of two samples is just their mean, so a two-trial run cannot separate a real change from ambient noise — which is exactly the judgement the harness exists to support. `BENCH_TRIALS` now rejects anything below 3.

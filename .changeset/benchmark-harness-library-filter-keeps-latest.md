---
"@internal/benchmark-harness": patch
---

A run narrowed with `BENCH_LIBRARY` no longer moves `latest.json`. The pointer check read only the scenario and tier
filters, so a one-library run that measured every row became the run the next whole-suite pass diffed against. The
comparison document's `run` block records the filter as `libraryFilter`, the writer keeps the pointer when it is set,
and the run card names the libraries a kept pointer was filtered to.

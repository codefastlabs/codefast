---
"@internal/benchmark-harness": patch
---

`BENCH_LIBRARY=<name,…>` restricts a run to the libraries named, by `libraryName` or `displayName`; a library-filtered
run counts as narrowed and leaves `latest.json` alone, a typo names every known library, and a filter that leaves the
suite's subject out fails instead of reporting nothing.

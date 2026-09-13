---
"@benchmark/di": minor
---

Every scenario declares its tier and the public-API features it requires; every library declares the features its API
offers.

- 86 `contract` rows are specified against the public API and survive an engine rewrite; 25 `engine` rows name a lane of
  the current resolver (compiled plans and their escapes, the tag-key mask, the hoisted-versus-inline options object,
  the async branch lane) and are instrumentation owed by no other library. `BENCH_TIER=contract pnpm bench:isolate` runs
  the comparison without them.
- `src/fixtures/features.ts` is the feature vocabulary; `src/harness/config.ts` declares each library's features, read
  from its installed typings. `pnpm bench:list` now reports per library which rows it owes (gaps) apart from the rows it
  cannot express, and fails when a library implements a row whose required feature it does not declare.

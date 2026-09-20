---
"@benchmark/di": patch
---

Four ways to run, each with one purpose: `pnpm bench` isolates every scenario in its own subprocess and is the lane to
cite; `pnpm bench:fast` is the shared-process smoke run; `pnpm bench:baseline` is the ledger's full pass against the
pinned baseline; `pnpm bench:ab` compares two builds of `@codefast/di`. `bench:isolate`, `bench:full` and
`bench:verbose` are removed; `BENCH_MODE=full` and `BENCH_VERBOSE=true` compose with `bench`.

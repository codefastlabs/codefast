---
"@benchmark/tailwind-variants": patch
---

`pnpm bench` isolates every scenario in its own subprocess and is the lane to cite; `pnpm bench:fast` is the
shared-process smoke run; `pnpm bench:ab` compares two builds. `bench:isolate`, `bench:full` and `bench:verbose` are
removed; `BENCH_MODE=full` and `BENCH_VERBOSE=true` compose with `bench`.

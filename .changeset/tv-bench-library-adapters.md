---
"@benchmark/tailwind-variants": patch
---

Both `tv()` libraries now run one copy of every shared scenario, built against a per-library adapter, so a timed loop
can no longer differ between the subject and upstream, and each bench subprocess loads only its own library. Every
shared row declares the classes its workload resolves, and `pnpm bench:parity`, run in CI, fails when the two libraries
resolve any of them differently.

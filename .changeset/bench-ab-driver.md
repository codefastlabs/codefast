---
"@internal/benchmark-harness": minor
"@benchmark/di": minor
"@benchmark/tailwind-variants": minor
---

Add a shared `bench:ab` driver for paired, alternating A/B comparison of a benchmark subject against another build of
itself.

`internal/benchmark-harness` gains `runBenchAbMain`, which swaps the subject package's `src` per side (a git ref, or the
working tree for the new side), measures each side through a narrowed isolated pass, alternates which side goes first
between experiments, and reports the ratio of medians with each side's spread — restoring the working tree on any exit.
`@benchmark/di` and `@benchmark/tailwind-variants` each expose it as `bench:ab` (`pnpm di:bench:ab` / `pnpm tv:bench:ab`
from the repo root). It narrows to the subject, so a pass leaves `latest.json` untouched.

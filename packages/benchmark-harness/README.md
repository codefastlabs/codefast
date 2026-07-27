# @codefast/benchmark-harness

Shared [tinybench](https://github.com/tinylibs/tinybench) harness utilities for the `benchmarks/*` suites — subprocess protocol, environment fingerprinting, and one comparison report that renders a pivot library against any number of competitors.

> **Private package.** Not published to npm; consumed only by the benchmark suites in this repository.

## What It Provides

The package is organized by role in the parent/child subprocess model:

| Area       | Purpose                                                                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/*` | Subprocess protocol (payload markers, emit/extract, `scenarioIds` discovery), env keys, and suite configuration types                                                                                                                                            |
| `child/*`  | Runs inside each benchmark subprocess: scenario types, trial runners, sanity checks, fingerprinting, `BENCH_LIST` / `BENCH_ONLY` worker modes                                                                                                                    |
| `parent/*` | Orchestrates subprocesses from the suite entry: `runBenchSubprocess`, `runBenchSubprocessIsolated` (+ `isIsolatedBenchRunRequested`), exit-code resolution                                                                                                       |
| `report/*` | Aggregation, quantiles, the pivot-vs-competitors comparison table + geomean/per-group head-to-head summary (`report/comparison`), the reliability marker for rows that do not reproduce between runs (`report/reliability`), JSONL persistence, formatted output |

Two execution shapes:

- **Shared** (`runBenchSubprocess`): one child per library runs every scenario — approximates a long-lived app, but earlier scenarios train the library's hot-path inline caches for later ones (measured at ~30% on async chains), so rows are order-dependent.
- **Isolated** (`runBenchSubprocessIsolated`, opt in with `BENCH_ISOLATE=1`): one child **per scenario** per library — a `BENCH_LIST` discovery child reports scenario ids, then `BENCH_ONLY=<id>` workers run one scenario each and the parent merges trials back into a single payload. Order-independent.

Reports open with a **head-to-head summary**: win/parity/loss counts over comparable rows (±3% parity band), the median and geomean ratios, a geomean-by-group breakdown (which keeps error-path groups separate from throughput), and loss/parity lists. `collectFingerprint` records the runtime environment (Node version, CPU, library versions) alongside every run so historical results stay comparable.

## Usage

Consumed by the suites under [`benchmarks/`](https://github.com/codefastlabs/codefast/tree/main/benchmarks) via `workspace:*`. From the repo root:

```bash
pnpm bench         # run the benchmark suites
pnpm bench:serve   # browse historical results (see @codefast/benchmark-viewer)
```

Suite-level knobs are environment-driven: `BENCH_FAST=1` (quick pass), `BENCH_FULL=1` (extended pass), `BENCH_TRIALS=<n>` (trial count, min 2), `BENCH_VERBOSE=1` (forward child logs), `BENCH_ISOLATE=1` (one subprocess per scenario). `BENCH_LIST` / `BENCH_ONLY` are internal child-side keys set by the isolated parent — not meant to be set by hand.

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

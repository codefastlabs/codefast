# @codefast/benchmark-harness

Shared [tinybench](https://github.com/tinylibs/tinybench) harness utilities for the `benchmarks/*` suites — subprocess
protocol, environment fingerprinting, and one comparison report that renders a pivot library against any number of
competitors.

> **Private package.** Not published to npm; consumed only by the benchmark suites in this repository.

## What It Provides

The package is organized by role in the parent/child subprocess model:

| Area       | Purpose                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/*` | Subprocess protocol (payload markers, emit/extract, `scenarioIds` discovery), env keys, and suite configuration types                                                                                                                                                                           |
| `child/*`  | Runs inside each benchmark subprocess: scenario types, trial runners, sanity checks, fingerprinting, `BENCH_LIST` / `BENCH_ONLY` worker modes                                                                                                                                                   |
| `parent/*` | Orchestrates subprocesses from the suite entry: `runBenchSubprocess`, `runBenchSubprocessIsolated` (+ `isIsolatedBenchRunRequested`), exit-code resolution                                                                                                                                      |
| `report/*` | Aggregation, quantiles, the pivot-vs-competitors comparison tables + geomean/per-group head-to-head summary (`report/comparison`), the cell markers for medians unstable within a run and ratios that do not reproduce between runs (`report/reliability`), JSONL persistence, formatted output |

Two execution shapes:

- **Shared** (`runBenchSubprocess`): one child per library runs every scenario — approximates a long-lived app, but
  earlier scenarios train the library's hot-path inline caches for later ones (measured at ~30% on async chains), so
  rows are order-dependent.
- **Isolated** (`runBenchSubprocessIsolated`, opt in with `BENCH_ISOLATE=true`): one child **per scenario** per library
  — a `BENCH_LIST` discovery child reports scenario ids, then `BENCH_ONLY=<id>` workers run one scenario each and the
  parent merges trials back into a single payload. Order-independent.

Reports open with a **summary table, one row per competitor** — comparable rows out of the suite, win/parity/loss counts
(±3% parity band), median and geomean ratios, and how many of those rows carry the unreliable marker — followed by a
geomean-by-group matrix (which keeps error-path groups separate from throughput) and the loss/parity lists. The
per-scenario table below them carries the pivot's throughput and one ratio column per competitor; everything derivable
from those, along with per-trial IQR, stays in the JSONL. `collectFingerprint` records the runtime environment (Node
version, CPU, library versions) alongside every run so historical results stay comparable.

## Usage

Consumed by the suites under [`benchmarks/`](https://github.com/codefastlabs/codefast/tree/main/benchmarks) via
`workspace:*`. From the repo root:

```bash
pnpm bench         # run the benchmark suites
pnpm bench:serve   # browse historical results (see @codefast/benchmark-viewer)
```

Suite-level knobs are environment-driven:

| Key                    | Effect                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `BENCH_MODE=fast`      | Smoke pass: shorter sampling windows, one trial. Never a citable number |
| `BENCH_MODE=default`   | The default profile — same as leaving `BENCH_MODE` unset                |
| `BENCH_MODE=full`      | Extended pass with `--expose-gc`                                        |
| `BENCH_TRIALS=<n>`     | Trial count; the harness refuses anything below 3                       |
| `BENCH_VERBOSE=true`   | Forward child stdout                                                    |
| `BENCH_ISOLATE=true`   | One subprocess per scenario                                             |
| `BENCH_ONLY=<id>,<id>` | Restrict the run to these scenario ids                                  |
| `BENCH_PORT=<n>`       | Preferred port for `bench:serve`                                        |

[`shared/env-keys.ts`](src/shared/env-keys.ts) is the single source for all of it: `BENCH_ENV_SPECS` declares each key's
accepted values, who may set it, and which Turbo tasks must pass it through. Everything else derives from that map — the
parsers, the keys the parent strips before spawning a child, and a test asserting `turbo.json` lists every user-facing
key. Turbo runs in strict env mode, so a key missing from `passThroughEnv` is dropped for any run started at the repo
root, which looks exactly like the key having no effect.

Nothing in the namespace fails quietly. On/off keys accept `1`, `true`, `yes` or `on` in any case; numeric keys take
digits only and are range-checked, so `BENCH_TRIALS=3abc` and `BENCH_PORT=0` are errors rather than a silently different
number. An unknown `BENCH_*` key is rejected too — `BENCH_MODEE=fast` selects nothing, so it throws instead.
`BENCH_MODE` is one key with three values rather than a flag per profile — the profiles are mutually exclusive, so a
flag pair could express a both-on state with no meaning. `BENCH_LIST` is an internal child-side key set by the isolated
parent — not meant to be set by hand.

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

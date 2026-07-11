# @codefast/benchmark-harness

Shared [tinybench](https://github.com/tinylibs/tinybench) harness utilities for the `benchmarks/*` suites — subprocess protocol, environment fingerprinting, and two-way comparison reports.

> **Private package.** Not published to npm; consumed only by the benchmark suites in this repository.

## What It Provides

The package is organized by role in the parent/child subprocess model:

| Area       | Purpose                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------- |
| `shared/*` | Subprocess protocol (payload markers, emit/extract), env keys, and suite configuration types        |
| `child/*`  | Runs inside each benchmark subprocess: scenario types, trial runners, sanity checks, fingerprinting |
| `parent/*` | Orchestrates subprocesses from the suite entry: spawning, exit-code resolution                      |
| `report/*` | Aggregation, quantiles, two-way library comparison, JSONL persistence, and formatted output         |

Each benchmark scenario runs in its own child process so results are isolated from JIT and GC state accumulated by other scenarios. `collectFingerprint` records the runtime environment (Node version, CPU, library versions) alongside every run so historical results stay comparable.

## Usage

Consumed by the suites under [`benchmarks/`](https://github.com/codefastlabs/codefast/tree/main/benchmarks) via `workspace:*`. From the repo root:

```bash
pnpm bench         # run the benchmark suites
pnpm bench:serve   # browse historical results (see @codefast/benchmark-viewer)
```

Suite-level knobs are environment-driven: `BENCH_FAST=1` (quick pass), `BENCH_FULL=1` (extended pass), `BENCH_VERBOSE=1`.

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

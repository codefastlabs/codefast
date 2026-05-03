# @codefast/benchmark-tailwind-variants

Performance harness for **@codefast/tailwind-variants**, **tailwind-variants** (npm), and **class-variance-authority**: each library runs in its own subprocess; the parent then renders **two** head-to-head tables (same reporter stack as `@codefast/benchmark-di-inversify`) with per-trial medians and interquartile range.

New to the subprocess wire format, `hz/op`, or how to read the markdown tables? See **[../di-inversify/BENCH_GUIDE.md](../di-inversify/BENCH_GUIDE.md)** — the glossary and mental model (parent → subprocess → tinybench) apply here too; only the library count and output filenames differ.

This package exists so runtime changes to `@codefast/tailwind-variants` cannot silently regress against the npm `tailwind-variants` API people actually ship, and so comparisons involving **class-variance-authority** stay on identical prop loops and tinybench budgets.

## Philosophy

The goal is not to crown a single “winner” on synthetic configs. The goal is to measure **representative `tv` / `createTV` / slot workloads** under the same iteration and time budgets, with merge behaviour explicitly controlled (`twMerge: true` / `false` passed into both `tv` implementations so defaults do not skew the run).

### Three subprocesses, two comparisons

- **@codefast/tailwind-variants** and **tailwind-variants** both run the **full** scenario set (16 rows): same scenario `id`s, same fixtures, same tinybench options per trial profile.
- **class-variance-authority** runs only the scenarios where a CVA analogue exists today (**simple** and **complex**, with and without merge) — four rows. In the **@codefast/tailwind-variants vs CVA** report, every other scenario still appears: the CVA side is formatted as “—” / zero throughput, matching the harness rule “include every id that appears on either side”.

CVA “with merge” applies **`tailwind-merge` after `cva()`** — the usual production pairing. That is **not** bit-identical to `tv`’s internal merge; treat that row as “CVA + merge as teams wire it”, not as a perfect structural match to `tv`’s merge path.

### Trials, medians, IQR

Each library subprocess runs **N trials** back-to-back (minimum **2** in normal / fast runs, **3** with `BENCH_FULL=1`). Every trial builds a fresh `Bench` so tinybench’s internal warmup runs again per trial, reducing (not eliminating) cross-trial JIT correlation. Override with `BENCH_TRIALS` (integer `>= 2`).

The reporter collapses N per-trial results into:

- **`hz/op`** — median of per-trial `throughput.mean * batch` (here `batch` is almost always `1`).
- **`IQR`** — interquartile range of per-trial `hz/op`, as a fraction of the median. Treat **> ~5%** as noisy; re-run on a quieter machine.
- **`mean ms`**, **`p99 ms`** — per-trial medians of tinybench `latency.mean`, `latency.p99`.

**JSONL** (`bench-results/latest.jsonl`) is one JSON object per line: one **observation** per `(library, trialIndex, scenario)` with fingerprint fields inlined — same shape as the DI benchmark, with three libraries in one file. Pivot with pandas, DuckDB, or `jq`.

### Batched sub-μs work

If you add a scenario whose mean sample time drops **below ~0.5 µs**, declare a `batch` factor on `BenchScenario` and loop inside the measured closure (see `@codefast/benchmark-di-inversify` for the `batched()` pattern). Current variant workloads are macroscopic; they keep `batch = 1`.

### Subprocess protocol

Each library bench runs in **its own** subprocess so V8 / IC state does not cross-contaminate. Each child prints one **`SubprocessPayload`** JSON to stdout between `BENCH_RESULT_JSON_START` and `BENCH_RESULT_JSON_END` (`@codefast/benchmark-harness`). The parent parses **only** that span.

Environment is pinned the same way as DI: `NODE_ENV=production`, `NODE_OPTIONS` always includes `--no-warnings`; with `BENCH_FULL=1`, **`--expose-gc`** is added and the trial harness can stride manual `gc()` between samples.

All three children use **`tsconfig.json`** in this package (no decorator split like DI).

## Running

From the repo root:

```bash
pnpm --filter @codefast/benchmark-tailwind-variants bench
```

Or from this package:

```bash
pnpm bench                             # parent: rebuild @codefast/tv + 3 subprocesses + 2 tables + writes
pnpm bench:verbose                     # forwards child stdout (debug)
pnpm bench:fast                        # BENCH_FAST=1 on the parent (children inherit)
pnpm bench:full                        # BENCH_FULL=1 on the parent
pnpm bench:codefast                    # @codefast/tailwind-variants subprocess only (raw payload on stdout)
pnpm bench:tailwind-variants           # tailwind-variants (npm) subprocess only
pnpm bench:class-variance-authority    # class-variance-authority subprocess only
pnpm check-types                       # TypeScript (single tsconfig)
```

`pnpm bench` defaults to **quiet** mode: child **stdout** is suppressed so the framed JSON stays parseable; **stderr** still shows `[codefast]` / `[tailwind-variants]` / `[cva]` progress lines. Use `BENCH_VERBOSE=1` or `pnpm bench:verbose` when you need full child stdout.

## Environment configuration

### Runtime baseline (pinned by harness)

| Key                        | Value / behaviour                      |
| -------------------------- | -------------------------------------- |
| `NODE_ENV`                 | `production`                           |
| `NODE_OPTIONS`             | Always includes `--no-warnings`        |
| `NODE_OPTIONS` (full mode) | Adds `--expose-gc` when `BENCH_FULL=1` |

### User-tunable env vars

| Variable        | Values         | Effect                                                                            |
| --------------- | -------------- | --------------------------------------------------------------------------------- |
| `BENCH_FAST`    | `1`            | Quick smoke profile (shorter tinybench sampling windows).                         |
| `BENCH_FULL`    | `1`            | Slower profile: GC exposed, longer sampling, default **3** trials per subprocess. |
| `BENCH_TRIALS`  | integer `>= 2` | Overrides trial count; invalid values fall back to the default.                   |
| `BENCH_VERBOSE` | `1`            | Forwards child subprocess stdout for debugging.                                   |

### Recommended presets

| Goal                        | Command                                   |
| --------------------------- | ----------------------------------------- |
| Local sanity check          | `BENCH_FAST=1 pnpm bench`                 |
| Debug noisy/failed scenario | `BENCH_FAST=1 BENCH_VERBOSE=1 pnpm bench` |
| Publishable comparison      | `BENCH_FULL=1 BENCH_TRIALS=3 pnpm bench`  |

### Outputs

Under `bench-results/<timestamp>/` (gitignored at repo root: `benchmarks/**/bench-results/`):

| File                                    | Purpose                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `report-vs-tailwind-variants.md`        | Markdown two-way: @codefast/tailwind-variants **vs** tailwind-variants (npm).  |
| `report-vs-class-variance-authority.md` | Markdown two-way: @codefast/tailwind-variants **vs** class-variance-authority. |
| `report.md`                             | Both markdown reports concatenated (single file for archiving).                |
| `observations.jsonl`                    | Flattened observations for all **three** libraries.                            |

Mirrors under `bench-results/` for stable paths / CI diffs:

- `latest-vs-tailwind-variants.md`
- `latest-vs-class-variance-authority.md`
- `latest.md` (same concatenation as per-run `report.md`)
- `latest.jsonl`

The **terminal** prints **two** ASCII tables back-to-back (cf vs npm `tailwind-variants`, then cf vs CVA).

## Reading the output

The console tables follow the same column contract as `@codefast/benchmark-di-inversify` (throughput, ratio, mean ms, p99 ms, IQR in the markdown exports).

Before you cite a number:

1. **IQR** (markdown): if either side’s IQR fraction is **> ~5%**, treat the median as unstable; re-run.
2. **Sanity failures**: scenarios that fail `sanity` are **skipped** and listed at the top of the markdown report — absence of a row is not “the library cannot do it”.
3. **`gcExposed`**: in full mode, confirm the fingerprint block shows exposed GC when you care about allocation-heavy variance (same intuition as DI).

## Scenario inventory

Shared **fixture** data lives in `src/fixtures/`. Each **scenario `id`** is implemented once per library under `src/scenarios/<library>/` with the same `id` string for alignment.

| Group            | Scenario `id`s                                              |
| ---------------- | ----------------------------------------------------------- |
| `simple`         | `simple-without-merge`, `simple-with-merge`                 |
| `complex`        | `complex-without-merge`, `complex-with-merge`               |
| `slots`          | `slots-without-merge`, `slots-with-merge`                   |
| `compound-slots` | `compound-slots-without-merge`, `compound-slots-with-merge` |
| `extends`        | `extends-without-merge`, `extends-with-merge`               |
| `create-tv`      | `create-tv-without-merge`, `create-tv-with-merge`           |
| `extreme`        | `extreme-without-merge`, `extreme-with-merge`               |
| `extreme-slots`  | `extreme-slots-without-merge`, `extreme-slots-with-merge`   |

**class-variance-authority** subprocess: only **`simple`** and **`complex`** (four ids total). All other ids exist only on the @codefast / npm `tv` sides.

## Layout

```
benchmarks/tailwind-variants/
  src/
    harness/
      run.ts                 # parent: rebuild, spawn 3 children, two two-way reports + JSONL
      trial.ts               # per-subprocess: N trials, tinybench, extract stats
      sanity.ts              # optional per-scenario sanity
      bench-options.ts        # TV_MERGE_ENABLED / TV_MERGE_DISABLED
      tv-presentation.ts     # markdown + console labels for each pairwise report
    lib/
      tv-shims.ts            # widened entry points for tv / createTV / cva (benchmark-only)
    fixtures/                # variant configs + slot types (no library-specific imports)
    scenarios/
      types.ts               # BenchScenario + ScenarioGroup
      collect-codefast-scenarios.ts
      collect-tailwind-variants-scenarios.ts
      collect-class-variance-authority-scenarios.ts
      codefast/              # scenarios using @codefast/tailwind-variants
      tailwind-variants/       # scenarios using npm tailwind-variants
      class-variance-authority/  # CVA-only subset
    codefast-benches.ts
    tailwind-variants-benches.ts
    class-variance-authority-benches.ts
  package.json
  tsconfig.json
  README.md
```

**Import boundaries (same discipline as DI):**

- Only `src/scenarios/codefast/**` and `src/lib/tv-shims.ts` need resolve `@codefast/tailwind-variants` for the measured API.
- Only `src/scenarios/tailwind-variants/**` and `src/lib/tv-shims.ts` import the **`tailwind-variants`** npm package.
- Only `src/scenarios/class-variance-authority/**` and `src/lib/tv-shims.ts` import **`class-variance-authority`**.
- `src/fixtures/**` must stay free of those imports — shared data and types only.

## Dependencies

**Runtime:** `@codefast/benchmark-harness`, `@codefast/tailwind-variants`, `tailwind-variants`, `class-variance-authority`, `tailwind-merge`, `tinybench`, `tsx`.

**Development:** `@codefast/typescript-config`, `@types/node`, `typescript`, `@typescript/native-preview`.

**Engines:** Node `>=22` (see `package.json`).

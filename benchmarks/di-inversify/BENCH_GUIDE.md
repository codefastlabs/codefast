# Bench guide for newcomers

This file sits next to [README.md](./README.md) and explains **how the harness thinks**, **what the words mean**, and **how to read the numbers** without re-reading the whole implementation.

## What this benchmark is

- **Goal**: Compare **@codefast/di** and **InversifyJS 8** on the same _production-shaped_ scenarios (resolve paths, graphs, async, lifecycle, scopes, boot), not toy APIs in isolation.
- **Engine**: Each scenario is a [tinybench](https://github.com/tinylibs/tinybench) **task**: the harness runs your closure many times, records latencies, and derives throughput and percentiles.
- **Shape**: Two **subprocesses** (one per library) so V8 JIT state from one side does not affect the other. The parent merges results into tables and JSONL.

If you only read one other file, read the **Environment** and **Comparable scenarios** sections at the top of `bench-results/latest.md` after a run.

## Mental model: parent → child → tinybench

1. You run `pnpm bench` (see README for variants).
2. The **parent** (`src/harness/run.ts`) spawns a child for codefast and a child for inversify.
3. Each **child** runs **N trials** (`BENCH_TRIALS`, default 2 or 3 in full mode). Each trial builds a fresh `Bench`, registers every scenario as a tinybench **task**, runs `bench.run()`, then collects per-task stats.
4. The child prints **one JSON object** to stdout, framed by `BENCH_RESULT_JSON_START` / `BENCH_RESULT_JSON_END` so stray logs do not break parsing.
5. The parent **aggregates** trials into medians and IQR (`src/harness/report.ts`) and writes `bench-results/latest.md` and `latest.jsonl`.

## Glossary

| Term                          | Meaning                                                                                                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**                  | One named benchmark (one row in the report), e.g. `constant-resolve`. Implemented per library under `src/scenarios/codefast/*.ts` and `src/scenarios/inversify/*.ts`.                                                                                           |
| **Group**                     | A label that clusters scenarios for reading: `micro`, `realistic`, `fan-out`, `async`, `lifecycle`, `scope`, `scale`, `boot`.                                                                                                                                   |
| **Task**                      | tinybench’s unit of work: your scenario’s `fn` (sync or async).                                                                                                                                                                                                 |
| **Iteration**                 | One execution of the task’s `fn` inside a single tinybench `run()`.                                                                                                                                                                                             |
| **Batch**                     | How many **logical operations** one iteration performs. If one resolve is faster than `performance.now()` resolution, the scenario loops `batch` times inside `fn`; the reporter scales throughput so **hz/op** is “per logical op”, not “per loop of `batch`”. |
| **Logical operation**         | What you declare one “op” to be for that scenario (e.g. one `container.get`, one cold graph build). Same idea as `batch` in protocol comments.                                                                                                                  |
| **Trial**                     | One full pass: new `Bench`, all tasks run, numbers recorded. Multiple trials capture **run-to-run** variance (JIT, GC, OS noise).                                                                                                                               |
| **hz/op**                     | **Operations per second per logical op**: tinybench’s `throughput.mean` × `batch`. Higher = more throughput. Reported values are **medians across trials** (per scenario, per library).                                                                         |
| **hz/iteration**              | Throughput per **bench closure invocation** (one iteration of the loop). Useful when debugging; the markdown table uses **hz/op**.                                                                                                                              |
| **mean ms**                   | Mean latency of one **iteration** (ms), from tinybench’s `latency.mean`. In the report: **median of that value across trials** (per library).                                                                                                                   |
| **p75 / p99 / p999 ms**       | Percentiles of iteration latency within a trial. The markdown table shows **p99** (again as **median across trials**).                                                                                                                                          |
| **Median across trials**      | For each metric, the harness sorts per-trial values and takes the 50th percentile. That dampens a bad first trial (warmup) and occasional GC spikes better than a mean would.                                                                                   |
| **IQR (interquartile range)** | For **hz/op** across trials: Q75 − Q25, then divided by the **median hz/op**. Shown as a **percentage** in `IQR (cf / inv)`. Large IQR ⇒ unstable throughput between trials; treat **> ~5%** as “noisy — re-run or don’t over-interpret”.                       |
| **codefast / inversify**      | Ratio of median **hz/op**. **> 1×** ⇒ codefast higher throughput on that row; **< 1×** ⇒ inversify higher. `—` if the ratio is undefined (e.g. missing data).                                                                                                   |
| **Fingerprint**               | Metadata stamped into the report: Node/V8 version, platform, CPU, `NODE_OPTIONS`, library versions, whether `gc` was exposed, timestamps. Use it to compare runs fairly.                                                                                        |
| **Sanity check**              | A quick pre-flight for a scenario; if it fails, that scenario is **skipped** for that library and listed under “Sanity failures”. Missing row ≠ “unsupported”; check the report header.                                                                         |
| **Comparable scenarios**      | The main comparison table: both libraries run the same scenario id where possible. Some rows are **library-specific** (e.g. codefast-only); the missing side shows `—`.                                                                                         |
| **Stress**                    | Optional boolean on a scenario (`stress: true` tags a heavier workload). Carried in the wire format and JSONL for filtering or docs; not its own column in the markdown table.                                                                                  |
| **`what`**                    | Short human description string carried in the protocol for each scenario (not always repeated in the markdown table).                                                                                                                                           |
| **JSONL**                     | `bench-results/latest.jsonl`: one JSON object per line, one **observation** per `(library, trialIndex, scenario)` with fingerprint fields inlined — good for pandas, DuckDB, or jq.                                                                             |
| **GC exposed**                | Node started with `--expose-gc` so the harness can call `globalThis.gc()` between tasks/trials to reduce GC-driven variance in allocation-heavy scenarios (especially in `BENCH_FULL=1`).                                                                       |

## Reading `bench-results/latest.md`

| Column                                   | Plain language                                                 |
| ---------------------------------------- | -------------------------------------------------------------- |
| **Scenario**                             | Which benchmark.                                               |
| **Group**                                | Which family it belongs to.                                    |
| **batch**                                | Logical ops per tinybench iteration for that row.              |
| **codefast hz/op** / **inversify hz/op** | Median throughput per logical op.                              |
| **codefast / inversify**                 | Throughput ratio (see glossary).                               |
| **\* mean ms**                           | Median across trials of mean iteration latency.                |
| **\* p99 ms**                            | Median across trials of p99 iteration latency (tail behavior). |
| **IQR (cf / inv)**                       | Stability of **hz/op** across trials for each library.         |

**Throughput vs latency**: A scenario can be tuned for **throughput** (large `batch`, high hz/op) or **latency** (`batch` 1, sensitive mean/p99). Compare like rows: same **Scenario** and **batch** on the same machine profile.

## Canonical decorator modes (why apples-to-apples is nuanced)

Each library runs in the mode it is **meant to ship with** (Stage 3 decorators + `Symbol.metadata` vs legacy decorators + `reflect-metadata`). README explains why. When you add a scenario, keep that rule: do not force one library into the other’s decorator story unless you are explicitly building a _separate_ experiment.

## Where to look in code

| Topic                                   | Location                                             |
| --------------------------------------- | ---------------------------------------------------- |
| Wire format, field definitions          | `src/harness/protocol.ts`                            |
| Trial loop, tinybench options, GC hooks | `@codefast/benchmark-harness` (`createRunAllTrials`) |
| Medians, IQR, markdown / JSONL          | `src/harness/report.ts`                              |
| Spawning children, writing `latest.*`   | `src/harness/run.ts`                                 |
| Scenario list / types                   | `src/scenarios/types.ts`                             |
| Shared graphs / fixtures                | `src/fixtures/`                                      |

## Commands (reminder)

See [README.md](./README.md) for `pnpm bench`, `BENCH_FAST`, `BENCH_FULL`, `BENCH_TRIALS`, `BENCH_VERBOSE`, and output paths.

When sharing numbers, paste the **Environment** block and the **Comparable scenarios** table (or the whole `latest.md`) so others can reproduce and judge noise from **IQR** and **fingerprint**.

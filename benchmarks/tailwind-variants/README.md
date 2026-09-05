# `@codefast/tailwind-variants` vs `tailwind-variants` · `class-variance-authority`

A tinybench suite for variant-styling APIs. `@codefast/tailwind-variants` is the subject; `tailwind-variants` is the API
it replaces, and `class-variance-authority` is the smaller-surface alternative people reach for instead.

> **Private benchmark suite.** Never published to npm. Run it rather than quoting it: every figure is one
> `pnpm bench:isolate` away.

**This is a first-party benchmark** — the same repository owns the library and the harness. Read it as a re-runnable
claim, not a neutral verdict. The measurement standard is the DI suite's
[`BENCH_GUIDE.md`](../di-inversify/BENCH_GUIDE.md); it is written against that suite, but the rules are the same,
because both suites share `@codefast/benchmark-harness`.

## Run it

```bash
pnpm bench
```

From the repo root, `pnpm bench` runs every suite; filter with
`pnpm --filter @codefast/benchmark-tailwind-variants bench`. Every run rebuilds `@codefast/tailwind-variants` first, so
it measures the working tree rather than a stale `dist/`.

| Command                               | What changes                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm bench`                          | Default profile, the default trial count                                               |
| `pnpm bench:fast`                     | Smoke profile — shorter windows. For "did I break it", not for a claim                 |
| `pnpm bench:full`                     | `--expose-gc` for every library                                                        |
| `pnpm bench:isolate`                  | Isolated profile — one subprocess per scenario, libraries interleaved (citable ratios) |
| `pnpm bench:list`                     | Prints the scenario inventory as JSON on stdout, measuring nothing                     |
| `pnpm bench:verbose`                  | Forwards each child's full stdout; progress streams on stderr either way               |
| `pnpm bench:serve`                    | Serves the run history from `bench-results/` in a browser                              |
| `pnpm bench:codefast`                 | The `@codefast/tailwind-variants` child process alone                                  |
| `pnpm bench:tailwind-variants`        | The `tailwind-variants` child process alone                                            |
| `pnpm bench:class-variance-authority` | The `class-variance-authority` child process alone                                     |
| `BENCH_MODE=<mode>`                   | Timing profile: `fast`, `default` or `full` — what the `bench:*` scripts set           |
| `BENCH_TRIALS=<n>`                    | Trials per scenario; the harness refuses anything below its minimum                    |
| `BENCH_ONLY=<id>,<id>`                | Restrict the run to these scenario ids                                                 |
| `BENCH_PORT=<n>`                      | Preferred port for `bench:serve`                                                       |

Every run writes a timestamped directory under `bench-results/` (git-ignored) holding `report.md`, `report.json` and
`observations.jsonl`, and mirrors the newest whole-suite run to `latest.md` / `latest.json` / `latest.jsonl`. A run
narrowed with `BENCH_ONLY` leaves `latest.*` alone, and its `report.json` `run` block says it was filtered.

## What it measures

Each configuration shape runs **twice** — once with `tailwind-merge` enabled and once without — and the shapes are the
scenario groups:

| Group            | What it exercises                                                                      |
| ---------------- | -------------------------------------------------------------------------------------- |
| `simple`         | a handful of variants, no slots                                                        |
| `complex`        | many variants plus compound variants and booleans                                      |
| `slots`          | multi-slot components                                                                  |
| `compound-slots` | compound variants that target slots                                                    |
| `extends`        | a config extending another                                                             |
| `create-tv`      | a resolver made by the `createTV` factory; the factory call itself is outside the loop |
| `extreme`        | a deliberately oversized variant matrix                                                |
| `extreme-slots`  | the same, with many slots                                                              |
| `repeat-simple`  | the same few `simple` selections rendered again and again                              |
| `repeat-slots`   | the same few `slots` selections rendered again and again                               |

Two more groups are controls rather than comparisons, and both declare `excludeFromAggregates` so they stay in the table
but out of the medians and geomeans:

- `define-only` — define a component without rendering it. An eager library compiles here and a lazy one defers to its
  first render, so the ratio is shown but stays off the aggregates.
- `first-render` — define a component and render it once (every slot, for a slot component); minus `define-only` it is
  the cost of the first render alone, and it stays off the aggregates for the same reason.

The `uncached-*` rows are controls too — `@codefast/tailwind-variants` only, with its resolution cache and
tailwind-merge's own cache switched off, so the plan walk and the merge itself stay measured, and each with-merge row
pairs with a without-merge one so their delta is the merge step on a miss. They live inside the `simple` and `slots`
groups rather than a group of their own, so `bench:serve` overlays them on the same chart as the cached rows they should
be read against; they stay off the aggregates by declaration.

The merge flag is always passed **explicitly** (`{ twMerge: true }` / `{ twMerge: false }`, from
`src/harness/bench-options.ts`) rather than left to each package's default, so the pair differ in implementation and not
in configuration. `class-variance-authority` has no merge option of its own, so its "with merge" rows call
`tailwind-merge` after `cva()` — the usual production pairing.

`class-variance-authority` has no slots, no extends and no factory; this suite ports only the `simple` and `complex`
groups to it, so it reads `—` on the rest, and the report counts only the rows a library actually measured.

## How it is put together

```
src/harness/run.ts          parent: rebuilds @codefast/tailwind-variants, one subprocess per library, merge, render
src/harness/config.ts       the three library configs
src/harness/bench-options.ts the explicit tv option bags every scenario passes
src/harness/list.ts         the bench:list entry
src/harness/serve.ts        the bench:serve entry
src/*-benches.ts            one child entry per library
src/scenarios/<library>/    that library's implementation of each shape
src/fixtures/               the variant configs, shared by every library
src/lib/tv-shims.ts         the one typing escape hatch, isolated here
```

`src/fixtures/scenario-parity.ts` holds each scenario's id, group and description once, and every side imports it — so a
row cannot silently drift between implementations. The fixtures are the same variant configuration objects for all three
libraries; only the call into the library differs.

`tv` and `cva` both infer strict literal types from their configuration, while the fixtures are deliberately widened.
`src/lib/tv-shims.ts` is where that relaxation lives, so the escape hatch is one file and not sprinkled through the
scenarios.

## Reading the output

Same rules as the DI suite: cite the aggregates rather than a row; `†` marks rows above the harness's throughput noise
ceiling, whose ratio moves between runs of the same build; `‡` marks cells whose per-trial IQR exceeded the harness's
noise fraction; a ratio inside the summary's parity band is parity, not a win or a loss.

Use `pnpm bench:isolate` (or `BENCH_ISOLATE=true`) for a citable cross-library ratio. It gives each scenario its own
subprocess and runs the libraries **interleaved** — every library measures a scenario before the next scenario starts,
rotating which goes first — so drift over the run no longer lands on whoever was scheduled last. The report's
Environment section names the policy it used. Without it, one process per library runs that library's whole suite and
there is nothing to interleave, so those ratios stay provisional.

## Documentation

- [`../di-inversify/BENCH_GUIDE.md`](../di-inversify/BENCH_GUIDE.md) — the measurement standard both suites hold a
  number to.
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for this suite.
- [`../../packages/tailwind-variants`](../../packages/tailwind-variants) — the library under test.
- [`../../internal/benchmark-harness`](../../internal/benchmark-harness) — the shared harness, its `BENCH_*` keys and
  report format.

## Contributing

See the repository [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## License

Released under the [MIT License](../../LICENSE).

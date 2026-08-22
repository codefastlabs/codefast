# `@codefast/tailwind-variants` vs `tailwind-variants` · `class-variance-authority`

A tinybench harness for variant-styling APIs. `@codefast/tailwind-variants` is the subject; `tailwind-variants` is the
API it replaces, and `class-variance-authority` is the smaller-surface alternative people reach for instead.

**This is a first-party benchmark** — the same repository owns the library and the harness. Read it as a re-runnable
claim, not a neutral verdict. The measurement standard is the DI suite's
[`BENCH_GUIDE.md`](../di-inversify/BENCH_GUIDE.md); it is written against that harness but the rules are the same,
because both suites share `@codefast/benchmark-harness`.

## Run it

```bash
pnpm bench
```

From the repo root: `pnpm bench` runs every suite; filter with
`pnpm --filter @codefast/benchmark-tailwind-variants bench`. The parent rebuilds `@codefast/tailwind-variants` first, so
a run measures the working tree.

| Command                               | What changes                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm bench`                          | Default profile, 3 trials per scenario                                                 |
| `pnpm bench:fast`                     | Smoke profile — shorter windows. For "did I break it", not for a claim                 |
| `pnpm bench:full`                     | `--expose-gc` for every library                                                        |
| `pnpm bench:isolate`                  | Isolated profile — one subprocess per scenario, libraries interleaved (citable ratios) |
| `pnpm bench:list`                     | List the scenarios without running them                                                |
| `pnpm bench:verbose`                  | Per-trial detail on stdout                                                             |
| `pnpm bench:serve`                    | Serves the run history in a browser                                                    |
| `pnpm bench:codefast`                 | One library's child process directly                                                   |
| `pnpm bench:tailwind-variants`        | ″                                                                                      |
| `pnpm bench:class-variance-authority` | ″                                                                                      |

Runs land in `bench-results/` (git-ignored): a timestamped `report.md` plus `observations.jsonl`, mirrored to
`latest.md` / `latest.jsonl`.

## What it measures

Eight configuration shapes, each run **twice** — once with `tailwind-merge` enabled and once without — for sixteen
scenarios in total:

| Shape            | What it exercises                               |
| ---------------- | ----------------------------------------------- |
| `simple`         | a handful of variants, no slots                 |
| `complex`        | many variants plus compound variants            |
| `slots`          | multi-slot components                           |
| `compound-slots` | compound variants that target slots             |
| `extends`        | a config extending another                      |
| `create-tv`      | the factory path rather than the bare `tv` call |
| `extreme`        | a deliberately oversized variant matrix         |
| `extreme-slots`  | the same, with slots                            |

The merge flag is always passed **explicitly** (`{ twMerge: true }` / `{ twMerge: false }`) rather than left to each
package's default, so the pair differ in implementation and not in configuration.

`class-variance-authority` has no slots, no extends and no factory, so it implements only `simple` and `complex` — four
of the sixteen rows. It reads `—` on the rest, and the report counts only the rows a library actually measured.

## How it is put together

```
src/harness/run.ts        parent: one subprocess per library, merge, render
src/harness/config.ts     the three library configs
src/*-benches.ts          one child entry per library
src/scenarios/<library>/  that library's implementation of each shape
src/fixtures/             the variant configs, shared by every library
src/lib/tv-shims.ts       the one typing escape hatch, isolated here
```

`src/fixtures/scenario-parity.ts` holds each scenario's id, group and description once, and every side imports it — so a
row cannot silently drift between implementations. The fixtures are the same variant configuration objects for all three
libraries; only the call into the library differs.

`tv` and `cva` both infer strict literal types from their configuration, while the fixtures are deliberately widened.
`src/lib/tv-shims.ts` is where that relaxation lives, so the escape hatch is one file and not sprinkled through the
scenarios.

## Reading the output

Same rules as the DI suite: cite the aggregates rather than a row; `†` marks rows fast enough that their ratio moves
between runs of the same build; `‡` marks cells whose per-trial IQR exceeded 5%; a ratio between 0.97× and 1.03× is
parity.

Set `BENCH_ISOLATE=true` for a citable cross-library ratio. It gives each scenario its own subprocess and runs the
libraries **interleaved** — every library measures a scenario before the next scenario starts, rotating which goes first
— so drift over the run no longer lands on whoever was scheduled last. The report's Environment section names the policy
it used. Without it, one process per library runs that library's whole suite and there is nothing to interleave, so
those ratios stay provisional.

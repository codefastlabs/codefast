# Results

What has actually been measured, separated by what each measurement can support. The method for each
is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run any of it with the recipes there.

**Environment.** Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64. `@codefast/di`
0.5.0-canary.8 · inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0. Isolated profile
(`BENCH_ISOLATE=1`), 3 trials, unless a row says otherwise.

**The machine was not quiet.** These figures come from a session that had been running benchmarks
back to back for over an hour. That matters more for the cross-library numbers than for the paired
ones, and it is why the suite aggregates below are marked provisional.

## What the current branch changed

Paired A/B of two builds of `@codefast/di`, one subprocess per side back to back, alternating which
side runs first each pass, medians of the per-pass ratios. Above 1.00× means the newer build is
faster.

### `refactor(di)` + `fix(di)`, against the previous release — 35 rows, 3 passes, default profile

| Row                                  |               Ratio |
| ------------------------------------ | ------------------: |
| `resolve-optional-hit`               |               1.52× |
| `transient-class-1-dep`              |               1.44× |
| `resolve-optional-miss`              |               1.40× |
| `lifecycle-post-construct-singleton` |               1.36× |
| `constant-resolve`                   |               1.35× |
| `singleton-class-1-dep`              |               1.34× |
| `to-resolved-3-deps`                 |               1.34× |
| `named-constant-get`                 |               1.29× |
| `scale-mid-transient-chain-32`       |               1.25× |
| `tagged-binding-resolve`             |               1.16× |
| `scale-deep-transient-chain-512`     |               1.10× |
| `lookup-bindings`                    |               1.08× |
| `realistic-graph-resolve-root`       |               1.07× |
| `circular-dependency-3`              |               1.06× |
| `realistic-graph-validate`           |               1.05× |
| `inspect-snapshot`                   |               1.03× |
| 17 further rows                      | 0.97–1.03× (parity) |
| `misconfigured-missing-binding`      |           **0.95×** |

The one row that got slower is an error path, and the cost is understood: `resolve` and `resolveAsync`
now share one alias-walk-and-diagnose routine, which puts the throw one frame deeper, and constructing
an error is dominated by capturing its stack. Moving the construction back to the throw site recovered
most of it. The remainder buys a single copy of that algorithm and is paid only when a resolve fails.

### `perf(di)`, against the refactor above — 7 rows, 5 passes, default profile

| Row                               |  Ratio |
| --------------------------------- | -----: |
| `container-level-activation-hook` |  1.15× |
| `fan-out-tree-depth-3-breadth-4`  |  1.00× |
| `realistic-graph-resolve-root`    |  1.00× |
| `constant-resolve`                |  1.01× |
| four further rows                 | parity |

The hooked transient-factory lane now takes the same `O(1)` cycle guard as its unhooked sibling, and
`LifecycleManager` caches the last token→hooks answer in front of its map. In an internal ablation —
same library, same process, hooked lane against unhooked — that halved the hook lane's cost per
resolve.

### Cross-check under `--expose-gc` — 4 rows, 3 passes

| Row                               | Ratio, previous release → current |
| --------------------------------- | --------------------------------: |
| `constant-resolve`                |                             1.38× |
| `container-level-activation-hook` |                             1.17× |
| `realistic-graph-cold-resolve`    |          1.02× (spread 0.81–1.18) |
| `dynamic-async-chain-8`           |                             0.98× |

The last two are the rows this library has historically lost. **Neither moved**, so no engine change
on this branch may claim them — see [Unsettled](#unsettled).

## Cross-library, measured interleaved

The only cross-library figures here that a suite run did not produce. Each library runs the same
scenario back to back within a pass, with the order rotated across four passes, so drift lands on all
four instead of on whoever the runner schedules last. `--expose-gc` on every library.

| Row                            | cf/inversify | cf/awilix | cf/tsyringe |
| ------------------------------ | -----------: | --------: | ----------: |
| `realistic-graph-cold-resolve` |        4.73× |     1.38× |   **0.99×** |
| `constant-resolve`             |        2.22× |     4.16× |      10.91× |

`realistic-graph-cold-resolve` against tsyringe is **parity**, and that is the honest reading of this
row. The same two libraries measured library-major in the suite read 1.28× — a 29% swing produced
entirely by run order.

That row is also slower **on purpose**. A cold iteration hands the collector ten bindings, each
carrying every field any binding kind declares, because one uniform V8 hidden class for every binding
is worth roughly 30% on hot resolve. Winning this row means paying for it everywhere else.

## Suite aggregates — provisional

Ratios against inversify over the 43 comparable scenarios, one run each.

| Profile                 | Win / parity / loss | Median | Geomean |
| ----------------------- | ------------------: | -----: | ------: |
| Isolated, default       |          42 / 1 / 0 |  2.22× |   2.71× |
| Isolated, `--expose-gc` |          43 / 0 / 0 |  3.04× |   4.13× |
| Shared process, default |          41 / 1 / 1 |  2.00× |   2.41× |

**Do not cite these as they stand.** The runner is library-major: every scenario for `@codefast/di`
runs before the first scenario for inversify, and awilix and tsyringe run minutes later still. Machine
drift over a run therefore lands on the ratio, always against whoever is scheduled later, and
`@codefast/di` is always first. Comparing the two GC-exposed runs above with the previous release's
published table shows the shape of it: `@codefast/di` and inversify moved a few percent, while awilix
and tsyringe — **byte-identical versions in both runs** — measured about 30% slower.

The isolated/shared difference is a real and separate effect: one process running all 51 scenarios
trains the resolver's call sites with every binding shape in the suite, and later scenarios pay for
earlier ones. That is what `BENCH_ISOLATE=1` exists for.

## Unsettled

**`dynamic-async-chain-8`.** Has read 0.87× of inversify at 5 trials on a quiet machine, and 1.48× in
a later isolated GC-exposed run against a newer inversify — while a paired A/B of the two builds in
that same profile puts them at 0.98×. Whatever moved the row, it was not this library. A claim needs a
paired measurement against the build being compared; a ratio against a competitor whose version also
changed measures both at once.

What is settled about that row is the mechanism, not the ratio: the async chain's resolution context is
pooled because a per-chain context survives its chain's microtask hops, so a freshly allocated one is
promoted out of the nursery and then collected the expensive way. An ablation that allocated per chain
cost 2.5× on this row. That is why the pool exists — not evidence that the row is won.

## Retracted

- **"The async-chain row is fixed and runs at 1.26×."** It came from a 3-trial run on a loaded machine,
  supported by a probe that loaded two libraries into one process — worth roughly 30% on async chains
  by this harness's own measurement. Withdrawn.
- **"43 / 0 / 0 with no losses."** True of one isolated GC-exposed suite run, and not a claim, because
  the run order inflates it by an amount this page cannot yet bound. Withdrawn pending an interleaved
  runner.

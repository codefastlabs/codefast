# Results

What has actually been measured, separated by what each measurement can support. The method for each
is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run any of it with the recipes there.

**Environment.** Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64. `@codefast/di`
0.5.0-canary.8 · inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0. Isolated profile
(`BENCH_ISOLATE=1`), 3 trials, unless a row says otherwise.

**The machine was not quiet.** These figures come from sessions that had been running benchmarks
back to back for hours, so the absolute throughputs are depressed. Ratios survive that: a paired run
measures both builds in the same window, and an interleaved run measures every library within the same
scenario. Absolute `hz/op` from this page is worth less than the ratios on it.

**Last full re-measure: 2026-07-31**, after the cascade-lane change (`3a0ad82e0`) and the root-frame
change (`65443f167`) landed, on a freshly rebuilt `dist`. 78 of the run's cells carried a per-trial
IQR above 5%, so single rows from it are read through the aggregates, not alone.

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

The last two are the rows this library has historically lost. **Neither moved in that cross-check**,
so no change up to that point could claim them. The async row was claimed later, by `3a0ad82e0` —
see [Where it loses](#where-it-loses).

## Suite aggregates

`BENCH_ISOLATE=1 BENCH_FULL=1`, one subprocess per scenario, libraries **interleaved with rotating
order** — every library measures a scenario before the next scenario starts. Ratios over the 43
scenarios each competitor implements.

| Competitor | Win / parity / loss | Median | Geomean |
| ---------- | ------------------: | -----: | ------: |
| inversify  |          43 / 0 / 0 |  2.21× |   2.92× |
| Awilix 13  |           8 / 0 / 0 |  3.25× |   3.83× |
| tsyringe 4 |           7 / 0 / 1 |  5.68× |   4.88× |

Group geomeans against inversify: production 7.60× · failure 6.77× · boot 5.33× · scope 4.67× ·
lifecycle 3.82× · realistic 3.70× · introspection 3.27× · micro 2.20× · fan-out 2.18× · scale 1.69× ·
async 1.67×.

The async group moved from 1.13× to 1.67× between the previous measurement and this one; that is the
cascade-lane change (`3a0ad82e0`), and it is what retires the suite's last loss against inversify —
see [Where it loses](#where-it-loses). The tsyringe column's single loss is `realistic-graph-cold-resolve`
at 0.94×, the row this page already documents as parity-by-design. inversify fails its own sanity
check on `scoped-binding-per-child` and is skipped there, so its comparable count stays 43.

**What interleaving cost, which is the point.** The same profile, library-major, read 43 / 0 / 0 at
median 3.04× and geomean 4.13× — and against awilix and tsyringe, medians of 5.14× and 6.41× rather
than 2.86× and 4.21×. Those extra wins were the scheduling: one library's whole suite ran minutes
before the next one's, so drift over the run landed on whoever went later, and `@codefast/di` always
went first. Nothing about the library changed between the two runs.

Two independent checks that the interleaved figures are the real ones: `realistic-graph-cold-resolve`
against tsyringe read **0.98×** in that session and 0.99× in a hand-rolled rotating probe, against
1.28× library-major; and awilix on that row read 1.42× and 1.38× in the probe, against 1.82×. The
2026-07-31 re-measure reads 0.94× on it, inside the same band.

The **shared-process** profile (no `BENCH_ISOLATE`) cannot interleave — one process per library runs
that library's whole suite — so its cross-library ratios stay provisional. It is also a different
measurement for a second reason: one process running all 51 scenarios trains the resolver's call sites
with every binding shape in the suite, and later scenarios pay for earlier ones.

## Where it loses

**`realistic-graph-cold-resolve` — 0.94× of tsyringe** in the 2026-07-31 interleaved run (0.98× in the
prior session, 1.15× shared-process — the row breathes around parity), and slower **on purpose**. A
cold iteration hands the collector ten bindings, each carrying every field any binding kind declares,
because one uniform V8 hidden class for every binding is worth roughly 30% on hot resolve. Winning this
row means paying for it everywhere else.

**`dynamic-async-chain-8` no longer belongs here.** The 0.75× documented below under Retracted was
real when measured, and the cascade-lane change (`3a0ad82e0`) is what removed it: async cycle
detection now reads its ancestors off the synchronous cascade instead of paying a settle-scoped path
per level. The 2026-07-31 interleaved GC-exposed run reads **1.73×** on the row and **1.67×** on the
async group's geomean; the per-level cost table and the paired A/B behind the change are in
[`packages/di/ARCHITECTURE.md`](../../packages/di/ARCHITECTURE.md). The pooled-context mechanism note
that used to live here survives inside that section.

## Retracted

- **"`dynamic-async-chain-8` — 0.75× of inversify."** True for the build it measured, retired by
  `3a0ad82e0`: the 2026-07-31 re-measure under the same interleaved GC-exposed profile reads 1.73×.
  Kept here because the surrounding claim — "no engine change on this branch may claim this row" —
  was the correct standard, and this retraction is the row finally meeting it.
- **"The async-chain row is fixed and runs at 1.26×."** It came from a 3-trial run on a loaded machine,
  supported by a probe that loaded two libraries into one process — worth roughly 30% on async chains
  by this harness's own measurement. Withdrawn.
- **"43 / 0 / 0 with no losses, median 3.04×."** Produced by a library-major isolated run. With the
  runner interleaved, the same profile reads 42 / 0 / 1 at median 2.23×: one row is a real loss and the
  aggregate is a quarter lower. Withdrawn and replaced above.

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

## 2026-08-01 — fairness fixes supersede every aggregate below

A fairness audit changed the harness and several fixtures, so **the suite aggregates on this page
predate the current bench and stand only as history** until the next full isolated re-measure:

- `circular-dependency-3` is now rendered but **excluded from all aggregates**: with the published
  fixture, codefast throws on its **3rd** factory entry while inversify 8.2.3 re-enters the user
  factory **1413 times** before its own error (reproduced, counters in the fixture) — the two sides
  never did comparable work per op. This row alone carried the `failure` group geomean and ~9% of
  the headline geomean.
- The isolated runner's rotation now rotates over the libraries that implement each scenario;
  before, filtering after rotation left `@codefast/di` in the first slot for 3 of every 4
  codefast-vs-inversify rows.
- Every inversify container now runs `{ jitless: false }` — its codegen resolvers, off by default
  as a CSP-safe fallback (verified against the installed `@inversifyjs/container` 3.1.3 source).
- `scoped-binding-per-child` was re-fixtured on the inversify side (per-request child + own
  singleton bind, its idiom for the same user story); it previously failed its own sanity check
  and silently dropped out. `to-self-binding` now injects its leaf on both sides; the inversify
  `resolution-patterns` closures hoist their options literals like the codefast side does.
- New row `realistic-graph-resolved-root`: the shared graph bound via `toResolved` /
  `toResolvedValue` — the shape both libraries compile ahead of time, so the row compares each
  library's best path rather than both on codefast's idiom.
- The report now names rows excluded from aggregates, pivot-only rows, and medians resting on
  fewer trials than the run scheduled.

**Re-measure under the fixed harness (2026-08-01, `BENCH_ISOLATE=1 BENCH_FULL=1`, interleaved,
3 trials): 44 / 0 / 0 against inversify, median 2.39×, geomean 2.90×.** Groups: micro 2.56× ·
realistic 2.35× · fan-out 2.23× · async 1.57× · lifecycle 4.21× · scope 8.20× · scale 1.82× ·
boot 7.00× · failure 1.73× · production 6.86× · introspection 3.49×. Against awilix 8 / 0 / 0
(median 3.31×); against tsyringe 7 / 0 / 1, the loss being `realistic-graph-cold-resolve` at
0.90× — the parity-by-design row, which read 1.01× in the same-day default-profile session (44
wins there too, median 2.21× / geomean 2.68×; the GC-exposed profile is the one that favors this
library, and both sessions carried ~50 cells with per-trial IQR above 5%, so the aggregates are
the reading).

Two rows say what the fairness fixes changed. The new best-vs-best row
`realistic-graph-resolved-root` reads **1.24×** (1.26× in the default-profile session) — when
inversify runs its compiled `toResolvedValue` path on the same graph, the gap narrows from ~2.4×
(the `toDynamic` row) to ~1.25×. And under `jitless: false`, `transient-class-1-dep` sits at
2.36× against ~2.7× before. The headline geomean landing back at 2.90× after removing the
circular row, the rotation bias and the jitless handicap means the old 2.92× was roughly right
for the GC-exposed profile — for partially compensating reasons, which is why the number needed
re-earning.

Engine changes on this date (late `.onActivation()` honored on memoized lanes, activation-need
memo evicted on rebind, scoped instances released on unbind) were paired-A/B checked old-vs-new
on six sensitive rows, three passes, alternating order: every row within noise of parity
(`fan-out-tree-depth-3-breadth-4` read 0.976× median with a 0.935–1.001 spread — re-check under
the full isolated protocol before release).

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

### `perf(di)` precomputed resolve options, against `main` — 65 rows, 5 passes, default profile

**Flat, and that is the correct reading rather than a failure to find something.** Median 0.9988×,
geomean 0.9997× across every row, after normalising each pass by that pass's competitor rows — the
other three libraries run identical code on both sides, so their ratios are the session's drift, and
five passes cannot split A-first from B-first evenly (3 vs 2). Their spread is also the noise floor
this session could see at all: p5 0.919× / p95 1.070×, over 305 paired cells.

No row moved because no row reached the changed code. A compiled plan already derives a
criteria-carrying dependency's options at compile time and captures them in its escape thunk; only
the interpreted path rebuilt them per hop. Nothing in the suite injected a criteria-carrying
dependency until `slot-injected-name-compiled` and `slot-injected-name-interpreted` were added with
this change — the `slot-*` rows request their criteria as a caller's argument, which never enters
that function.

**Two rows looked like signal and were not.** The 5-pass run put `realistic-graph-cold-resolve` at
1.10× and `slot-tag-zero-value` at 0.88×. Re-measured alone over 24 passes (build-swap, `BENCH_ONLY`
on the child entry) they read **0.96×** (min 0.858, max 1.175) and **1.01×** (min 0.803, max 1.319).
Neither survives, and `slot-tag-zero-value` never had a causal path to survive on. The same 24 passes
put the within-pass order effect on `realistic-graph-cold-resolve` at ~11% — larger than anything
being looked for.

**What the suite cannot see, counted instead.** Scavenges per 2M resolves under a 1 MB young
generation (`pnpm instrument:alloc`; method in
[`BENCH_GUIDE.md`](./BENCH_GUIDE.md#when-the-claim-is-about-allocation-count-allocations)):

| Shape                                            | main | this branch |
| ------------------------------------------------ | ---: | ----------: |
| `slot-injected-name-compiled`                    | 1260 |        1260 |
| `slot-injected-name-interpreted`                 |  870 |     **442** |
| criteria-free control (no row — it is a control) |  443 |         443 |

Freezing that memoized object — it is shared, and a constraint predicate is handed it — was A/B'd on
its own over six rows and twelve passes: every row within ±1.6% of parity, and `constant-resolve`,
which the freeze cannot reach, moved as much as the row that it can. Inside noise.

The interpreted lane lands exactly on the control, so the per-hop allocation is gone rather than
reduced. The compiled lane is untouched by this change and is the larger remaining target: every
criteria-carrying dependency escapes, and an escape copies its ancestor path and stack per call.

### `perf(di)` compile-time named selection, against the commit before it — 8 rows, 12 passes, default profile

| Row                              |                   Ratio |
| -------------------------------- | ----------------------: |
| `slot-injected-name-compiled`    | **4.06×** (3.877–4.246) |
| `slot-injected-name-interpreted` |                   0.98× |
| `slot-name-and-tag`              |                   0.98× |
| `realistic-graph-resolve-root`   |                   1.00× |
| four further control rows        |     0.99–1.01× (parity) |

A dependency escaped as soon as it carried any criterion, before anything tried to look it up. Since
`whenNamed` writes a slot name rather than a predicate, a name-only request is usually a plain hit in
the registry's named index — so four named constants stop escaping and compile to four `() => value`
thunks. Allocation on the same shape falls **1260 → 366** scavenges per 2M resolves, level with the
criteria-free plan of the same arity.

Two things make the row's size believable rather than suspicious. Every one of the twelve passes read
above 3.87×, on a row whose A/A spread is ±3%; and the mechanism predicts it — the row's whole body
was four escapes, each re-entering the resolver and copying an ancestor path and stack per call.

Before the change, a gate: the compiled lane was measured at **155.3 ns/op** against the interpreted
lane's **170.1 ns/op** on the same graph, 8 alternating runs. Had that read the other way, the correct
change would have been one line declining the plan, not this one.

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

- **"Group geomean: failure 6.77×."** Carried almost entirely by `circular-dependency-3`, whose
  two sides do incomparable work per op (3 vs 1413 factory entries before the throw — see the
  2026-08-01 note). With the row excluded the group reads ~1.2–1.5× from its two remaining rows.
  Withdrawn; the headline geomean quoted alongside it (2.92×) drops by roughly a tenth on the same
  data with the row removed.
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

# Results

What has actually been measured, separated by what each measurement can support. The method for each is in
[`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run any of it with the recipes there.

**Environment.** Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64. `@codefast/di` 0.5.0-canary.8 · inversify 8.2.3
· awilix 13.0.5 · tsyringe 4.10.0. Isolated profile (`BENCH_ISOLATE=true`), 3 trials, unless a row says otherwise.

**The machine was not quiet.** These figures come from sessions that had been running benchmarks back to back for hours,
so the absolute throughputs are depressed. Ratios survive that: a paired run measures both builds in the same window,
and an interleaved run measures every library within the same scenario. Absolute `hz/op` from this page is worth less
than the ratios on it.

**Last full re-measure: 2026-07-31**, after the cascade-lane change (`3a0ad82e0`) and the root-frame change
(`65443f167`) landed, on a freshly rebuilt `dist`. 78 of the run's cells carried a per-trial IQR above 5%, so single
rows from it are read through the aggregates, not alone.

## 2026-09-01 — the name lane folds into the tag lane

`whenNamed` became sugar for a reserved tag key (`slotName`), which deleted the registry's string-keyed named index, the
lookup cache's named lane, and `isNameOnlyOptions` — every single-criterion request now takes the one criterion lane,
with a dependency's folded criterion memoized on its slot so the interpreted dep path never pays the intern map per hop.
Two inlining fixes landed alongside because the first pass measured 0.65×–0.81× across the named rows: `TagKey.of()`'s
miss path moved out of the hot wrapper, and `singleCriterionOnlyOf`'s name half split into its own function. Measured
paired and alternating over three adjacent source-swap passes (`BENCH_ONLY` isolate runner, A first in each pair;
`constant-resolve` rode along as the drift control and read parity in all three).

| Row                              | B/A median |            B/A passes |
| -------------------------------- | ---------: | --------------------: |
| `slot-name-parent-owned`         |      1.120 | 1.113 · 1.149 · 1.120 |
| `named-constant-get`             |      1.090 | 1.117 · 1.071 · 1.090 |
| `slot-tag-shorthand-hoisted`     |      1.038 | 1.041 · 1.036 · 1.038 |
| `constant-resolve` (control)     |      0.995 | 0.995 · 1.020 · 0.994 |
| `slot-name-and-tag`              |      0.959 | 0.965 · 0.959 · 0.929 |
| `slot-injected-name-interpreted` |      0.782 | 0.805 · 0.780 · 0.782 |

The two hottest named rows gained 9–12% — the criterion lane's one-entry front plus the interned-criterion map beats the
old two-map string walk once `of()` inlines — and the tag shorthand row gained 4% from the smaller admission helper. Two
rows paid: `slot-name-and-tag` (−4%) now runs the multi-criterion union gather that the old name rule skipped, and
`slot-injected-name-interpreted` (−22%) alternates four names, defeating both one-entry fronts so each dep pays the
criterion-map path where it used to pay the string-map path. Both are codefast-only, `excludeFromAggregates` rows; the
aggregate-bearing rows moved up or stayed put.

One variant was tried and rejected: probing the own registry at the top of `taggedEntry` before the version-stamped walk
recovered about half of the interpreted row's loss but cost the two hottest rows roughly 25% in the same paired runs —
the larger body stopped inlining into `resolve()` — so the probe did not land.

**Review-fix addendum, same day.** The code-review pass on this branch changed the fold again: a request's name now
reads the intern cache through `TagKey.peek()`/`slotNameCriterionOf()` instead of minting (dynamic names no longer
retained for the process lifetime), the matcher compares the reserved criterion by identity through the same read, and
the criterion threads as `BindingTag | null` so "folded: none" is never re-folded. A bare `peek()` call on the fold path
first measured 0.62×–0.83× on the named rows; the shared one-entry name→criterion front recovered it. Final adjacent
pair against the pre-review branch state: `constant-resolve` 1.00 (control), `named-constant-get` 1.04,
`slot-name-parent-owned` 1.14, `slot-tag-shorthand-hoisted` 1.00, `slot-injected-name-interpreted` 1.02,
`slot-name-and-tag` 0.92 — the last buys back the documented "a hand-built criterion matches nothing" invariant on the
scan lane, on a codefast-only `excludeFromAggregates` row.

## 2026-08-17 — dropping the ES2025 `Map` upsert methods costs nothing, and pays on the named lane

The Node-floor change replaced `Map.prototype.getOrInsert` / `getOrInsertComputed` with the package's own
[`core/map-upsert`](../../packages/di/src/core/map-upsert.ts) at nine call sites — seven cold (registry index
insertions, lifecycle hook registration, module registration) and two on the named/tagged lookup lane. Measured paired
and alternating over four passes (source swap, `BENCH_ONLY` isolate runner, order swapped each pass), against a
four-pass A/A floor on the same rows in the same session. Both sides ran on Node 26.1.0 — the only runtime where the old
side runs at all, which is the point of the change.

Eight rows, picked to cover both lanes: the named and tagged lookup entries, a compiled slot resolve, a fresh
per-request child, bulk bind, cold module load, and container activation-hook registration.

| Row                               | A/B median |                    A/B passes | A/A median | A/A spread |
| --------------------------------- | ---------: | ----------------------------: | ---------: | ---------: |
| `named-constant-get`              |      1.139 | 1.076 · 1.137 · 1.140 · 1.162 |      0.987 |      0.043 |
| `bind-128-refined`                |      1.150 | 0.923 · 1.143 · 1.158 · 1.268 |      1.042 |      0.303 |
| `container-level-activation-hook` |      1.034 | 0.999 · 1.007 · 1.060 · 1.122 |      1.002 |      0.087 |
| `module-cold-from-modules`        |      1.021 | 0.999 · 1.007 · 1.036 · 1.039 |      0.995 |      0.120 |
| `tagged-binding-resolve`          |      1.011 | 0.997 · 1.008 · 1.014 · 1.032 |      0.992 |      0.023 |
| `multi-tag-slot-resolve`          |      1.011 | 0.996 · 1.010 · 1.011 · 1.065 |      1.018 |      0.051 |
| `fresh-child-tag-n4`              |      1.006 | 0.990 · 0.998 · 1.013 · 1.067 |      1.015 |      0.088 |
| `slot-injected-name-compiled`     |      1.000 | 0.973 · 0.999 · 1.002 · 1.008 |      0.999 |      0.037 |

**One row moves, and only one may be cited.** `named-constant-get` — the row that runs `namedEntry()`, so the row the
computed upsert sits on — clears its own floor by a wide margin: every A/B pass lands above every A/A pass, and the two
bands do not touch — both sides carry a per-trial IQR flag on this row, which is exactly what the floor is there to
bound. A local helper being faster than the platform method it replaces is consistent with a small JS function inlining
where a newly shipped builtin does not, and it is the direction that matters here: the floor change buys throughput
rather than paying for it. `bind-128-refined` reads 1.150 and must **not** be cited — its A/A floor spreads 0.303 across
passes, wider than the effect, so that row cannot resolve one. Everything else is parity inside its floor.

## 2026-08-16 — two open questions run to an answer, no engine change

Both items the 0.6.0 changelog and ARCHITECTURE left open as unrun measurements, on the same machine as the sections
below, default isolated profile, 3 trials per run.

### The `resolve-all-strategies-100` 0.95× reads as layout, and layout produces effects that size on this row

The experiment the `resolveAll`-tag-index changeset said had not been run: two semantically neutral perturbations of
`binding-select.ts` — moving `mostSpecificByTagCount` below `filterBindings` (V1), and appending a dead, never-called
function of the changed code's size (V2) — each measured paired against unperturbed HEAD over four alternating passes,
beside a four-pass A/A floor, on `resolve-all-strategies-100` and `-10` (driver: apply patch → `BENCH_ONLY` isolate run
→ revert, order swapped per pass).

| Comparison       | strategies-100 median |                        passes |
| ---------------- | --------------------: | ----------------------------: |
| A/A floor        |                1.0036 | 0.976 · 1.000 · 1.008 · 1.014 |
| V1 (reorder)     |                1.0154 | 0.969 · 1.015 · 1.016 · 1.040 |
| V2 (dead weight) |                1.0142 | 0.976 · 1.010 · 1.019 · 1.041 |

A layout-neutral edit moves a single pass by up to ±4% and a four-pass median by ~1.5%, against a floor whose own passes
spread ±2% — so an effect the size of the recorded 0.95× is within what code placement alone produces here, and there is
no consistent deficit on HEAD to recover: the row reads 1.03× against inversify in the current full-suite ledger. The
direct historical re-measure (`bbc111b` against its parent, on today's machine) is closed off twice over — the diff no
longer reverse-applies across the 0.6.0 source reorganisation, and that era's `src` does not build under HEAD's
`tsconfig` (`isolatedDeclarations` arrived later). Recorded as layout sensitivity; no engine change warranted. The claim
stands to be reopened only by a full run putting the row below parity consistently.

### A one-entry cache in front of `TagKey.of()` is worth ~7% inline, and the controls prove the swap was live

The 0.6.0 tag-interning changeset recorded that an inline `.of(v)` stays behind a hoisted criterion because every call
reads the intern map. A one-entry cache in front of it — `Object.is` on the raw value, so ±0 stay split and `NaN` hits
itself with no `internKeyFor` detour — measured paired over six alternating passes (source swap, isolate runner, 453
unit tests green under the patch first):

| Row                          | Median |                                        passes |
| ---------------------------- | -----: | --------------------------------------------: |
| `slot-tag-shorthand-inline`  | 1.0735 | 1.040 · 1.049 · 1.050 · 1.097 · 1.106 · 1.124 |
| `slot-tag-array-inline`      | 1.0672 | 0.971 · 1.061 · 1.066 · 1.068 · 1.104 · 1.120 |
| `slot-tag-shorthand-hoisted` | 0.9986 |                       0.984–1.017, all parity |
| `slot-tag-array-hoisted`     | 1.0021 |                         0.963–1.078, no trend |
| `tagged-binding-resolve`     | 1.0117 |                         0.989–1.097, no trend |
| `slot-tag-zero-value`        | 1.0175 |           0.799–1.139 — this row's usual band |

Eleven of the twelve target passes are positive on rows whose A/A floor is the suite's widest, while the hoisted
controls — which never call `.of()` in the loop — sit at parity, which doubles as the liveness proof for the source
swap. Kept: the inline gap the interning changeset left open narrows by about a third; hoisted stays the fast spelling,
as it must — it pays zero calls.

### The single-tag chain walk leaves ~2× on the table warm; the memo's fresh cost is bounded

ARCHITECTURE's open design question ("the fresh-vs-warm measurement is what would settle it"), run. Three isolated runs
put `slot-tag-parent-owned` at 25.3 / 26.7 / 26.8M hz/op against `slot-name-parent-owned` at 53.0 / 53.4 / 54.6M — the
memoized name lane answers the same parent-owned shape at **~2.1×** the unmemoized tag lane, stable across runs (both
cells carry >5% within-run IQR; the between-run medians do not move). The same session's `fresh-child` matrix: n1
default 4.32M · name 4.10M · tag 4.44M; n4 default 3.62M · name 3.16M · tag 2.84M hz/op — per-container memo state costs
~5–8% at duty cycle 1 and amortizes before N=4, consistent with the crossover at N≈2–3 the 2026-08-12 section recorded.
Settled: a tagged chain-walk memo shaped like `namedEntry` is justified; its implementation A/B should cite this section
as the baseline, with `fresh-child-tag-n1` as the must-hold row.

### The tagged chain-walk memo, landed — and the must-hold row is why it has a front entry

Two shapes were measured, six paired alternating passes each, same rows both times. The first (`taggedEntry` exactly
mirroring `namedEntry`) won every warm row and failed its own gate: `fresh-child-tag-n1` read **0.861** (all six passes
negative) — the inner-map allocation on a child that resolves once and dies. The second defers that map behind a
one-entry front, written only when a second distinct `(token, tag)` shape appears:

| Row                          | Mirror-only |                         Front-entry |
| ---------------------------- | ----------: | ----------------------------------: |
| `slot-tag-parent-owned`      |       1.903 |        **2.783** (2.725–2.945, 6/6) |
| `slot-tag-shorthand-hoisted` |       1.460 |                           **2.145** |
| `tagged-binding-resolve`     |       1.367 |      **1.978** — a head-to-head row |
| `fresh-child-tag-n4`         |       1.051 |                           **1.236** |
| `fresh-child-tag-n1`         |       0.861 | **0.981** (0.933–1.072) — must-hold |
| `slot-name-parent-owned`     |       1.004 |              0.999 — control, holds |
| `multi-tag-slot-resolve`     |       0.994 |              1.002 — control, holds |

The single-tag lane lands where the named lane sits, as the 2×-gap measurement above predicted, and the local constant
rows ride the same fast lane. Correctness is pinned by seven new tests in
`tests/unit/resolution/cache-invalidation.test.ts`: rebind/unbind invalidation in both request spellings, a parent-level
rebind observed from a child, a predicate beside the tag evaluated on every resolve, a late container-level activation
hook honored, and a warmed `+0` criterion refusing a `-0` request.

### Compile-time tagged selection lands where the named settlement predicted

The named settlement's rule, extended to the tagged lane now that the chain-walk memo gives the compiler a
path-independent lookup to ask: a dependency carrying one tag and nothing else, whose candidate carries no predicate and
whose slot the request satisfies, is settled at compile time instead of escaping. Two new rows mirror the named pair
(`slot-injected-tag-compiled` / `-interpreted` — four tagged constants injected into one class, plan compiled against
plan declined); measured paired over six alternating passes against the memo-and-`of()`-cache baseline:

| Row                             |    Median |                        passes |
| ------------------------------- | --------: | ----------------------------: |
| `slot-injected-tag-compiled`    | **4.333** | 4.125–4.608, all six positive |
| `slot-injected-tag-interpreted` |     1.005 |                       control |
| `slot-injected-name-compiled`   |     0.990 |                       control |
| `plan-deps-inlined`             |     1.008 |                       control |
| `realistic-graph-resolve-root`  |     1.008 |                       control |

The row goes 5.76M → 24.96M hz/op — landing exactly on `slot-injected-name-compiled` (~25M in the same session) and on
`plan-deps-inlined`'s criteria-free plan of the same arity, which is what "the criterion was the only reason it escaped"
predicts. `InstantiationPlanHost.lookupPathIndependentTaggedEntry` is **optional**, so a host predating it stays valid
and simply keeps escaping — the named twin's landing as a required member is what made that changeset a breaking one.
Eight tests mirror the named settlement's pins, plus one holding a two-tag dependency on the runtime path.

### A sync escape lends its seed stack instead of copying it, and identity is most of the win

`#compileEscapeThunk` minted `[...frames]` per call because the resolver pushes and pops on the array it is given — but
every sync lane pops what it pushes, so the owned array still holds exactly the seed when a call returns. The thunk now
lends one array, the root-stack rule one level down: a claimed or dirty return drops it and the next call mints.
Re-entering the same thunk without a genuine cycle turned out to be impossible — every route back to the same plan node
crosses a binding that is still in flight — so the claimed branch is a one-compare defence, not a hot case; a throwing
escape leaving the thunk reusable is pinned by a new test.

| Row                            |    Median |                         passes |
| ------------------------------ | --------: | -----------------------------: |
| `plan-escape-factory-dep`      | **1.409** |               1.331–1.460, 6/6 |
| `plan-escape-scoped-dep`       | **1.233** |                            6/6 |
| `plan-escape-optional-dep`     | **1.139** |                            6/6 |
| `plan-escape-hooked-dep`       | **1.124** |                            6/6 |
| `plan-escape-multi-dep`        | **1.107** |                            6/6 |
| `plan-deps-inlined`            |     1.004 |                        control |
| `realistic-graph-resolve-root` |     1.031 | its root plan does escape once |

Larger than an allocation alone explains, and the mechanism is the context pool: a pooled resolution context is reused
only for the array pair it already holds, so a fresh array per escape forced a fresh context per escape — the lent array
keeps its identity across calls and the pool starts hitting, the same mechanism the 0.5.0 root-pair change was worth
1.7× through. The async escape lane keeps copying: it lives across awaits, where "the call returned" and "the stack is
free" are different moments.

## 2026-08-12 — 35 coverage rows, their first baselines, and the defect one of them found

The suite went from 68 rows to 103. Every new row is `@codefast/di`-only, so **no published head-to-head figure moves**:
the same isolated interleaved profile reads 45 / 0 / 0 against inversify at median 2.23× and geomean 2.65× — inside the
band the fifteen runs before it set (median 2.13–2.30, geomean 2.62–2.73) — with the group geomeans unchanged too. The
run carried 76 cells above 5% per-trial IQR, so what follows are first baselines, not settled figures.

The rows exist because each names a branch no row executed. Two new groups hold them: `resolution` for the engine lanes
(compiled plans, escapes, the depth thresholds, the context pool, the accessor channel) and the existing groups for the
rest.

| Family                                               | First reading                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Plan escapes, against the no-escape control          | factory **7.2×** · scoped **4.0×** · optional **9.9×** · multi/hooked **13.2×**  |
| A compiled plan, against the same graph interpreted  | **4.37×** at depth 24, **2.30×** at depth 40                                     |
| Crossing the compiler's depth limit                  | **3.99×** for 1.67× the depth, where the interpreted lane pays **2.10×**         |
| The async cascade→branch ladder                      | 400 ns (no crossing) → 521 ns (one) → 725 ns (every level) ≈ **46 ns per level** |
| The context pool's miss (nested `container.resolve`) | **1.17×**, both cells noisy                                                      |
| Bind, per binding, over 128 tokens                   | 216 ns plain · 454 ns refined — the refinement is **2.1×** the registration      |
| `Container.create()` / `createChild()`, empty        | **122 ns** each, level with one another                                          |
| Teardown of 100 materialized singletons              | 9.0 µs, ~**90 ns** per deactivation                                              |

Two of those cross-check a figure this page already carried. `plan-deps-inlined` reads 24.5M hz/op against
`slot-injected-name-compiled`'s 24.8M — a plan whose four named dependencies were settled at compile time lands exactly
on the criteria-free plan of the same arity, which is what that change claimed. And the six `fresh-child-*` rows
reproduce an ad-hoc N-table measured independently of the suite. Per cycle of create, resolve N times, tear down —
no-options 210 → 258 ns, name-only 227 → 299 ns, single-tag 206 → 320 ns from N=1 to N=4: the tagged lane is the
**cheapest** at N=1 and the dearest by N=4, putting the crossover at **N≈2–3** where the ad-hoc measurement put N=2.

The 2×2 also separates the cliff from the depth. Compiled, going 24 → 40 levels costs **3.99×** for 1.67× the depth;
interpreted, the same step costs **2.10×** — near-linear, because that lane has no limit to cross. What the deep row
pays is the compiler stopping, not the depth.

### The defect one of them found, and its fix

`interpreted-class-chain-40` failed its own `sanity()` on the run that introduced it, because the engine was wrong on
that shape rather than slow: **a sync resolution deeper than `RESOLUTION_SET_THRESHOLD` that runs on the interpreted
path answered its first resolve and threw `CircularDependencyError` on every later one.** Reproduced outside the harness
on a 40-level transient class chain whose deepest binding carries an activation hook (three resolves:
`39 | THREW | THREW`); the same chain at depth 24 was fine, and at depth 40 with the plan compiled was fine.

The mechanism was the one [`packages/di/ARCHITECTURE.md`](../../packages/di/ARCHITECTURE.md) described as unobservable:
`enterResolutionPath` attaches a membership set built from the path once the path is deep enough, and returns it, so the
frames that pushed **before** the attach hold `undefined` and delete nothing on unwind. The set lives on the array, and
the resolver lends one array per resolver — so a later resolve read a set holding a drained path's names and refused any
token still in it. `[...names]` in the compiled lane's escape thunk is what hid it there, since a spread drops
symbol-keyed properties; nothing hid it on the interpreted lane. A sibling branch below the attach depth hit the same
set **within** one resolve, so this was never only a cross-resolve fault.

The fix drops a set whose size no longer matches the path's length and lets the next deep frame rebuild it. Paired A/B
of the two builds, source swapped per side, `BENCH_ONLY` through `bench:isolate`, **six** passes so old-first and
new-first balance 3/3, each pass's ratios divided by that pass's competitor median — inversify, awilix and tsyringe run
identical code on both sides, so their ratios are the session's drift and nothing else. Beside it, an **A/A control**:
the same rows, the same six-pass protocol, the same build in both slots.

| Row                               |   A/B |   A/A | A/B passes    |
| --------------------------------- | ----: | ----: | ------------- |
| `interpreted-class-chain-24`      | 0.965 | 0.971 | 0.926 … 0.985 |
| `container-level-activation-hook` | 0.988 | 0.994 | 0.974 … 1.025 |
| `scale-deep-transient-chain-512`  | 0.992 | 0.994 | 0.883 … 1.083 |
| `constant-resolve`                | 0.993 | 1.015 | 0.811 … 1.008 |
| `transient-class-1-dep`           | 1.003 | 0.993 | 0.982 … 1.064 |
| `realistic-graph-resolve-root`    | 1.013 | 1.016 | 0.946 … 1.031 |
| `scale-mid-transient-chain-32`    | 1.014 | 0.994 | 0.969 … 1.434 |
| `fan-out-tree-depth-3-breadth-4`  | 1.041 | 1.052 | 0.935 … 1.137 |

**The A/B is indistinguishable from the A/A, which is the whole claim.** Forty-eight paired cells each: median 0.9970
against the control's 1.0017, and every row's A/B median sits within 2.2 points of its own A/A median. The rows that
look like they moved reproduce that move on identical builds — `fan-out-tree-depth-3-breadth-4` reads 1.05 in the
control, `interpreted-class-chain-24` reads 0.97 there. Read the first table alone and the deep interpreted row, which
pays the added comparison on every frame without ever attaching a set, looks like a 3.5% cost; the control says that
number is the slot, not the change. `constant-resolve` swung to **1.224 in one A/A pass** on identical code, which is
what this suite's noise looks like when nothing at all has happened.

**Every pass carried a canary, rather than the swap being proven once afterwards.** `interpreted-class-chain-40` is a
row the old build cannot run: it fails its sanity check there and measures on the new build. The driver asserts both
that and the rebuilt `dist` marker on each of the twelve side-runs, and aborts the whole A/B if either disagrees with
the side it claims to be — because a swap that silently fails to land reports parity on every row, which is exactly what
this change would otherwise want to be true. All twelve passed. That row is absent from the table for the same reason it
works as a canary.

## 2026-08-01 — fairness fixes supersede every aggregate below

A fairness audit changed the harness and several fixtures, so **the suite aggregates on this page predate the current
bench and stand only as history** until the next full isolated re-measure:

- `circular-dependency-3` is now rendered but **excluded from all aggregates**: with the published fixture, codefast
  throws on its **3rd** factory entry while inversify 8.2.3 re-enters the user factory **1413 times** before its own
  error (reproduced, counters in the fixture) — the two sides never did comparable work per op. This row alone carried
  the `failure` group geomean and ~9% of the headline geomean.
- The isolated runner's rotation now rotates over the libraries that implement each scenario; before, filtering after
  rotation left `@codefast/di` in the first slot for 3 of every 4 codefast-vs-inversify rows.
- Every inversify container now runs `{ jitless: false }` — its codegen resolvers, off by default as a CSP-safe fallback
  (verified against the installed `@inversifyjs/container` 3.1.3 source).
- `scoped-binding-per-child` was re-fixtured on the inversify side (per-request child + own singleton bind, its idiom
  for the same user story); it previously failed its own sanity check and silently dropped out. `to-self-binding` now
  injects its leaf on both sides; the inversify `resolution-patterns` closures hoist their options literals like the
  codefast side does.
- New row `realistic-graph-resolved-root`: the shared graph bound via `toResolved` / `toResolvedValue` — the shape both
  libraries compile ahead of time, so the row compares each library's best path rather than both on codefast's idiom.
- The report now names rows excluded from aggregates, pivot-only rows, and medians resting on fewer trials than the run
  scheduled.

**Re-measure under the fixed harness (2026-08-01, `BENCH_ISOLATE=true BENCH_MODE=full`, interleaved, 3 trials): 44 / 0 /
0 against inversify, median 2.39×, geomean 2.90×.** Groups: micro 2.56× · realistic 2.35× · fan-out 2.23× · async 1.57×
· lifecycle 4.21× · scope 8.20× · scale 1.82× · boot 7.00× · failure 1.73× · production 6.86× · introspection 3.49×.
Against awilix 8 / 0 / 0 (median 3.31×); against tsyringe 7 / 0 / 1, the loss being `realistic-graph-cold-resolve` at
0.90× — the parity-by-design row, which read 1.01× in the same-day default-profile session (44 wins there too, median
2.21× / geomean 2.68×; the GC-exposed profile is the one that favors this library, and both sessions carried ~50 cells
with per-trial IQR above 5%, so the aggregates are the reading).

Two rows say what the fairness fixes changed. The new best-vs-best row `realistic-graph-resolved-root` reads **1.24×**
(1.26× in the default-profile session) — when inversify runs its compiled `toResolvedValue` path on the same graph, the
gap narrows from ~2.4× (the `toDynamic` row) to ~1.25×. And under `jitless: false`, `transient-class-1-dep` sits at
2.36× against ~2.7× before. The headline geomean landing back at 2.90× after removing the circular row, the rotation
bias and the jitless handicap means the old 2.92× was roughly right for the GC-exposed profile — for partially
compensating reasons, which is why the number needed re-earning.

Engine changes on this date (late `.onActivation()` honored on memoized lanes, activation-need memo evicted on rebind,
scoped instances released on unbind) were paired-A/B checked old-vs-new on six sensitive rows, three passes, alternating
order: every row within noise of parity (`fan-out-tree-depth-3-breadth-4` read 0.976× median with a 0.935–1.001 spread —
re-check under the full isolated protocol before release).

## What the current branch changed

Paired A/B of two builds of `@codefast/di`, one subprocess per side back to back, alternating which side runs first each
pass, medians of the per-pass ratios. Above 1.00× means the newer build is faster.

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

The one row that got slower is an error path, and the cost is understood: `resolve` and `resolveAsync` now share one
alias-walk-and-diagnose routine, which puts the throw one frame deeper, and constructing an error is dominated by
capturing its stack. Moving the construction back to the throw site recovered most of it. The remainder buys a single
copy of that algorithm and is paid only when a resolve fails.

### `perf(di)`, against the refactor above — 7 rows, 5 passes, default profile

| Row                               |  Ratio |
| --------------------------------- | -----: |
| `container-level-activation-hook` |  1.15× |
| `fan-out-tree-depth-3-breadth-4`  |  1.00× |
| `realistic-graph-resolve-root`    |  1.00× |
| `constant-resolve`                |  1.01× |
| four further rows                 | parity |

The hooked transient-factory lane now takes the same `O(1)` cycle guard as its unhooked sibling, and `LifecycleManager`
caches the last token→hooks answer in front of its map. In an internal ablation — same library, same process, hooked
lane against unhooked — that halved the hook lane's cost per resolve.

### Cross-check under `--expose-gc` — 4 rows, 3 passes

| Row                               | Ratio, previous release → current |
| --------------------------------- | --------------------------------: |
| `constant-resolve`                |                             1.38× |
| `container-level-activation-hook` |                             1.17× |
| `realistic-graph-cold-resolve`    |          1.02× (spread 0.81–1.18) |
| `dynamic-async-chain-8`           |                             0.98× |

The last two are the rows this library has historically lost. **Neither moved in that cross-check**, so no change up to
that point could claim them. The async row was claimed later, by `3a0ad82e0` — see [Where it loses](#where-it-loses).

### `perf(di)` precomputed resolve options, against `main` — 65 rows, 5 passes, default profile

**Flat, and that is the correct reading rather than a failure to find something.** Median 0.9988×, geomean 0.9997×
across every row, after normalising each pass by that pass's competitor rows — the other three libraries run identical
code on both sides, so their ratios are the session's drift, and five passes cannot split A-first from B-first evenly (3
vs 2). Their spread is also the noise floor this session could see at all: p5 0.919× / p95 1.070×, over 305 paired
cells.

No row moved because no row reached the changed code. A compiled plan already derives a criteria-carrying dependency's
options at compile time and captures them in its escape thunk; only the interpreted path rebuilt them per hop. Nothing
in the suite injected a criteria-carrying dependency until `slot-injected-name-compiled` and
`slot-injected-name-interpreted` were added with this change — the `slot-*` rows request their criteria as a caller's
argument, which never enters that function.

**Two rows looked like signal and were not.** The 5-pass run put `realistic-graph-cold-resolve` at 1.10× and
`slot-tag-zero-value` at 0.88×. Re-measured alone over 24 passes (build-swap, `BENCH_ONLY` on the child entry) they read
**0.96×** (min 0.858, max 1.175) and **1.01×** (min 0.803, max 1.319). Neither survives, and `slot-tag-zero-value` never
had a causal path to survive on. The same 24 passes put the within-pass order effect on `realistic-graph-cold-resolve`
at ~11% — larger than anything being looked for.

**What the suite cannot see, counted instead.** Scavenges per 2M resolves under a 1 MB young generation
(`pnpm instrument:alloc`; method in
[`BENCH_GUIDE.md`](./BENCH_GUIDE.md#when-the-claim-is-about-allocation-count-allocations)):

| Shape                                            | main | this branch |
| ------------------------------------------------ | ---: | ----------: |
| `slot-injected-name-compiled`                    | 1260 |        1260 |
| `slot-injected-name-interpreted`                 |  870 |     **442** |
| criteria-free control (no row — it is a control) |  443 |         443 |

**What should not have moved, measured.** The whole change — the memo, the freeze on it, and the two new rows — was
paired against the commit before it over ten rows and twenty passes, alternating:

| Row                                  |                 Ratio |
| ------------------------------------ | --------------------: |
| `slot-tag-zero-value`                | 1.0079× (0.753–1.150) |
| `mask-reject-wide-catalog`           | 1.0072× (0.637–1.659) |
| `lifecycle-post-construct-singleton` |               1.0049× |
| `slot-tag-shorthand-hoisted`         |               1.0031× |
| `constant-resolve`                   |               1.0027× |
| `slot-tag-array-hoisted`             |               1.0026× |
| `transient-class-1-dep`              |               1.0018× |
| `slot-tag-parent-owned`              |               1.0016× |
| `tagged-binding-resolve`             |               0.9975× |
| `named-constant-get`                 |               0.9941× |

Every row inside ±0.8%. The two spreads printed in full are why a cross-session reading of this suite is worth nothing:
on **identical code**, `mask-reject-wide-catalog` ranged 0.637–1.659 between passes. A full isolated run four hours
earlier had put those same rows at 0.79–0.82× against a run from that morning, which looked exactly like a regression in
the lane this change touches. Measured paired, in one window, there is none — and the shape of the "drop" was the
suite's noisiest rows, the ones [`BENCH_GUIDE.md`](./BENCH_GUIDE.md#measure-the-floor-before-you-set-the-threshold)
already names.

The interpreted lane lands exactly on the control, so the per-hop allocation is gone rather than reduced. The compiled
lane is untouched by this change and is the larger remaining target: every criteria-carrying dependency escapes, and an
escape copies its ancestor path and stack per call.

### `perf(di)` compile-time named selection, against the commit before it — 8 rows, 12 passes, default profile

| Row                              |                   Ratio |
| -------------------------------- | ----------------------: |
| `slot-injected-name-compiled`    | **4.06×** (3.877–4.246) |
| `slot-injected-name-interpreted` |                   0.98× |
| `slot-name-and-tag`              |                   0.98× |
| `realistic-graph-resolve-root`   |                   1.00× |
| four further control rows        |     0.99–1.01× (parity) |

A dependency escaped as soon as it carried any criterion, before anything tried to look it up. Since `whenNamed` writes
a slot name rather than a predicate, a name-only request is usually a plain hit in the registry's named index — so four
named constants stop escaping and compile to four `() => value` thunks. Allocation on the same shape falls **1260 →
366** scavenges per 2M resolves, level with the criteria-free plan of the same arity.

Two things make the row's size believable rather than suspicious. Every one of the twelve passes read above 3.87×, on a
row whose A/A spread is ±3%; and the mechanism predicts it — the row's whole body was four escapes, each re-entering the
resolver and copying an ancestor path and stack per call.

Before the change, a gate: the compiled lane was measured at **155.3 ns/op** against the interpreted lane's **170.1
ns/op** on the same graph, 8 alternating runs. Had that read the other way, the correct change would have been one line
declining the plan, not this one.

## Suite aggregates

`BENCH_ISOLATE=true BENCH_MODE=full`, one subprocess per scenario, libraries **interleaved with rotating order** — every
library measures a scenario before the next scenario starts. Ratios over the 43 scenarios each competitor implements.

| Competitor | Win / parity / loss | Median | Geomean |
| ---------- | ------------------: | -----: | ------: |
| inversify  |          43 / 0 / 0 |  2.21× |   2.92× |
| Awilix 13  |           8 / 0 / 0 |  3.25× |   3.83× |
| tsyringe 4 |           7 / 0 / 1 |  5.68× |   4.88× |

Group geomeans against inversify: production 7.60× · failure 6.77× · boot 5.33× · scope 4.67× · lifecycle 3.82× ·
realistic 3.70× · introspection 3.27× · micro 2.20× · fan-out 2.18× · scale 1.69× · async 1.67×.

The async group moved from 1.13× to 1.67× between the previous measurement and this one; that is the cascade-lane change
(`3a0ad82e0`), and it is what retires the suite's last loss against inversify — see [Where it loses](#where-it-loses).
The tsyringe column's single loss is `realistic-graph-cold-resolve` at 0.94×, the row this page already documents as
parity-by-design. inversify fails its own sanity check on `scoped-binding-per-child` and is skipped there, so its
comparable count stays 43.

**What interleaving cost, which is the point.** The same profile, library-major, read 43 / 0 / 0 at median 3.04× and
geomean 4.13× — and against awilix and tsyringe, medians of 5.14× and 6.41× rather than 2.86× and 4.21×. Those extra
wins were the scheduling: one library's whole suite ran minutes before the next one's, so drift over the run landed on
whoever went later, and `@codefast/di` always went first. Nothing about the library changed between the two runs.

Two independent checks that the interleaved figures are the real ones: `realistic-graph-cold-resolve` against tsyringe
read **0.98×** in that session and 0.99× in a hand-rolled rotating probe, against 1.28× library-major; and awilix on
that row read 1.42× and 1.38× in the probe, against 1.82×. The 2026-07-31 re-measure reads 0.94× on it, inside the same
band.

The **shared-process** profile (no `BENCH_ISOLATE`) cannot interleave — one process per library runs that library's
whole suite — so its cross-library ratios stay provisional. It is also a different measurement for a second reason: one
process running all 51 scenarios trains the resolver's call sites with every binding shape in the suite, and later
scenarios pay for earlier ones.

## Where it loses

**`realistic-graph-cold-resolve` — 0.94× of tsyringe** in the 2026-07-31 interleaved run (0.98× in the prior session,
1.15× shared-process — the row breathes around parity), and slower **on purpose**. A cold iteration hands the collector
ten bindings, each carrying every field any binding kind declares, because one uniform V8 hidden class for every binding
is worth roughly 30% on hot resolve. Winning this row means paying for it everywhere else.

**`dynamic-async-chain-8` no longer belongs here.** The 0.75× documented below under Retracted was real when measured,
and the cascade-lane change (`3a0ad82e0`) is what removed it: async cycle detection now reads its ancestors off the
synchronous cascade instead of paying a settle-scoped path per level. The 2026-07-31 interleaved GC-exposed run reads
**1.73×** on the row and **1.67×** on the async group's geomean; the per-level cost table and the paired A/B behind the
change were measured with the isolate suite and belong on this page, which is the per-run ledger for `@codefast/di` —
re-run `bench:isolate` to reproduce either.

## Retracted

- **"Group geomean: failure 6.77×."** Carried almost entirely by `circular-dependency-3`, whose two sides do
  incomparable work per op (3 vs 1413 factory entries before the throw — see the 2026-08-01 note). With the row excluded
  the group reads ~1.2–1.5× from its two remaining rows. Withdrawn; the headline geomean quoted alongside it (2.92×)
  drops by roughly a tenth on the same data with the row removed.
- **"`dynamic-async-chain-8` — 0.75× of inversify."** True for the build it measured, retired by `3a0ad82e0`: the
  2026-07-31 re-measure under the same interleaved GC-exposed profile reads 1.73×. Kept here because the surrounding
  claim — "no engine change on this branch may claim this row" — was the correct standard, and this retraction is the
  row finally meeting it.
- **"The async-chain row is fixed and runs at 1.26×."** It came from a 3-trial run on a loaded machine, supported by a
  probe that loaded two libraries into one process — worth roughly 30% on async chains by this harness's own
  measurement. Withdrawn.
- **"43 / 0 / 0 with no losses, median 3.04×."** Produced by a library-major isolated run. With the runner interleaved,
  the same profile reads 42 / 0 / 1 at median 2.23×: one row is a real loss and the aggregate is a quarter lower.
  Withdrawn and replaced above.

# `@codefast/di` — the engine's thresholds, re-examined — decision record

**Date:** 2026-09-19 · **Status:** research complete on `research/di-unified-engine`; two trades await the maintainer's
review · **Package:** `packages/di`

A record of what the resolution engine's six tuning constants actually decide, which of them a structural algorithm
removes, which stay and why, and what each step cost or won when it was measured. Nothing on this page is quoted from
`RESULTS.md`, `ARCHITECTURE.md` or `LEARNING.md`: every claim below was either read off the source at the commit named,
run as a test, or measured on this machine with the method stated beside the number.

---

## The question

The engine carries six compile-time constants that select an implementation by size: a plan is inlined to depth 32 and
generated as its own function after 32 runs, the cycle scan attaches a `Set` past depth 32, the alias fold gives up
after 32 hops, a multi-criterion request walks the tag indexes past 8 bindings, and a tag key's mask bit wraps after 32
keys. The engine's own invariant says a threshold may pick a data structure but never an answer. This record asks the
harder question: for each constant, is there one algorithm that wins on both sides of it, so the constant can go?

## What was verified by reading the source (commit `10b5f9db3`)

The eight starting claims, checked one by one against the code rather than the documents.

1. **The six constants exist where stated.** `PLAN_CODEGEN_THRESHOLD = 32` (`plan-codegen.ts`, exported),
   `PLAN_DEPTH_LIMIT = 32` (`instantiation-plan.ts`, module-private), `RESOLUTION_SET_THRESHOLD = 32`
   (`resolution-path.ts`, exported), `ALIAS_HOP_LIMIT = 32` (`binding-lookup-cache.ts`, exported),
   `MULTI_TAG_INDEX_THRESHOLD = 8` (`resolver.ts`, module-private), `MASK_WIDTH = 32` (`tag.ts`, module-private). One
   correction: the interpreted dependency loop `#resolveDeps` unrolls 0/1/n, not 0/1/2/3; the 0/1/2/3 unroll is the plan
   compiler's `#classNode`, and the async compiler's class node unrolls 1/2/n.
2. **The thresholds choose an implementation, not a semantics.** Held by construction on every side read, and now pinned
   by the differential property test (below) rather than by hand-written cases at each constant.
3. **The root-level collection memo hands out its own array.** `resolveRootCollection` returns `memo.values` as is;
   `#settleCollectionValues` leaves it unfrozen on purpose, and the public `ReadonlyArray` type is the only guard.
4. **The sync and async pipelines are written twice, plus a third cascade lane.** Thirteen method pairs in `resolver.ts`
   mirror each other (`resolveFromContext`/`resolveAsyncFromContext`, `#resolveDefaultEntry`, `resolve`,
   `#resolveBinding`, `#instantiate*`, `#resolveDeps`, `#resolveDep`, `resolveOptional`, `resolveAll`,
   `resolveRootCollection`, `#resolveCandidate*`, `#resolveTransientDynamic*FromContext`, `#get*InstantiationPlan`), the
   plan compiler mirrors six more, three `ResolutionContext` classes implement the same eight methods, and
   `buildConstraintContext` in `resolver.ts` re-implements `DefaultConstraintContext` in `context.ts`.
5. **`BindingChain` is one object in every role.** Sixteen public binding fields plus four private chain fields,
   `target`/`factory`/`value` typed `unknown`, eight builder interfaces, and `this as unknown as Binding` at the seam.
   The comment on the class states the intent — one hidden class for every binding, one allocation per bind — so this is
   a measured design, not an accident, and any change to it is a registration-path A/B before anything else.
6. **Chain versions are sums of monotonic counters.** `chainVersion()` sums `registry.version` up the chain and
   `#chainActivationVersion` sums `activationVersion`; every writer does `+= 1`, so a sum can never repeat a value it
   has already taken. Sound, and nothing pinned the monotonicity until the canary added below.
7. **Module-level mutable state:** the state epoch, the binding id counter, the ambient container pair, the codegen
   availability flag and count, the tag key counter with the slot-name peek cache, the graph's token key sequence —
   plus, not in the starting list, the introspector's per-reader `WeakMap` caches and the options memo written onto slot
   objects through symbols.
8. **No differential test and no coverage floor.** `vitest.config.ts` declared no `thresholds`; the lane tests pinned
   behaviours one case at a time.

### Findings the reading added

- **The number behind `RESOLUTION_SET_THRESHOLD` was measured on a lane that no longer uses it.** The changelog entry
  that set it to 32 quotes an _async_ chain at depths 16–128. The async lane has since moved to
  `extendResolutionBranch`, a linear scan over its branch prefix with no `Set`; the constant now serves only the
  synchronous lanes, where it has not been re-measured.
- **Cycle detection is inconsistent across binding kinds for a nested `container.resolve()`.** A `toDynamic` binding
  whose factory calls `container.resolve(itsOwnToken)` reports `CircularDependencyError`, because its guard is a flag on
  the binding. A class binding in the same position recurses until the stack overflows, because its guard scans a
  resolution stack the nested call does not share. The architecture document's stated reason for not using the flag
  everywhere — "a per-binding flag cannot name the path in the error" — is refuted by the flag lane itself, which names
  the path from the stack and reads membership from the flag.
- **The escape seed is the one thing a flag cannot replace on its own.** A compiled plan pushes no frames for the nodes
  it inlines; an escape re-enters the runtime with a _copy_ of the static ancestors, and the runtime scan over that seed
  is what catches an escaped factory cycling back into an inlined ancestor. A flag on the binding would miss that cycle
  unless the escape stamps its seeded ancestors on entry and clears them on exit — which costs the same order of work as
  the scan it replaces, and is the design PoC 2 measures.

## Safety net: the differential property test

`tests/integration/resolution-lanes-differential.test.ts`, with `tests/integration/support/lane-differential.ts`,
generates random graphs with `fast-check` — kinds, scopes, tags, members, `whenParentIs` predicates, siblings that
displace, cycles, misses — and linear chains up to depth 48, and resolves each through every entry point: the
interpreted lane (`resolve(root, {})`, which never takes a plan), forty options-less resolves that cross the
interpreted, closure and generated tiers in order, `resolveOptional`, `resolveAll`, the same from a per-request child,
and the four async entry points. Every lane's outcome is reduced to one snapshot — values by structure with the sharing
pattern numbered, errors by class and message — and every lane is held to the reference lane's snapshot.

**Result on the unmodified engine (commit `10b5f9db3`): three divergences, all real, all fixed on this branch before any
threshold was touched.**

1. **A wrong value on the async interpreted lane.** Siblings start concurrently on one branch and the first appends its
   frame in place, so a later sibling's selection read that frame as its parent: `whenParentIs(Root)` on the second
   dependency of an async class chose a different binding than the sync lane and the async plan lane did. Pinned by
   `tests/unit/resolution/resolver-selection-and-async.test.ts`. The property found it only once a third generator
   targeted the sibling shape — the general generator produced it about once in two thousand graphs.
2. **A dynamic factory ran twice on a self-cycle.** Only the options-less sync lane and the async cascade lane flagged a
   dynamic binding while its factory ran; the options lane, the async branch lane and both instantiate switches called
   it bare. A factory resolving its own token from its synchronous prefix ran again before the flag caught it, so the
   reported cycle gained a hop (`t → t → t`) and the factory's side effects ran twice. Pinned by
   `tests/unit/resolution/in-flight-invariants.test.ts` on all four lanes.
3. **A child misdiagnosed a miss.** The "bindings exist but none matched" check read the child's own registry, so a
   per-request child threw `TokenNotBoundError` ("did you forget `container.bind`") where its parent threw
   `NoMatchingBindingError` for the same request. Pinned by `tests/unit/resolution/resolver-owner-routing.test.ts`.

Two more divergences the harness reported are contracts, not defects, and the harness encodes them: an options-less
`resolveAll` takes every slot where `resolve` takes the default one, and when two siblings both fail the async lane
reports whichever settles first where the sync lane reports the first declared. The chain property, which has no sibling
races, holds errors to verbatim equality; the graph properties require the async lane to fail where the sync lane fails.

## Baseline measured on this machine

Run `2026-09-19T13-37-14-179Z` under `benchmarks/di/bench-results/` (git-ignored; reproduce with
`BENCH_TIER=contract pnpm di:bench:isolate`): default profile, no `--expose-gc`, one subprocess per scenario, libraries
interleaved with rotating order, 3 trials, 101 contract rows × 7 libraries, 13m22s wall on the same Apple M3 Max and
Node 26.1.0 as `RESULTS.md`, over commit `10b5f9db3` (0.10.1). 137 rows sat above the ~30M ops/s ceiling and 213 cells
carried a per-trial IQR above 5%, so this is a direction check on the aggregates, not a re-publication of the ledger.

| Competitor     | Win / parity / loss | Median | Geomean | `RESULTS.md` median / geomean |
| -------------- | ------------------: | -----: | ------: | ----------------------------: |
| InversifyJS 8  |          90 / 0 / 1 |  3.14× |   4.58× |                 3.23× / 4.91× |
| Awilix 13      |          35 / 2 / 1 |  4.95× |   4.98× |                 4.97× / 4.79× |
| tsyringe 4     |          35 / 1 / 7 |  3.99× |   3.20× |                 4.61× / 3.83× |
| Brandi 5       |          28 / 0 / 1 |  12.7× |   9.67× |                 14.4× / 10.9× |
| Ditox 3        |         27 / 5 / 12 |  1.20× |   1.42× |                 1.06× / 1.39× |
| injection-js 2 |          22 / 1 / 8 |  1.45× |   1.40× |                 1.49× / 1.43× |

The shape of the ledger reproduces: every aggregate is within the band the guide says a single pass can move, the
reliable losses are the same rows the ledger names — `bind-128-plain` 0.43× ditox, `resolve-all-cold-100` 0.31× and
`resolve-all-cold-10` 0.40× tsyringe, `materialize-100-singletons` and `unbind-all-100-singletons` 0.43× and 0.35×
ditox, `realistic-graph-class-cold-resolve` 0.54× ditox, `accessor-injection-construct` 0.26× inversify, the
missing-binding throw against four rivals — and `resolve-all-async-8` did not read as a reliable loss here (it sits
above the ceiling). What did not reproduce as stated: the ledger's "two rows" against inversify is one reliable row in
this pass, and tsyringe wins seven rows rather than six.

## Decisions, one per constant

### `ALIAS_HOP_LIMIT` — removed

**Decision.** The memo's alias fold detects a cycle exactly and declines with `null`, which the full resolve loop then
reports; the cap is gone. The origin and the current token are compared by hand and a `Set` holds only the tokens
between them, so a one-hop alias — the common shape — allocates nothing, and a chain of any length folds.

**Why it was self-inflicted.** The cap was a cycle guard for a loop that already had an exact one a few lines away in
`#requireBinding`; it existed to avoid allocating a `Set` on the memo-miss path, which is cold by definition.

**Cost, measured.** `pnpm di:bench:ab`, full profile, isolated, two alternating experiments, the working tree against
`HEAD` with every other change already committed, so the fold is the only difference between the sides.

| Row                            | Median ratio (new ÷ base) | Per-experiment | Side spread |
| ------------------------------ | ------------------------: | -------------: | ----------: |
| `alias-chain-3`                |                    1.007× |  1.012 · 1.002 |       ±3.5% |
| `alias-parent-owned-terminal`  |                    0.999× |  1.002 · 0.997 |       ±3.8% |
| `to-alias-redirect`            |                    1.004× |  1.002 · 1.007 |       ±5.1% |
| `alias-cycle-detected`         |                    0.989× |  1.000 · 0.977 |      ±15.1% |
| `realistic-graph-cold-resolve` |                    0.981× |  0.979 · 0.982 |      ±28.8% |
| `fresh-child-default-n1`       |                    0.995× |  0.979 · 1.011 |       ±3.4% |

Every row is inside its own spread, and none has a causal path to the change: the fold runs once per token per chain
version, on a memo miss, and a non-alias token takes exactly the lookup it took before. The cold row reads down on both
experiments by less than a tenth of its spread; it binds no alias and is listed because a cold container is where a memo
miss happens at all.

### `RESOLUTION_SET_THRESHOLD` — removed, with the scan it switched

**Decision.** Every synchronous lane detects a cycle by one mechanism: the `inFlight` flag on the binding, set when a
level enters the path and cleared when it leaves. There is no scan, no `Set`, and no depth at which anything changes.
The async branch lane keeps its linear scan over the branch prefix (`extendResolutionBranch`), because async code
interleaves and a flag cannot name the branch a binding is on; that is a structural fact about the lane, not a size.

**Why the flag is exact.** Synchronous code does not interleave, so "flagged" is "on the synchronous call stack's
resolution path" — the same argument the engine already made for the transient-dynamic lane and the cascade lane. The
architecture document's reason for not extending it — that a flag cannot name the path in an error — did not hold: the
flag lane always named the path from the frames and read membership from the flag.

**The one thing the flag alone could not see, and how it sees it.** Two paths are handed to a synchronous call without
any synchronous frame having pushed them: the static ancestors a compiled plan seeds into an escape, and the branch
prefix an async level hands a factory's synchronous `ctx.resolve`. Both are now _marked_ before the call and unmarked
after — `enterSeededPath` / `leaveSeededPath` — through a link from each resolver-built frame to its binding, kept under
a symbol so the public frame shape is unchanged. Marking a seed is O(seed) field writes where the scan was O(seed) reads
per level entered below it, and where the `Set` was an allocation plus O(seed) hash inserts once the seed crossed 32.

**The lesson the first attempt taught.** Marking must be idempotent. A binding a seed finds already flagged was flagged
by an enclosing synchronous frame that is still running — the async lane's own factory prefix, or a cascade level's —
and that is the same fact stated once already, not a cycle. The first version threw on it and the differential test
failed on the fourth random graph: false cycles on every async level whose factory made a synchronous call. Marking now
leaves such a binding as it found it, on the way in and on the way out, and a genuine cycle is still reported where the
path re-enters the binding, which is where the frames to name it are.

**Behaviour that changed, all in the direction of the flag lane.** A class or `toResolved` binding whose constructor or
factory resolves its own token through `container.resolve()` — a nested top-level resolve on a fresh stack — now reports
`CircularDependencyError` where it recursed to a stack overflow, and a singleton constructing itself that way is
reported instead of being constructed twice. A synchronous `ctx.resolve` of an async ancestor from a continuation is
caught at the first re-entry rather than one hop late. The differential test holds every lane to the same answer across
all of it.

**Cost, measured — and bisected.** Paired A/B, full profile, isolated, alternating experiments, each side rebuilt from
its source. Rows were sorted before measuring into those with a causal path to the change and canaries without one.

_Full PoC 2 against `HEAD` (2 experiments, then the suspect rows again with 4):_

| Row                                 |          Median | Experiments agree | Reading                                        |
| ----------------------------------- | --------------: | ----------------: | ---------------------------------------------- |
| `interpreted-class-chain-40`        |          1.232× |               2/2 | flag beats the `Set` on the interpreted tail   |
| `interpreted-class-chain-24`        |          1.126× |               2/2 | flag beats the scan below the threshold        |
| `plan-class-chain-40`               |          1.295× |               2/2 | seed marking + flag tail beat the `Set`        |
| `plan-escape-hooked-dep`            |          1.086× |               2/2 | the hooked callee below the escape got cheaper |
| `plan-escape-factory-dep`           | 0.959× · 0.953× |         2/2 · 4/4 | causal: four escapes each marking one ancestor |
| `plan-deps-inlined`                 | 0.886× · 0.913× |         2/2 · 4/4 | **no causal path** — a plan with zero escapes  |
| `nested-context-resolve-in-factory` | 0.879× · 0.901× |         2/2 · 4/4 | **no causal path** — the lean dynamic lane     |
| `scale-mid-transient-chain-32`      | 0.940× · 0.901× |         2/2 · 4/4 | **no causal path** — same lane, 32 deep        |
| `scale-deep-transient-chain-512`    |          1.017× |               1/2 | same lane, 512 deep: flat                      |
| `resolve-all-async-8`               | 1.767× · 1.709× |         2/2 · 4/4 | **no causal path** — an unexplained win        |
| `transient-class-1-dep`             |          0.991× |               2/2 | plan lane control: flat                        |
| warm/child/async canaries (8 rows)  |   0.99× – 1.04× |                 — | inside spread                                  |

Three rows without a causal path moved by ten percent in the same direction in every experiment, and one moved by
seventy. That is the shape the bench guide names as an unrelated regression — a change to a function several rows'
optimized code inlines — and it was bisected rather than explained away.

_Probe V1 — the core swap alone: the flag in `#resolveBinding` and the accessor host, the `Set` gone, no frame link, no
seed marking anywhere (2 experiments against `HEAD`):_

| Row                                 | V1 median | So the movement in the full PoC came from…         |
| ----------------------------------- | --------: | -------------------------------------------------- |
| `interpreted-class-chain-40`        |    1.222× | the core swap                                      |
| `plan-class-chain-40`               |    1.429× | the core swap (higher still: no seed to mark)      |
| `plan-deps-inlined`                 |    0.906× | the core swap — still there without any seed       |
| `nested-context-resolve-in-factory` |    1.023× | **not** the core swap: the frame link or the seeds |
| `scale-mid-transient-chain-32`      |    1.004× | **not** the core swap: the frame link or the seeds |
| `plan-escape-factory-dep`           |    0.968× | inconclusive at ±14%                               |
| `resolve-all-async-8`               |    1.709× | the core swap — on a path the swap never executes  |

_A/A — `HEAD` against `HEAD`, the instrument's own floor on the suspect rows (2 experiments):_

| Row                                 | A/A median | A/A experiments |                               Reading of the PoC's movement |
| ----------------------------------- | ---------: | --------------: | ----------------------------------------------------------: |
| `plan-deps-inlined`                 |     0.985× |   1.037 · 0.932 |          ±7% floor; the PoC's −9% is inside twice the floor |
| `nested-context-resolve-in-factory` |     1.012× |   0.982 · 1.041 |        ±4% floor; the PoC's −10% is beyond it, V1 was clean |
| `scale-mid-transient-chain-32`      |     0.922× |   0.896 · 0.948 | **±10% floor on identical source**; the PoC's −10% is noise |
| `resolve-all-async-8`               |     1.008× |   0.991 · 1.024 |                 ±2% floor; the PoC's +71% is build-to-build |

Both `plan-deps-inlined` and `nested-context-resolve-in-factory` sit above the ~30M ops/s ceiling the bench guide draws,
where it says ratios move by more than ten percent between runs of one build; the two-experiment floors above are
tighter than that guide's own experience and are read as lucky, not as licence.

_The fix commits, located on the async row (`dc08b214d` → `HEAD`, 2 experiments):_ `resolve-all-async-8` 0.945×,
`dynamic-async-chain-8` 0.994×, `async-fanout-concurrent-8` 0.997×, `nested-context-resolve-in-factory` 0.996×. The
day's three fixes cost the async collection about five percent — one flag write and clear per member, in a helper — and
are not the +71%.

_The +71%, probed outside the harness._ A standalone script running the same eight-member `resolveAllAsync` shape
against each side's `dist` reads the two builds **equal** without forced collections (1.04M against 1.05M ops/s) and the
working tree 8–17% ahead with a forced `gc()` every 1, 50 or 5 000 iterations. Under `--trace-deopt`, one run of either
build showed fifteen optimized functions along the async collection path marked for deoptimization at once, reason
"embedded weak objects cleared" — a single collection dropping an object their optimized code held weakly — and the next
run of the same build showed none. The harness's full profile forces a collection every few samples, which is the
condition that turns such a mark from a one-off into a cycle; the standalone probe did not reproduce the harness's
ratio. **Recorded as an unexplained, reproducible movement in the harness, not claimed as a win of this change.**

_Probe V2 could not run:_ the script that built it asserted against an import line the formatter had since wrapped. The
split it was to make — frame link against seed marking — was overtaken by the decision below to change neither the
frame's shape nor the escape's reads.

**Variant B, the one measured for the decision.** The frame keeps its shape: the link from a resolver-built frame to its
binding lives in a `WeakMap` read only when a seed is marked; an escape marks the ancestor bindings the compiler already
held, with no lookup at all; an async level reads its ancestors' bindings once and caches them beside its prefix.
Measured against `HEAD`, 2 experiments, the same twenty-one rows:

| Row                                  | Variant B median | Experiments | Reading                                                           |
| ------------------------------------ | ---------------: | ----------- | ----------------------------------------------------------------- |
| `plan-class-chain-40`                |           1.615× | 1.70 · 1.53 | the seed marked once, the tail flagged, no `Set`                  |
| `interpreted-class-chain-40`         |           1.303× | 1.29 · 1.32 | flag against `Set`                                                |
| `interpreted-class-chain-24`         |           1.085× | 1.08 · 1.09 | flag against scan                                                 |
| `plan-class-chain-24`                |           1.057× | 1.00 · 1.11 | inside ±22% spread                                                |
| `accessor-injection-construct`       |           1.029× | 1.03 · 1.03 | flag in the accessor host                                         |
| `plan-escape-factory-dep`            |           0.921× | 0.92 · 0.92 | **worse than the symbol version** (0.953×): two calls per escape  |
| `plan-escape-multi-dep`              |           0.962× | 0.97 · 0.96 | inside ±15% spread                                                |
| `plan-escape-optional-dep`           |           1.014× | 1.04 · 0.99 | flat                                                              |
| `plan-escape-hooked-dep`             |           1.014× | 1.05 · 0.98 | flat (was 1.086×)                                                 |
| `plan-deps-inlined`                  |           0.883× | 0.91 · 0.85 | no causal path; above the ceiling                                 |
| `nested-context-resolve-in-factory`  |           0.891× | 0.89 · 0.89 | no causal path; above the ceiling; unchanged by removing the link |
| `scale-mid-transient-chain-32`       |           0.842× | 0.88 · 0.81 | no causal path; A/A floor ±10%                                    |
| `realistic-graph-class-resolve-root` |           0.771× | 0.91 · 0.63 | bimodal sides (17M / 26M), ±45% spread — unreadable               |
| `production-http-handler`            |           0.890× | 0.99 · 0.79 | ±27% spread — unreadable                                          |
| `realistic-graph-resolve-root`       |           0.984× | 0.99 · 0.98 | flat                                                              |
| `resolve-all-async-8`                |           1.715× | 1.70 · 1.73 | the same unexplained movement                                     |
| six remaining canaries               |    0.97× – 1.03× |             | flat                                                              |

Removing the frame link changed nothing on the two fast rows it was suspected of moving, so that suspicion is withdrawn;
what it did was make the one-ancestor escape dearer — marking through a helper call and a loop costs more than one
symbol load did. The machine also grew noisier over the hour these runs took (a 26M/17M bimodal base on the class graph,
a ±27% spread on the http handler), which is what the four-experiment A/A below is for.

_A/A again, four experiments, on a quieter machine:_ `plan-deps-inlined` 0.998× (experiments −2.1% … +0.8%),
`nested-context-resolve-in-factory` 0.986× (−2.3% … +1.2%), `scale-mid-transient-chain-32` 1.002× (−1.8% … +3.9%),
`plan-escape-factory-dep` 0.981× (−4.9% … +6.9%). With four experiments the instrument resolves two percent on the two
fast rows. Their consistent −10% under every variant of this change is therefore real for these builds, and it sits on
code the rows never execute: the guide's "unrelated regression", and the thing this record now has to either explain or
carry as a cost.

**Variant C — the one-ancestor escape written out.** A plan root's own opaque dependency has one ancestor and is the
common escape, so its thunk marks that one binding with a flag read and at most two writes: no helper, no loop. Against
`HEAD`, 2 experiments:

| Row                                 | Variant C median | Experiments | Reading                                        |
| ----------------------------------- | ---------------: | ----------- | ---------------------------------------------- |
| `plan-escape-factory-dep`           |           0.992× | 1.00 · 0.98 | **the escape cost is gone**                    |
| `plan-escape-optional-dep`          |           1.080× | 1.05 · 1.11 | the callee below the escape got cheaper        |
| `plan-escape-hooked-dep`            |           1.056× | 1.06 · 1.05 | same                                           |
| `plan-escape-multi-dep`             |           0.982× | 1.01 · 0.96 | inside ±15% spread                             |
| `plan-class-chain-40`               |           1.462× | 1.70 · 1.22 | seed marked once, tail flagged                 |
| `interpreted-class-chain-40`        |           1.254× | 1.21 · 1.30 | flag against `Set`                             |
| `realistic-graph-resolve-root`      |           0.972× | 0.99 · 0.95 | inside spread                                  |
| `transient-class-1-dep`             |           0.991× | 0.99 · 0.99 | flat                                           |
| `plan-deps-inlined`                 |           0.894× | 0.90 · 0.89 | **the unexplained fast-row cost, still there** |
| `nested-context-resolve-in-factory` |           0.875× | 0.85 · 0.89 | **same**                                       |

What the three variants agree on: the deep and escaping paths win by a quarter to a half; the one causal cost is priced
away by writing out the common shape; and two rows above the throughput ceiling, on code paths this change never
touches, read ten percent down at a floor of two.

_The two fast rows, probed outside the harness._ A standalone loop of the `plan-deps-inlined` shape — a child container,
a root class with four inlined transient leaves, resolved three million times — reads `HEAD` and variant C **equal**
(58.7M and 60.7M against 58.7M and 58.5M ops/s over two rounds) and variant C ahead with a forced collection every two
thousand resolves (2.25M against 2.03M–2.13M). The same was true of `resolve-all-async-8`. So the harness's −10% on
these rows is a property of the harness's process — one child that has loaded every scenario module, driving the row
through tinybench's task wrapper — and not of the engine's executed code; it is recorded here as that, and it is still a
number a reader of the ledger will see.

_A candidate mechanism, from bytecode._ `--print-bytecode` on both builds shows every hot function of the dynamic lane
at the same length except `#getResolutionFrame`, which grew from 67 to 78 bytes with the frame-link call in its cold
branch. That function is on the hot path of `nested-context-resolve-in-factory` and `scale-mid-transient-chain-32` — the
two rows V1, which did not touch it, left clean — and Maglev and TurboFan both inline by cumulative bytecode budget, so
eleven bytes can tip a caller over. Variant D moves the mint into its own method so the read is
`binding.frame ?? this.#mintResolutionFrame(binding)`, smaller than `HEAD`'s. _Variant D against `HEAD`, 2 experiments:_
`nested-context-resolve-in-factory` 0.836×, `scale-mid-transient-chain-32` 0.880×, `plan-deps-inlined` 0.844× — all
**worse** than variant C, with the two other rows on the same lanes flat or up (`transient-class-1-dep` 1.011×,
`interpreted-class-chain-24` 1.167×). Making the hot read smaller than `HEAD`'s made the rows slower, so the effect is
not a monotone function of that function's size, and the bytecode hypothesis is withdrawn. Variant D is discarded;
variant C is the shape committed.

**Decision, stated as the trade it is.** Variant C is kept. On the rows whose code it changes it wins by a fifth to a
half where the path is deep and is flat where it is shallow; it removes a threshold whose only measurement was taken on
a lane that no longer used it; and it is what made three lane divergences in the shipped engine visible and fixable.
Against that, two engine rows above the throughput ceiling read ten percent down in the harness and only in the harness,
on code the change does not execute, with no mechanism found after five variants and a bytecode diff. The record carries
those two numbers as they are. A maintainer who weighs the fast rows' harness figure above the deep rows' measured win
should revert one commit, `refactor(di): detect synchronous cycles by the binding's flag alone, at any depth`, and keep
everything else on the branch, which does not depend on it.

### `PLAN_DEPTH_LIMIT` — removed, with flat code generation

**What the constant protected.** The compiler inlined a transient class or factory chain to depth 32 and escaped the
rest to the interpreted path. Its comment named two reasons: compiled closures nest one JS frame per level, and
pathological graphs are the runtime's job. Neither survives inspection. The interpreted path nests _more_ frames per
level than a closure chain does (`resolve` → `#resolveBinding` → `#instantiateSync` → `#resolveDeps` → …), so escaping
at 32 does not bound stack depth, it moves the same depth to a costlier lane. The one real bound was in the generated
tier: a plan rendered as a single nested expression — `new A(new B(new C(…)))` — and an expression that deep is what a
parser's recursion has a limit for.

**Decision.** The generator renders a plan as a flat sequence of statements in dependency order — one local per node,
assigned after its dependencies' locals, so `new A(new B(new C()))` becomes
`t0 = new C(); t1 = new B(t0); t2 = new A(t1);` — and the depth condition is gone from both compilers. Evaluation order
is unchanged, because a post-order walk emits exactly the order a nested expression evaluated in; the async generator's
awaiting nodes keep their inner functions, each dependency's statements wrapped in its own `try` so a synchronous throw
is still that slot's rejection alone. The closure tier nests as before, which is no deeper than the interpreted path it
replaces. The lane differential test's chain property was deepened to 80 levels and holds.

**What remains bounded, and by what.** A graph deep enough to overflow the JS stack overflows it on every lane, the
compiler included, at the same order of depth; that is a property of the runtime, not a constant in this package, and
the interpreted path was never a refuge from it. Code size of a generated plan is the size of the tree it unfolds, which
for a diamond-heavy transient graph is exponential in depth — exactly as many `new` calls as the resolve performs, so
the code is never larger than the work.

**Cost, measured.** Paired A/B, full profile, isolated, alternating, against the flag-only cycle check (2 experiments):

| Row                                 |  Median ratio | Experiments | Reading                                                       |
| ----------------------------------- | ------------: | ----------- | ------------------------------------------------------------- |
| `plan-class-chain-40`               |        1.806× | 1.80 · 1.81 | the whole chain compiles where the tail escaped               |
| `plan-class-chain-24`               |        1.005× | 1.01 · 1.01 | flat statements render as fast as the nested expression       |
| `plan-escape-factory-dep`           |        0.998× | 0.99 · 1.01 | flat                                                          |
| `plan-escape-optional-dep`          |        0.980× | 0.98 · 0.98 | inside ±4% spread                                             |
| `realistic-graph-resolved-root`     |        1.004× | 1.00 · 1.01 | the `toResolved` graph's plan, re-rendered flat: flat         |
| `to-resolved-3-deps`                |        1.004× | 1.01 · 1.00 | flat                                                          |
| `transient-class-1-dep`             |        0.988× | 0.97 · 1.00 | flat                                                          |
| `interpreted-class-chain-40`        |        1.020× | 0.97 · 1.07 | untouched lane, flat                                          |
| `realistic-graph-resolve-root`      |        0.951× | 0.95 · 0.96 | the `toDynamic` graph, which compiles no plan: no causal path |
| `plan-deps-inlined`                 |        0.962× | 0.91 · 1.02 | signs disagree: noise                                         |
| async, child and singleton canaries | 0.99× – 1.04× |             | flat                                                          |

The row the constant existed for gains eighty percent; every row that renders a plan is flat, which is the claim the
flat emitter had to meet; and the one consistent reading down is on a lane that never compiles a plan.

### `MASK_WIDTH` — kept: it is the word, not a tuning

A tag key's mask is `1 << (id % 32)`, and a slot's key mask is the OR of its keys', so "does the request carry every key
this slot declares" is one AND and one compare before any criterion is read. Past 32 keys two keys share a bit; the mask
then admits a slot the exact comparison that follows rejects — a false positive, never a false negative — so the number
does not choose an answer. It is 32 because a JavaScript bitwise operand is a 32-bit integer; it is a fact about the
language's integers, not a threshold anyone swept, and the differential test mints enough keys across its runs to cross
it. **Kept, and reclassified**: a structural constant, not a tuning constant.

### `MULTI_TAG_INDEX_THRESHOLD` — kept as a proxy, with the reasoning written down

A request carrying two or more criteria selects among a token's bindings either by scanning the token's list with the
mask-then-identity match, or by walking the tag indexes — the exact one-criterion map and the first-criterion buckets —
for each criterion the request carries and selecting among the union. The constant says: scan while the token holds
eight bindings or fewer, walk past that.

The derived decision the research asked for — "compare `2^d` against `N` and let the input decide" — does not exist in
this engine's shape, because the index walk is not a subset enumeration: it is one map read per request criterion plus
the length of each bucket it lands in, so its cost is only known by doing it, and the scan's cost is `N` mask compares,
most of which fail on the first word. A request with `d` criteria over a token with `N` bindings could read the buckets'
lengths first (`d` map reads) and scan when their sum is not below `N` — that is a derived rule, and it costs `d` map
reads on the scan side of the line, where today's rule costs one integer compare. Every measured multi-criterion row in
the suite sits under eight bindings, so the derived rule would make the common case dearer to save an uncommon one
nothing measures.

**Decision.** Kept, as the cheap proxy it is, with the invariant it must respect stated where it lives: both sides
answer identically, which the differential test now checks across the threshold with tokens carrying up to twelve
bindings and requests carrying up to two criteria. The number is a proxy for "the scan is shorter than the walk", and a
maintainer who finds a workload with dozens of tagged bindings on one token should measure that rule's two sides there
rather than move the eight.

### `PLAN_CODEGEN_THRESHOLD` — kept as a tier; the number's warrant is the open item

A plan starts as a closure and, after 32 runs, is generated as a function of its own so its dependency call sites get
their own type feedback. This is a tiered compiler, and a tier needs a trigger; the research asked whether the trigger
can be a signal — `validate()` touching the binding, `initializeAsync()` warming it, a `container.warm()` — rather than
a count.

**Why the count stays.** The plan that needs its own function is the one a request path runs many times: a transient
root resolved per request. No bind-time signal names it — `validate()` walks every singleton graph and touches transient
roots only as dependencies, `initializeAsync()` builds singletons, and a `warm()` API would ask the caller to know what
the count discovers on its own. A count is the standard trigger of a tiered JIT for the same reason, and it is the one
signal that is _about_ heat.

**What is not warranted is the specific number.** Thirty-two is not derived from anything in the repository: the
break-even a tier's threshold stands for — the compile cost against the per-run saving — is a measurable pair, and the
bench holds neither side. A closure below the threshold is what a cold container and a per-request child run, so the
number is also a statement about how many resolves a request-scoped container makes before it is thrown away — a
workload fact, not an engine fact. **Kept, with this record as the reason a future measurement should replace it**: a
row that resolves a plan exactly `k` times for `k` around the threshold, from a fresh container, is the instrument that
would put a warrant behind the number or move it.

## The `resolveAll` memo footgun — a copy per read, not a frozen list

**The defect, reproduced.** A root-level, options-less `resolveAll` answered from its memo with the memo's own array.
The return type is `ReadonlyArray`, which binds a TypeScript caller and nobody else: a caller that ran `push`, `sort` or
`reverse` on the result rewrote what every later caller read, and the engine noticed nothing, because the memo is
invalidated by registry versions, not by inspection of its list.

**Why not freeze it.** The engine's comment gave the reason and this record checked it. Reading a frozen array is
several times slower than reading a plain one, for every shape a consumer uses — measured standalone on this machine:

| Shape                        |   plain |  frozen | copy (`slice`) |
| ---------------------------- | ------: | ------: | -------------: |
| 8 members, `for` index sum   |  5.8 ns | 29.5 ns |         9.4 ns |
| 8 members, `for…of` sum      |  6.7 ns | 56.3 ns |              — |
| 8 members, `.map`            | 14.1 ns | 55.3 ns |              — |
| 100 members, `for` index sum |   60 ns |  390 ns |        38.7 ns |
| 100 members, `for…of` sum    |   59 ns |  586 ns |              — |

A frozen array taxes every read the consumer ever makes, by five to ten times; a copy costs the engine about one
nanosecond per member once per call, and hands the caller an array that is theirs. A "freeze in development" mode would
have added a mode to an engine that has none and protected nothing in production.

**Decision.** `resolveRootCollection` and its async twin return `memo.values.slice()`. The memo — and the predicate and
candidate evaluation it saves — is unchanged; what changed is that its list never leaves the engine. The collection
tests that pinned the array's identity now pin value equality, a fresh array per read, and that writing into one read's
result does not touch the next.

**Cost, measured.** Paired A/B, full profile, isolated, alternating (2 experiments):

| Row                          |    Median ratio | Experiments | Reading                                                |
| ---------------------------- | --------------: | ----------- | ------------------------------------------------------ |
| `resolve-all-strategies-100` |          0.667× | 0.73 · 0.61 | the hot memo read pays a 100-member copy, about 18 ns  |
| `resolve-all-strategies-10`  |          0.794× | 0.81 · 0.78 | the same, ten members                                  |
| `resolve-all-cold-10`        |          0.953× | 0.97 · 0.93 | inside ±26% spread                                     |
| `resolve-all-cold-100`       |          1.004× | 1.01 · 1.00 | a cold read never hit the memo                         |
| `slot-tag-resolve-all`       |          0.992× | 0.97 · 1.01 | an options read never hit the memo                     |
| `resolve-all-async-8`        |          1.016× | 1.02 · 1.01 | members are factories, so the value list never settled |
| `resolve-all-named-16`       |          1.000× | 1.02 · 0.98 | flat                                                   |
| child and plan canaries      | 0.998× – 1.021× |             | flat                                                   |

**The trade, stated.** The two rows the memo was built for lose a fifth and a third of their throughput and stay above
twenty million reads a second; every other row is flat. The alternative is to keep handing out the engine's list and say
so in the contract, which is what at least one rival does. This record takes the copy: a container whose cache a
consumer can corrupt with an ordinary array method is a correctness hazard a type annotation does not close, and the
commit stands alone on the branch so a maintainer who prices the two rows above that can drop it without touching the
rest.

## Safety nets added

- **Coverage floor.** `vitest.config.ts` now declares thresholds — statements 95, branches 90, functions 95, lines 95 —
  a little under where the suite stands (95.8 / 91.4 / 96.1 / 95.8), so a lane that loses its tests turns the run red.
- **Version monotonicity canaries.** Property tests pin that `BindingRegistry.version` rises on every mutation the
  registry accepts, in any order, and that a child cache's summed chain version rises when either registry in the chain
  mutates — the two facts every version-stamped memo's equality check depends on.
- **Regression cases beside the properties.** Each of the three lane divergences has a fixed example next to the
  property that found it, so a future failure names the lane in one line rather than a shrunk counterexample.

## What this record did not do, and why

- **A unified IR engine — one instruction DAG per binding, sync and async as an attribute, one executor — was not
  built.** The research asked for it as the frame; what the branch delivered is the safety net that would make such a
  rewrite checkable (the differential test holds every lane to one snapshot), the removal of three thresholds and the
  unification of the synchronous cycle mechanism that a rewrite would have needed anyway, and the finding that the
  harness moves fast rows by ten percent on untouched code — which is the single largest risk to a rewrite's
  bench-gating and had to be characterised first. The thirteen sync/async pairs, the three context classes and the
  `buildConstraintContext` duplicate remain; they are now covered by a test that would catch a unification drifting.
- **`MULTI_TAG_INDEX_THRESHOLD` and `MASK_WIDTH` were not replaced** — the reasoning is in their sections: one is the
  machine word, the other is a proxy whose derived replacement costs more on the common side.
- **`PLAN_CODEGEN_THRESHOLD` was kept as a count**, with the measurement that would warrant its value named.
- **`RESULTS.md` was not refreshed**: that page cites committed baselines and is regenerated by its own procedure; this
  record's numbers are paired A/Bs and a self-measured direction check, and are cited here with their method.

## The trade this record does not pretend away

A container that is built once and resolved a million times and a container that is built per request and resolved once
want different object shapes, and one engine cannot have both. Every step here was gated on the warm resolve rows _and_
on the per-request child rows, and where the two disagreed the record says which side won and why. The two places this
record chose against a measured row are named above: the flag-only cycle check, for two fast rows that move only in the
harness, and the `resolveAll` copy, for two memo rows that pay a real copy. Both stand as their own commits.

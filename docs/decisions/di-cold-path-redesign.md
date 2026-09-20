# `@codefast/di` — the cold-path redesign — decision record

**Date:** 2026-09-20 · **Status:** in progress on `perf/di-cold-path-redesign` · **Package:** `packages/di` ·
**Related:** the two records of the resolution-engine research on
[codefastlabs/codefast#893](https://github.com/codefastlabs/codefast/pull/893), from which the lane differential test,
the three lane fixes and the threshold removals were ported and re-measured here.

The goal is one sentence: on `pnpm di:bench` and `pnpm di:bench:fast` on this machine, `@codefast/di` is the fastest
library on every head-to-head row, or inside that row's own measured noise, and where it is not the record names the
clause of `SPEC.md` that makes it do work the rival does not and measures that work as the whole gap. Nothing below is
quoted from an earlier document; every number was measured for this record, with the method beside it.

The run that fixes the starting line is the one this record is judged by: the loss table is regenerated from a run's
`observations.jsonl` by a script (median `hzPerOp` per scenario and library, codefast divided by the fastest rival),
never copied from a report page.

---

## B0 — the starting line

Tree `10b5f9db3` (`main`), Apple M3 Max, Node 26.1.0, seven libraries, 126 rows of which 91 are head-to-head contract
rows. `pnpm di:bench` (shared process, default profile, three trials) and `pnpm di:bench:fast` (one trial) — the two
tables a user sees — and the pinned isolate pass at the citable profile.

**`pnpm di:bench` (default profile, shared process, three trials)** — 91 head-to-head rows, 25 below 1.00× (run
`2026-09-20T01-38-51-242Z`).

| ratio | row                                          | fastest rival | codefast ops/s | rival ops/s |
| ----: | -------------------------------------------- | ------------- | -------------: | ----------: |
| 0.18× | `rebind-hot-swap`                            | ditox         |     13,086,277 |  72,640,888 |
| 0.26× | `accessor-injection-construct`               | inversify     |      7,332,775 |  27,883,149 |
| 0.31× | `resolve-all-cold-100`                       | tsyringe      |        174,248 |     564,128 |
| 0.40× | `create-child-empty`                         | injection-js  |     17,757,452 |  44,189,460 |
| 0.40× | `unbind-all-100-singletons`                  | ditox         |         41,924 |     103,589 |
| 0.42× | `bind-128-plain`                             | ditox         |        197,449 |     470,062 |
| 0.43× | `resolve-all-cold-10`                        | tsyringe      |      1,450,097 |   3,408,636 |
| 0.45× | `materialize-100-singletons`                 | ditox         |         59,696 |     132,073 |
| 0.48× | `container-create-empty`                     | injection-js  |     19,415,066 |  40,813,381 |
| 0.49× | `realistic-graph-class-cold-resolve`         | ditox         |        356,390 |     726,767 |
| 0.56× | `misconfigured-missing-binding`              | tsyringe      |        241,625 |     434,745 |
| 0.71× | `production-event-bus-dispatch`              | ditox         |     39,315,570 |  55,383,596 |
| 0.74× | `resolve-optional-hit`                       | ditox         |     93,934,184 | 127,182,669 |
| 0.74× | `to-resolved-3-deps`                         | ditox         |     92,523,605 | 124,998,535 |
| 0.75× | `constant-resolve`                           | ditox         |     95,537,985 | 127,543,901 |
| 0.75× | `singleton-class-1-dep`                      | ditox         |     94,476,725 | 125,734,562 |
| 0.82× | `alias-parent-owned-terminal`                | injection-js  |     56,262,908 |  68,983,190 |
| 0.85× | `nested-context-resolve-in-factory`          | injection-js  |     33,419,448 |  39,171,436 |
| 0.86× | `boot-decorated-container-build-and-resolve` | tsyringe      |        590,843 |     685,712 |
| 0.94× | `lifecycle-pre-destroy-unbind`               | ditox         |      2,861,414 |   3,051,887 |
| 0.95× | `to-alias-redirect`                          | injection-js  |     57,527,353 |  60,531,014 |
| 0.96× | `async-init-single-hop`                      | injection-js  |      6,888,499 |   7,194,535 |
| 0.97× | `resolve-all-async-8`                        | inversify     |        978,989 |   1,009,658 |
| 0.97× | `has-bound-check`                            | awilix        |    142,490,332 | 146,663,194 |
| 0.98× | `nested-container-resolve-in-factory`        | ditox         |     32,663,080 |  33,491,704 |

**`pnpm di:bench:fast` (one trial)** — 91 head-to-head rows, 24 below 1.00× (run `2026-09-20T01-39-22-973Z`).

| ratio | row                                          | fastest rival | codefast ops/s | rival ops/s |
| ----: | -------------------------------------------- | ------------- | -------------: | ----------: |
| 0.17× | `rebind-hot-swap`                            | ditox         |     12,813,655 |  76,650,873 |
| 0.24× | `accessor-injection-construct`               | inversify     |      7,415,964 |  30,557,081 |
| 0.33× | `resolve-all-cold-100`                       | tsyringe      |        182,967 |     561,499 |
| 0.38× | `bind-128-plain`                             | ditox         |        177,205 |     471,988 |
| 0.39× | `unbind-all-100-singletons`                  | ditox         |         42,096 |     107,764 |
| 0.40× | `create-child-empty`                         | injection-js  |     18,279,034 |  45,880,500 |
| 0.42× | `materialize-100-singletons`                 | ditox         |         56,897 |     135,653 |
| 0.43× | `resolve-all-cold-10`                        | tsyringe      |      1,400,832 |   3,253,013 |
| 0.46× | `realistic-graph-class-cold-resolve`         | ditox         |        315,447 |     685,613 |
| 0.47× | `container-create-empty`                     | injection-js  |     20,214,438 |  42,865,690 |
| 0.57× | `misconfigured-missing-binding`              | tsyringe      |        232,928 |     410,489 |
| 0.73× | `to-resolved-3-deps`                         | ditox         |    100,758,745 | 137,220,137 |
| 0.75× | `alias-parent-owned-terminal`                | injection-js  |     60,584,729 |  81,175,607 |
| 0.76× | `singleton-class-1-dep`                      | ditox         |    101,844,379 | 134,635,237 |
| 0.78× | `production-event-bus-dispatch`              | ditox         |     44,976,652 |  57,886,260 |
| 0.86× | `resolve-optional-hit`                       | ditox         |    111,828,455 | 129,663,025 |
| 0.89× | `lifecycle-pre-destroy-unbind`               | ditox         |      2,706,698 |   3,050,254 |
| 0.89× | `boot-decorated-container-build-and-resolve` | tsyringe      |        588,388 |     662,224 |
| 0.94× | `resolve-all-async-8`                        | inversify     |        931,002 |     995,366 |
| 0.94× | `async-init-single-hop`                      | ditox         |      7,147,214 |   7,628,712 |
| 0.99× | `realistic-graph-cold-resolve`               | ditox         |        254,040 |     256,676 |
| 0.99× | `constant-resolve`                           | ditox         |    136,412,618 | 137,722,768 |
| 0.99× | `has-bound-check`                            | awilix        |    166,640,543 | 168,031,824 |
| 1.00× | `nested-container-resolve-in-factory`        | ditox         |     31,165,765 |  31,226,305 |

**Pinned isolate pass** — `BENCH_MODE=full BENCH_TIER=contract pnpm di:bench:isolate`, 28m30s, committed as
`baselines/2026-09-20T02-07-56-518Z` — 91 head-to-head rows, 28 below 1.00×. Every later isolate run of this branch is
read against it (`BENCH_BASELINE=baselines/2026-09-20T02-07-56-518Z`).

| ratio | row                                          | fastest rival | codefast ops/s | rival ops/s |
| ----: | -------------------------------------------- | ------------- | -------------: | ----------: |
| 0.15× | `rebind-hot-swap`                            | ditox         |     11,910,331 |  79,630,421 |
| 0.33× | `unbind-all-100-singletons`                  | ditox         |         33,547 |     101,335 |
| 0.38× | `materialize-100-singletons`                 | ditox         |         51,981 |     137,304 |
| 0.41× | `accessor-injection-construct`               | inversify     |      8,381,959 |  20,658,351 |
| 0.43× | `bind-128-plain`                             | ditox         |        187,688 |     437,083 |
| 0.49× | `resolve-all-cold-100`                       | tsyringe      |        176,054 |     356,743 |
| 0.51× | `create-child-empty`                         | injection-js  |     17,192,331 |  33,818,621 |
| 0.52× | `realistic-graph-class-cold-resolve`         | ditox         |        338,303 |     648,671 |
| 0.59× | `resolve-all-async-8`                        | inversify     |        541,030 |     919,851 |
| 0.66× | `misconfigured-missing-binding`              | tsyringe      |        287,299 |     433,065 |
| 0.67× | `resolve-all-cold-10`                        | tsyringe      |      1,383,011 |   2,051,624 |
| 0.72× | `singleton-class-1-dep`                      | ditox         |    122,012,616 | 170,299,815 |
| 0.72× | `to-resolved-3-deps`                         | ditox         |    122,287,832 | 170,304,044 |
| 0.76× | `boot-decorated-container-build-and-resolve` | tsyringe      |        494,796 |     649,924 |
| 0.76× | `resolve-optional-hit`                       | ditox         |    140,505,002 | 184,522,187 |
| 0.79× | `constant-resolve`                           | ditox         |    142,718,050 | 180,483,561 |
| 0.79× | `container-create-empty`                     | injection-js  |     24,896,341 |  31,397,665 |
| 0.85× | `lifecycle-pre-destroy-unbind`               | ditox         |      2,188,534 |   2,581,947 |
| 0.85× | `production-event-bus-dispatch`              | ditox         |     49,879,370 |  58,721,015 |
| 0.88× | `async-init-single-hop`                      | injection-js  |      4,470,537 |   5,072,312 |
| 0.89× | `resolve-all-strategies-100`                 | ditox         |     25,130,497 |  28,318,877 |
| 0.92× | `nested-container-resolve-in-factory`        | injection-js  |     36,326,569 |  39,461,716 |
| 0.95× | `nested-context-resolve-in-factory`          | injection-js  |     42,487,966 |  44,877,726 |
| 0.97× | `rebind-parent-resolve-child-depth-3`        | awilix        |      8,257,119 |   8,492,089 |
| 0.97× | `alias-parent-owned-terminal`                | injection-js  |     85,077,866 |  87,357,811 |
| 0.99× | `realistic-graph-cold-resolve`               | ditox         |        259,321 |     263,057 |
| 0.99× | `resolve-all-strategies-10`                  | ditox         |     27,954,068 |  28,337,235 |
| 1.00× | `to-alias-redirect`                          | injection-js  |     86,396,957 |  86,800,602 |

The three tables agree on the shape: the warm engine is ahead or level almost everywhere, and every heavy loss is a
fixed cost — construction, binding, teardown, a one-shot resolve, an error — where the rival does less work per
operation because it keeps less state per container.

## B1 — what the code says, before the profiler says anything

Read off `main` before any measurement; every line below is a hypothesis until the profile table beneath it confirms or
refutes it.

- **A container is nine objects before it is used.** `Container.create()` constructs the container, a registry (with an
  eager `Map` for the lone default slot), a scope manager, a lifecycle manager, a resolver (with three eager arrays: the
  sync context pool, the root stack, the cascade stack), a lookup memo and a class introspector, and runs the metadata
  reader through a verifying wrapper. A child adds a registry read for a bound reader. ditox's container is one literal,
  eight closures and two maps; injection-js's empty injector is a handful of arrays.
- **A binding is a twenty-field object and a bind is five layers.** The fluent chain is the binding — one hidden class
  for every kind, so every field is initialised on every bind — and `bind().toDynamic()` passes through the disposed
  check, the builder factory, the memoized registration, the register step, the commit step (version bookkeeping,
  displacement parking) and the registry's add (version bump, process epoch, kind check, record probe, lone probe, id
  index probe, slot test, lone set). ditox's bind is one small object and one `Map.set`.
- **A scope refinement re-registers.** `.singleton()` and `.many()` after `to*()` go through a rewrite commit: the
  registry takes the binding out of its indexes, applies the change and adds it back, with the chain re-checking
  liveness and restoring anything the freed slot lets back in. A scope is not indexed, so the sync teardown rows pay two
  registrations per binding for one.
- **A rebind is an unbind, a bind and a memo rebuild.** `rebind().toConstantValue()` removes by token (allocating the
  removed list), drains deactivation pairs, builds a new chain, adds it, and the resolve that follows finds the lookup
  memo's version moved, clears it and re-walks — allocating an entry object for a lone constant the registry could have
  answered in one `Map.get`.
- **A cold class resolve compiles before it runs.** The first root resolve of a class or resolved binding builds the
  plan compiler and its host (a dozen closures), compiles the plan (a second walk of the graph) and then runs it — a
  one-shot container pays a plan it never reuses.
- **A cold collection read builds a memo it never reads again.** `resolveAll` on a fresh container goes through the
  root-collection memo, the candidate filter and the settle step; ten `.many()` refinements each re-register.
- **An error is a class hierarchy and a diagnostic.** A miss walks the memo, re-walks in the require step, reads the
  registry a third time for the diagnostic and constructs a subclass of a subclass of `Error`; the stack capture is the
  same as tsyringe's, the rest is not.
- **The warm constant path is three calls deep.** `container.resolve` (disposed check, root-stack test) →
  `resolver.resolveFromContext` (lone-map read, alias test) → `#resolveDefaultEntry` (scope test, plain-constant test
  that reads the lifecycle's activation version) → value. ditox is one closure and one `Map.get`.

### The profile table

Method: each scenario's own `build()` function from the bench suite, run in a process of its own per library through the
same `tsx` the harness uses, warmed, then timed (median of five rounds), then allocation-sampled with the inspector's
sampling heap profiler at a sixteen-byte interval (objects estimated by weighting each sample by its size's sampling
probability, so small objects are slightly undercounted), then CPU-profiled for one second (`--cpu-prof`, self time by
function). Numbers are per single operation (the row's batch divided out).

| Row                                         | side         |           ns/op |          bytes/op | objects/op | top self time                                                                                                                                                                                                 |
| ------------------------------------------- | ------------ | --------------: | ----------------: | ---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `container-create-empty`                    | codefast     |              43 |             1 040 |         ≈6 | resolver ctor 36%, registry ctor 12%, `#initResolver` 7%, introspector 7%, container ctor 6%, lookup memo 7%                                                                                                  |
|                                             | injection-js |              25 |               418 |         ≈8 | `resolveReflectiveProviders` 47%, injector ctor 15%                                                                                                                                                           |
| `create-child-empty`                        | codefast     |              56 |             1 040 |         ≈7 | `#initResolver` 20%, registry ctor 16%, resolver ctor 21%, container ctor 9%, `registry.has` 5%, `#readerForChild` 2%                                                                                         |
|                                             | injection-js |              24 |               418 |         ≈8 | as above                                                                                                                                                                                                      |
| `bind-128-plain`                            | codefast     | 5 276 (41/bind) | 47 147 (306/bind) |       ≈145 | `registry.add` 46%, `#commit` 8%, chain ctor 7%, `toDynamic` 2%, `#createBindToBuilder` 2%                                                                                                                    |
|                                             | ditox        | 2 285 (18/bind) |  17 504 (77/bind) |       ≈139 | `bindFactory` 74%                                                                                                                                                                                             |
| `rebind-hot-swap`                           | codefast     |              91 |               529 |         ≈6 | `removeByToken` 19%, `add` 12%, `#drainSingletons` 10%, GC 10%, `#commit` 5%, chain ctor 4%                                                                                                                   |
|                                             | ditox        |              11 |                 0 |          0 | `bindValue` 39%, `resolver` 36%                                                                                                                                                                               |
| `resolve-all-cold-10`                       | codefast     |             829 |             5 475 |        ≈54 | `#addToRecord` 9%, `add` 5%, `#commit` 5%, `filterBindings` 4%, `#promoteLoneToRecord` 4%, `#settleCollectionValues` 4%, `many` 4%                                                                            |
|                                             | tsyringe     |             384 |             2 746 |        ≈56 | `ensure` 14%, `set` 9%, `resolveRegistration` 9%, `resolveAll` 8%                                                                                                                                             |
| `resolve-all-cold-100`                      | codefast     |           5 629 |            40 115 |       ≈328 | `#addToRecord` 10% (16 KB, 202 objects: the list is copied on every append), `add` 8%, `many` 7%                                                                                                              |
|                                             | tsyringe     |           2 503 |            15 071 |       ≈332 | `resolveRegistration` 13%, `set` 11%, `ensure` 11%, `resolveAll` 11%                                                                                                                                          |
| `materialize-100-singletons`                | codefast     |          17 206 |            50 251 |       ≈434 | `needsActivation` 17%, `add` 11%, `#resolveBinding` 8% (9 KB, 107 objects), `getFastDefault` 6%, `#constructorParams` 4%, metadata reads 7%                                                                   |
|                                             | ditox        |           7 473 |            22 666 |       ≈217 | `resolver` 38%, `bindFactory` 18%, `bindValue` 18%                                                                                                                                                            |
| `unbind-all-100-singletons`                 | codefast     |          23 004 |            69 809 |       ≈846 | `needsActivation` 13%, `deleteSingleton` 10% (5.6 KB, 202 objects: `indexOf` + `splice` per singleton), `#drainSingletons` (8.8 KB, 106 pairs), iterator objects 4 KB                                         |
|                                             | ditox        |           8 639 |            23 025 |       ≈230 | `resolver` 34%, `bindFactory` 15%, `bindValue` 13%, `executeOnRemoved` 10%                                                                                                                                    |
| `realistic-graph-class-cold-resolve`        | codefast     |           2 838 |            11 702 |       ≈142 | `#instantiateSync` 10%, `needsActivation` 8%, `add` 6%; the plan compiler alone is 3.2 KB and 45 objects (`#compileDepThunk`, `#buildPlanCompilerHost`, `#compileClassPlan`, `#classNode`) on a plan run once |
|                                             | ditox        |           1 597 |             9 391 |       ≈143 | `resolver` 25%, `bindFactory` 11%, `bindValue` 10%                                                                                                                                                            |
| `misconfigured-missing-binding`             | codefast     |           4 233 |               646 |        ≈12 | `DiError` ctor 80% (506 B, 8 objects), `#requireBinding` 7%                                                                                                                                                   |
|                                             | tsyringe     |           2 463 |               797 |        ≈14 | `resolve` 90% (its `new Error`, 408 B, 8 objects)                                                                                                                                                             |
| `accessor-injection-construct`              | codefast     |             167 |                57 |         ≈2 | `__privateAdd` 37%, GC 17%, `__runInitializers` 4%, `__accessCheck` 4%, `__privateSet` 3% — the transpiler's lowering of the scenario's own `accessor` field, not the engine                                  |
|                                             | inversify    |              28 |               144 |         ≈3 | `resolveNode`                                                                                                                                                                                                 |
| `constant-resolve`, `singleton-class-1-dep` | both         |               5 |                 0 |          0 | equal in a standalone loop; the harness reads 0.72–0.79× — a harness-side effect to be measured in the harness, not here                                                                                      |

What the table settles, hypothesis by hypothesis:

- **Construction (confirmed).** Half the create cost is constructing the resolver and its two collaborators; the
  registry's eager map and the resolver's three arrays are the objects. A child pays the same plus a registry probe for
  a bound reader. Target: one object with nothing allocated until used.
- **Bind (confirmed, and sharper).** Half of a bind is inside `registry.add` — the lone-map probe and set on a map
  growing to 128 entries — and the rest is the chain object (306 bytes, four times ditox's record) and the layers. ditox
  pays the same map growth (the `set` line is identical, 7 KB) so the map is not the difference; the object and the
  layers are.
- **Scope refinement (confirmed at the row):** `#withScope` shows at 3% of materialize; the re-registration is cheap in
  itself, the bump it makes invalidates the memos the following resolves then rebuild.
- **Rebind (confirmed).** Six allocations for a swap that needs none: the removed-list array, the deactivation walk's
  iterator, the new chain, the memo's entry.
- **Cold class resolve (confirmed).** The plan compiler is a quarter of the allocation on a plan that runs once;
  `needsActivation` is the top self-time function on every cold row that instantiates — a per-binding memo built for a
  container that resolves each binding once.
- **Cold collection (confirmed).** Appending to a record copies the list, so a hundred members cost two hundred arrays;
  `.many()` re-registers each member.
- **Teardown (confirmed).** The singleton list is spliced per removal and every removal allocates a pair.
- **Error (confirmed, different cause).** Nothing but the error's construction matters; codefast's is 1.8 µs slower than
  a bare `new Error` with a message of the same shape — the subclass chain, the `name` write and the field definitions,
  on top of the same stack capture.
- **Accessor injection (refuted as an engine cost).** The row measures the benchmark's transpiler emulating the
  `accessor` keyword with WeakMap-backed privates. What the engine pays is a tenth of the row.
- **Warm micro rows (open).** Equal standalone. The gap exists only inside the harness and is measured there.

## B4 — the slices

Each slice is one concern and one commit, gated the same way: the package's unit and integration suites green, a paired
A/B (`pnpm di:bench:ab`, alternating, two experiments, three trials a side) on the rows the slice has a causal path to
and on the warm rows it must not move, under the full profile when a hot lane is touched and under the default profile —
the one a user's `pnpm di:bench` runs — for the cold rows. A warm row that moves past its own floor with a causal path
stops the slice.

### S1 — a container allocates nothing it has not used

**Change.** The registry's lone map starts as one shared empty map and is minted by the first `add`; the resolver's sync
context pool and cascade stack are minted by the first resolve that needs them; the lookup memo and the class
introspector are built by the first miss of the own lone map and the first class resolve respectively; the plan host
holds the introspector it was built with. A child's registry probe for a bound reader is unchanged.

**What it took three runs to learn.** The first cut also made the introspector lazy behind an accessor the plan host's
closures called on every plan run, and the hot rows paid for it: `child-depth-1-resolve` 0.85×, `transient-class-1-dep`
0.89×, `plan-deps-inlined` 0.91×. Restoring the lookup memo to eager construction (cut two) gave the hot rows back and
lost most of the create win — 1.05× against 1.64× — so the memo's construction is a third of what a container costs. Cut
three keeps the memo lazy and hoists the introspector out of the host's closures, and reads:

| Row                                                                 |        full profile | Reading                                                                                                                                                                                  |
| ------------------------------------------------------------------- | ------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `container-create-empty`                                            |          1.04–1.64× | bimodal under the full profile's forced collection — every container dies between samples, the loop of Step 1b of the previous record; the default profile is the reading to take, below |
| `create-child-empty`                                                |               1.28× | the child no longer builds a memo or a map                                                                                                                                               |
| `fresh-child-default-n4`                                            |               1.10× |                                                                                                                                                                                          |
| `child-depth-1-resolve`, `child-depth-4-resolve`                    |        1.00×, 0.99× | the memo accessor costs nothing once the host is hoisted                                                                                                                                 |
| `transient-class-1-dep`, `plan-deps-inlined`, `plan-class-chain-24` | 0.99×, 0.98×, 1.04× | flat                                                                                                                                                                                     |
| `slot-tag-array-hoisted`, `named-constant-get`                      |        1.00×, 0.95× | inside ±22–60% spreads                                                                                                                                                                   |

### S6a — the first resolve of a root interprets; the plan is compiled on the repeat

**Change.** A root's plan was compiled on its first request, so a container that resolved a class root once paid the
compiler, its host (a dozen closures) and a plan it never ran again — 3.2 KB and 45 objects of the cold row's 11.7 KB.
The first request now interprets and the request that repeats it compiles. This is memoization on the first repeat, not
a tuned count: there is no number to choose.

**What it took three cuts to learn.** The first cut stored a sentinel in the plan map for "requested once", and the
second stored `null` there with a set of unplannable ids beside it; each moved a warm plan lane by one nanosecond
standalone and put a set probe on the hot path of every unplannable root (`realistic-graph-class-resolve-root` 0.67×).
The third keeps the plan map exactly as it was — a plan or `null` for unplannable — and consults a "requested once" set
only on a first miss, so both warm paths are byte-identical to the commit before.

| Row                                                                               |                             full profile | Reading                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------- | ---------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `realistic-graph-class-cold-resolve`                                              | 1.14× (1.11×, 1.12× on the earlier cuts) | causal: no compiler on a one-shot root                                                                                                                                                                                                                               |
| `boot-decorated-container-build-and-resolve`                                      |                                    1.01× | one resolve per op, but the row is dominated by the bind and decorator reads                                                                                                                                                                                         |
| `child-request-lifecycle-create-resolve-dispose`                                  |                                    1.03× |                                                                                                                                                                                                                                                                      |
| `interpreted-class-chain-24`, `plan-escape-hooked-dep`                            |                             0.97×, 0.98× | unplannable roots, inside their spreads                                                                                                                                                                                                                              |
| `plan-class-chain-24`, `to-resolved-3-deps`, `realistic-graph-class-resolve-root` |                      1.00×, 1.00×, 1.13× | warm plan rows: flat or noise                                                                                                                                                                                                                                        |
| `transient-class-1-dep`, `plan-deps-inlined`                                      |                             0.89×, 0.91× | **harness-only**: three A/Bs agreed, and the standalone loop of the same scenario functions reads both builds at 13 / 16 ns with no forced collection and at 20 / 20 ns and 87 / 89 ns under one every thousand and every hundred, with one deoptimization mark each |

The two warm rows are recorded, not acted on: nothing the cached-plan path executes changed, the standalone probe reads
equal under every cadence, and the rule is not to revert a causal win for a movement the probe cannot reproduce. The
final three-run comparison is where they are read again.

### S6b — the activation need is stamped on the binding

**Change.** `needsActivation` was memoized in a per-resolver map keyed by binding id and invalidated by the summed
lifecycle and registry versions — the top self-time function on every cold row that instantiated, building a map a
one-shot container filled and never read. The answer is now stamped on the binding itself as the version pair it was
computed under, doubled, plus the answer; a mutation moves the version and retires every stamp at once; a first
instantiation that discovers lifecycle metadata resets its own stamp. The level reads one field and compares it twice.

| Row                                                                   |        full profile | Reading                                                                |
| --------------------------------------------------------------------- | ------------------: | ---------------------------------------------------------------------- |
| `materialize-100-singletons`                                          |               1.23× | a hundred bindings resolved once each, no map to build                 |
| `unbind-all-100-singletons`                                           |               1.21× | same shape plus the teardown                                           |
| `realistic-graph-class-cold-resolve`                                  |               1.11× |                                                                        |
| `boot-decorated-container-build-and-resolve`                          |               1.13× |                                                                        |
| `interpreted-class-chain-24`                                          |               1.00× | the interpreted level's own read: a field compare where a map read was |
| `transient-class-1-dep`, `plan-deps-inlined`, `singleton-class-1-dep` | 0.97×, 0.98×, 1.00× | inside their spreads                                                   |
| `binding-level-activation-hook`, `container-level-activation-hook`    |        0.92×, 1.02× | both sides ±17–37%: not readable                                       |

One field was added to the binding shape for one map removed from every resolver; the bind slice that shrinks the shape
is measured after this one.

### S3 — teardown without splices, pairs or iterators

**Change.** Removing a singleton spliced it out of the materialised list (an `indexOf` and a `splice` per removal: two
hundred arrays for a hundred singletons), an unbind paired every binding with its instance in a tuple and walked the
pairs by iterator. A removal now clears the binding's instance and marks the list for a compaction the next read
performs — the list is read only by `dispose()` and `inspect()`, which keep materialisation order and take the latest
position of a binding materialised twice — and the pairs are one flat list walked by index.

| Row                                                      |            full profile | Reading                                                                         |
| -------------------------------------------------------- | ----------------------: | ------------------------------------------------------------------------------- |
| `unbind-all-100-singletons`                              |        1.11× then 1.03× | the list half, then the pairs half, measured apart                              |
| `rebind-hot-swap`                                        |        1.00× then 1.10× | the pairs half: the swap no longer allocates an iterator and a tuple per unbind |
| `child-request-lifecycle-create-resolve-dispose`         |        0.99× then 1.10× | same                                                                            |
| `lifecycle-pre-destroy-unbind`                           |        1.03× then 1.00× | one unbind, inside its spread                                                   |
| `scoped-binding-per-child`, `materialize-100-singletons` | 1.03×, 0.92× then 1.03× | both sides ±13–18%: the rows do not run the changed code                        |
| `singleton-class-1-dep`, `transient-class-1-dep`         |            0.99×, 0.99× | flat                                                                            |

The slice landed in two halves because the script that applied it failed on the container half's anchor text and the
failure was read only after the list half had been measured and committed; the pairs half was then applied, measured on
its own and folded into the same commit. The lesson is procedural and is in the record so it is not repeated: a chained
apply-and-measure step reads its own log before its result is believed.

### S7 — an error names itself with a literal

**Change.** `DiError`'s constructor read `this.constructor.name` on every throw — a property read on the function object
that is twenty-five-way polymorphic across the error classes — and the miss path read the registry's whole binding list
to learn that a token had bindings. Each class now carries its name as a literal field, and the miss path asks `has()`.
The error-floor probe (five shapes of the same error thrown and caught through four frames) put the constructor-name
lookup and the class-field definitions at a tenth of the row; the stack capture is the rest, and it is the same capture
every library pays.

| Row                                                                       |        full profile | Reading |
| ------------------------------------------------------------------------- | ------------------: | ------- |
| `misconfigured-missing-binding`                                           |               1.04× |         |
| `alias-cycle-detected`                                                    |               1.04× |         |
| `circular-dependency-3`                                                   |               1.02× |         |
| `optional-missing-transient`, `constant-resolve`, `transient-class-1-dep` | 0.98×, 1.00×, 1.01× | flat    |

The row stays at roughly two thirds of tsyringe after this; the remaining gap is not in the error's construction (the
probe reads codefast's shape within 5% of a bare `new Error`) and is measured again in the harness at the end.

### S4 — a rebind of a lone token is one registration

**Change.** `rebind(token)` unbound the token first — removing by token into a fresh list, draining deactivation pairs,
then handing out a new chain — and the resolve after it found the lookup memo's version moved. A token held as its lone
default binding is now replaced by the new chain's own registration, which displaces it; the registration carries a
`deactivateDisplaced` hook so the displaced binding is deactivated on the spot instead of parked for a restore. Any
other shape — several slots, a record — keeps the unbind-then-bind path, and an unbound token still throws.

| Row                                                         | full profile | Reading                                                                                |
| ----------------------------------------------------------- | -----------: | -------------------------------------------------------------------------------------- |
| `rebind-hot-swap`                                           |        1.56× | one chain, one map probe and one map write, no removed list, no pairs, no memo rebuild |
| `rebind-parent-resolve-child-depth-3`                       |        1.33× | the rebind in the root, read through three children                                    |
| `lifecycle-pre-destroy-unbind`, `unbind-all-100-singletons` | 1.02×, 1.02× | the unbind path is untouched                                                           |
| `constant-resolve`, `has-bound-check`                       | 0.99×, 1.00× | flat                                                                                   |

`rebind-hot-swap` is at 21.5M ops/s after this against ditox's 72–80M: what remains is the chain object the fluent
builder is (`rebind()` returns it) and the map probe that last-wins needs; the bind-floor probe puts a bare `Map.set`
with a two-field literal at 13.4 ns and a probe-and-set with a twenty-field object at 20.3 ns on this V8.

### S2 — a fresh registration is one probe, one write and one version read

**Change.** The registry's `add` probed the record map through an optional chain before the lone map on every bind, and
a fresh registration went through the general commit with its version bookkeeping, parking and restore branches. The
record map is probed only when it exists, the lone map is minted in the same step it is first written, and a fresh
registration is one add and one version read.

| Row                                                                                                                   |                           full profile | Reading |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------: | ------- |
| `bind-128-plain`                                                                                                      | 1.03× (standalone 5 276 → 5 058 ns/op) |         |
| `rebind-hot-swap`                                                                                                     |                                  1.04× |         |
| `bind-128-refined`, `materialize-100-singletons`, `resolve-all-cold-10`, `boot-decorated-container-build-and-resolve` |             0.98×, 1.00×, 1.00×, 0.97× | flat    |
| `container-create-empty`, `constant-resolve`, `singleton-class-1-dep`                                                 |                    1.02×, 1.00×, 1.00× | flat    |

**Where a bind's time is, on the real build with inlining off.** `registry.add` 35% (with inlining 46%: the lone map's
probe and write on a map growing to 128 entries, plus the version bump), the chain object 15% (allocation and twenty
field stores), the fluent layers — `bind`, the builder factory, the disposed check, `toDynamic`, `#register`, the id
counter, the epoch — 15%, the rest the row's own loop. The bind-floor probe puts this V8's `Map.set` with a two-field
literal at 13.4 ns and a probe-and-set with a twenty-field object at 20.3 ns; ditox's whole bind is 17.8 ns. codefast's
39.5 ns is that floor plus the layers, and the floor itself — a probe that last-wins needs, an object that is the fluent
builder the API returns — is above ditox's whole cost. The row is recorded against G1's clause: `SPEC.md` makes `bind()`
return the chain and makes a later registration displace an earlier one in the same slot, which is the probe; both are
the contract, and the number for each is above.

### S5 — a chain's own refinement re-slots without a probe

**Change.** Every collection member is `bind(t).toConstantValue(v).many()`: a registration into the default slot, then a
refinement that moves the binding out of it — two map probes and a record promotion per member on top of the add. The
registry now remembers the binding its last `add` placed and where it landed, so a refinement that follows its own
registration moves the binding out of the lone map or clears its default slot with no probe; any removal or re-slot
forgets the memory.

| Row                                                                               |        full profile | Reading                                           |
| --------------------------------------------------------------------------------- | ------------------: | ------------------------------------------------- |
| `resolve-all-cold-100`                                                            |               1.10× |                                                   |
| `resolve-all-cold-10`                                                             |               1.04× |                                                   |
| `resolve-all-strategies-10`, `resolve-all-strategies-100`, `slot-tag-resolve-all` | 0.98×, 0.97×, 0.99× | warm reads through the memo, inside their spreads |
| `production-event-bus-dispatch`                                                   |               0.94× | both sides ±22–32%: not readable                  |
| `bind-128-plain`, `constant-resolve`                                              |        0.99×, 1.01× | flat                                              |

The phase probe of the row's shape puts a member's add at 25 ns and its `.many()` at 19 ns before this slice, and the
row's hundred members at 4.4 µs of its 5.6 µs; tsyringe's hundred registrations are 1.8 µs. What remains is the chain
object per member and the map write, as for `bind-128-plain`, and the row is recorded against the same clause.

**A change of measuring discipline from here.** The harness A/B after every slice — and the re-runs that attributed its
noise — cost six to fifteen minutes of the machine each, and the standalone probe of the same scenario functions
reproduced every effect that turned out to be real. From this point a change is gated by the probe (time, bytes and
objects per op, seconds), the harness runs once per group of changes at the default profile a user runs, and the three
user commands run once at the end.

## G4 / G5 — the constants, and what the code generator is worth

### The generated tier stays

G5 asked for the `new Function` tier to be deleted if it bought only ten to twenty percent on a warm plan. Measured on
the bench's own scenario functions, warm, with the tier on and with it forced off (availability initialised false,
rebuilt, probed, restored):

| Row                                                                           |     tier on |    tier off | Reading                                                           |
| ----------------------------------------------------------------------------- | ----------: | ----------: | ----------------------------------------------------------------- |
| `plan-class-chain-24`                                                         |       92 ns |      536 ns | 5.8× — a nested closure per level against one statement per level |
| `plan-class-chain-40`                                                         |      184 ns |    1 286 ns | 7.0×                                                              |
| `plan-deps-inlined`                                                           |       16 ns |       33 ns | 2.1×                                                              |
| `plan-escape-factory-dep`                                                     |       92 ns |      126 ns | 1.4×                                                              |
| `transient-class-1-dep`                                                       |       13 ns |       10 ns | the closure wins a two-node plan                                  |
| `realistic-graph-class-resolve-root`                                          |       25 ns |       16 ns | and a ten-node graph of cached singletons                         |
| `fan-out-tree-depth-3-breadth-4`                                              |      578 ns |      532 ns | within noise                                                      |
| `to-resolved-3-deps`, `singleton-class-1-dep`, `realistic-graph-resolve-root` | 5, 6, 49 ns | 5, 5, 48 ns | flat                                                              |

The tier is worth a multiple where a plan is deep — which is what the earlier ladder, run from a fresh container per op,
could not see: a freshly generated function is new code that runs in the baseline tiers for its first thousands of runs,
and the ladder never held one long enough for the optimizer to reach it. The two rows where the closure wins are shallow
graphs whose statements are few enough that a call through the generated function costs more than it saves. Deleting the
tier would cost the deep rows a multiple, so it stays, and its trigger is the one count left in the engine that is
neither a machine width, a contract value nor bind-time data: it is a measured policy — generation repays only after
some thousand runs of one plan in one container — and it is set to 1024 with that ladder as its warrant, labelled as
such at its declaration. The alternatives are the two the brief forbids: no tiering (the table above) or an adaptive
trigger.

### The other constants

| Constant                        | Was                                                                                             | Now                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Kind                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `MASK_WIDTH = 32`               | unlabelled                                                                                      | labelled at its declaration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | (a) the width of a 32-bit integer |
| `ALIAS_HOP_LIMIT = 32`          | a cap on alias folding                                                                          | gone: the fold compares the origin and the current token by hand and keeps a set only of the tokens between them; a one-hop alias allocates nothing and any chain folds exactly (ported from the research branch's measured change; `to-alias-redirect`, `alias-parent-owned-terminal` 9 ns both sides, `alias-cycle-detected` 4 403 against 4 887 ns)                                                                                                                                                               | —                                 |
| `PLAN_DEPTH_LIMIT = 32`         | a depth past which the generator declined                                                       | gone: a generated plan is one statement per node in dependency order, so a plan of any depth is that many statements (`plan-class-chain-40` 207 against 1 443 ns; the 24-level chain and `plan-deps-inlined` unchanged)                                                                                                                                                                                                                                                                                              | —                                 |
| `MULTI_TAG_INDEX_THRESHOLD = 8` | a binding count past which a multi-criterion request walked the tag indexes instead of scanning | gone with the index-union path: probed at every count, the union cost some 250 ns fixed (`multi-tag-slot-resolve` 299 against 73 ns, `mask-accept-two-of-four` 307 against 49) and tied the scan at thirty-two variants (333 against 337); the scan is the one path, and its cost is ten nanoseconds per binding under the token, which the caller controls                                                                                                                                                          | —                                 |
| `PLAN_CODEGEN_THRESHOLD`        | 32                                                                                              | 1024, labelled as the measured policy it is                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | see above                         |
| `RESOLUTION_SET_THRESHOLD = 32` | a depth past which the synchronous cycle check kept a set beside the stack                      | gone: every synchronous lane checks a cycle by the binding's in-flight flag, and a seeded path (a plan's escape, an async level's synchronous call) is marked around the call, idempotently (ported from the research branch; `interpreted-class-chain-40` 5 233 against 6 681 ns, `-24` 2 960 against 3 145; `plan-escape-factory-dep` 115 against 99 ns pays the marking; `nested-context-resolve-in-factory`, `plan-deps-inlined`, `transient-class-1-dep` flat) — see the note below on what its first form cost | —                                 |

**The lane differential test is in the tree**, ported from the research branch with the three engine fixes it found
there (a child's miss classified against its own registry instead of the chain; a sibling on the async interpreted lane
selected against the earlier sibling's frame; a dynamic factory run twice before a self-cycle was reported), each pinned
by a unit test, and it holds every lane of this engine to one snapshot at a hundred runs. It gates every engine change
from here.

## G3 — the warm micro rows

The four micro rows the harness reads at 0.72–0.79× of ditox — `constant-resolve`, `singleton-class-1-dep`,
`resolve-optional-hit`, `to-resolved-3-deps` — read 5 ns per resolve on both libraries in the standalone loop of the
bench's own scenario functions, before and after every slice above. An inline warm answer in the container (the lone
default binding's cached instance or hook-free constant, before the resolver is entered) was tried and reverted: it adds
a map probe to every path that is not warm and helps none that is — `child-depth-1-resolve` 13 against 9 ns,
`transient-class-1-dep` 16 against 13, `nested-context-resolve-in-factory` 23 against 19, the four warm rows 5–6
against 5. The engine's warm lookup is already at the `Map.get` floor; the harness's reading of these rows is not
explained by anything the resolve executes, and finding it means running the harness itself with variants, which this
record defers rather than spend on the machine. It is the one open item in the loss table.

## The accessor row

`accessor-injection-construct` (0.26–0.41× of inversify) measures the benchmark's transpiler, not the engine: `tsx`
lowers the scenario's `accessor` field with esbuild's WeakMap-backed private helpers (`__privateAdd` 37% of the row's
self time, the collector 17% behind it), where inversify's row is a plain property under a legacy decorator. The
engine's own share is a tenth of the row. A compile of the codefast scenarios through `tsc` — which emits native private
fields for the same source — is the harness change that would make the row compare engines; it is proposed, not made,
here.

## G4 — the audit that keeps it so

`codefast audit constants` (new in `@codefast/cli`, gated in CI through `pnpm cli:audit:constants`) reports every
upper-case `const` bound to a number under `packages/di/src` whose comment above it names none of the three kinds a
number may be — the phrases are `a constant of the machine`, `a value the contract fixes`,
`derived from bind-time data`. Sentinels (`0`, `1`, `-1`) are exempt: a value that stands for absence or identity is not
a size. The target and an allowlist live in `codefast.config`; the allowlist names the generated tier's trigger (a
measured policy, the one count this record keeps by name) and a graph export's pixel cell (a viewer's starting layout no
contract fixes).

The numeric constants left in `packages/di/src`, each with its kind:

| Constant                                    |    Value | Kind                                                                                                                          |
| ------------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------- |
| `MASK_WIDTH`                                |       32 | a constant of the machine — the bits of a 32-bit integer                                                                      |
| `NO_TAG_KEYS`                               |        0 | sentinel — the empty mask                                                                                                     |
| `NO_ACTIVATION_STAMP`                       |       −1 | sentinel — no need computed yet                                                                                               |
| `ROOT_BRANCH`, `UNOWNED_BRANCH`             |    0, −1 | sentinels — a branch's depth brands                                                                                           |
| `GRID_CELL_WIDTH_PX`, `GRID_CELL_HEIGHT_PX` | 200, 100 | allowlisted — a graph export's starting cell, which a viewer re-lays out; the column count is derived from the node count now |
| `PLAN_CODEGEN_THRESHOLD`                    |     1024 | allowlisted — a measured policy, warranted above                                                                              |

## G5 — the size budget, not met

| Measure            |              Before |               After |             Budget |
| ------------------ | ------------------: | ------------------: | -----------------: |
| `src/` lines       |              10 885 |              11 134 |                  — |
| `src/` files       |                  45 |                  46 |                  — |
| longest file       | `resolver.ts` 1 948 | `resolver.ts` 1 951 | 500 (resolver 400) |
| `dist/` JavaScript |              321 KB |              332 KB |             160 KB |

Every slice above changed what a path allocates and which algorithm it runs; none reshaped the codebase, and the three
lane fixes, the seeded-path marking and the exact fold added lines. The generated tier stays because deleting it costs
the deep plan rows a multiple (its table is above), so the one large deletion the brief allowed is not available.
Halving `dist/` is a restructuring — the resolver split by lane into modules over one state object, the container's
module and validation surfaces moved out of the hot file, the introspection graph adapters made a separate entry — that
this record did not attempt, because each of its steps is a measured A/B of its own and the budget for measuring was
spent where the losses were. `CONTRIBUTING.md` already opens with how to scope a change; the "add a kind or scope
touches these files" list belongs with that restructuring, when the files it would name are the ones that remain.

## What the user's own command caught

The first full `pnpm di:bench` on the finished tree read **more** losses than the baseline — thirty against twenty-five
— with `child-request-lifecycle-create-resolve-dispose` at 0.96× where it had been 1.34×, `materialize-100-singletons`
0.37× where the slice had measured 1.23×, `production-http-handler` 0.84× from 1.16×, and every cold row worse.
Bisecting the regressed rows across commits with the standalone probe took two minutes and named one commit: the
flag-only cycle check, whose first form linked each resolver-built frame to its binding through a `WeakMap` so a seeded
path could be marked from its frames. A weak-map entry is an ephemeron insert, and every cold container paid one per
binding on its first resolve — `child-request-lifecycle` 373 → 1 701 ns, `materialize-100` 13.9 → 46 µs,
`production-http-handler` 579 → 1 049 ns, with the collector's variance on top. The research branch had measured that
commit on deep chains only, and this record's own probe of it read the deep chains and the warm canaries and no cold
row: the rows with a causal path were listed by the algorithm, not by the allocation.

The frame is now a class that carries its binding in a private field, invisible to the predicate that reads the frame
and to equality in tests, built once per binding as before: the cold rows read as they did before the commit (379, 13
795, 569) and the deep chains keep their gain. Two lessons the record keeps: a slice's causal rows include every row
that allocates what the slice allocates, not only the rows whose algorithm it changes; and the three user commands are
the gate, run once but run — the harness-level A/B and the probe both missed a 4× regression that the first user-facing
run showed in its first table.

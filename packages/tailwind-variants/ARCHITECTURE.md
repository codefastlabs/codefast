# Architecture

The source of truth for why this package is shaped the way it is. Read it before changing anything under `src/compile/`
or `src/resolve/` — several shapes there look simplifiable and are not.

For why the package exists at all — the drop-in stance towards `tailwind-variants`, where its API departs from it, and
the trade this design makes — see [DECISIONS.md](./DECISIONS.md).

## The one idea

A variant configuration is fixed the moment `tv` is called. A resolver is then called once per render, forever. So
everything that depends only on the configuration is settled **once**, and resolution reads the result. The once is a
later call, not `tv` itself: the first calls read the configuration directly — two for a component without slots, where
a cold call costs less than a compile, one for a slot component, where it costs more — so a component defined and
rendered that few times — a cold start, a page that shows it once or twice — never pays for a plan it would not have
used.

```
tv(config) ──▶ resolver ──first calls──▶ cold lane ──next call──▶ VariantPlan ──resolve──▶ "px-4 py-2 bg-primary"
  a wrapper                  reads the configuration        compiled once            every call after
```

The same idea applied a second time: within one configuration, the answer depends only on the selection, and a list
renders the same few selections thousands of times. So a resolution is settled **once per selection**, and a repeat call
is a lookup.

```
props ──encode──▶ selection key ──▶ cache hit ──▶ the same answer, no walk and no merge
```

That split is the directory layout:

| Path                        | Owns                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `types.ts`                  | the model: configurations, variant selections, compiled shapes        |
| `index.ts`                  | the public surface                                                    |
| `tv.ts`                     | the public entry point, and the seam between the phases               |
| `class-names.ts`            | `cx` / `cn` — class utilities, variant-free                           |
| `compile/plan.ts`           | `VariantPlan` and how it is built                                     |
| `compile/compound.ts`       | compound variants and slots as flat condition lists, and testing them |
| `compile/class-values.ts`   | flattening class values into plan form, and reading a variant value   |
| `compile/configuration.ts`  | shape guards, and collapsing an `extend` chain into one configuration |
| `compile/selection.ts`      | encoding a call's selection as one key                                |
| `resolve/cold.ts`           | the cold lane: the first calls, read straight from the configuration  |
| `resolve/variants.ts`       | the flat lane                                                         |
| `resolve/flat-selection.ts` | what the flat lane remembers per selection, caller classes included   |
| `resolve/slots.ts`          | the slot lane                                                         |
| `resolve/cache.ts`          | the bounded store a resolver answers a repeated selection from        |

Testing a compound condition lives in `compile/` rather than `resolve/` because the test and the encoding it reads are
one contract. Splitting them by phase would put the two halves of that contract out of each other's sight.

## What the plan settles, and why each one matters

**Default classes are looked up at compile time.** A resolver call reads `entry.defaultClasses`, a monomorphic field,
instead of `defaults[name]` then `group[value]` — two dictionary lookups on the path taken by every variant the caller
did not pass, which is most of them.

**Compound conditions are flat lists.** Compiling them removes an `Object.keys` allocation _per compound variant per
call_, and resolves each condition's configured fallback once.

**Every class value is flattened to a string before resolution reads it.** This is what lets resolution be nothing but
string concatenation — no intermediate array, no spread, no flattening pass on the walk. The base, the slots, the
compounds and each group's default are flattened when the plan compiles; every other variant value the first time a call
selects it. It is safe because flattening joins each argument's contributions in order and drops the empty ones, so
flattening each value separately gives the same answer as flattening them together.

**A variant value is read one way, everywhere.** `toVariantKey` in `compile/class-values.ts` turns what a caller passed
into the group key every lane reads: a boolean or `0` is spelled as its key, `""`, `NaN` and `0n` read as `"false"`, and
`null`, an array or an object selects nothing. Only `undefined` falls back to the default, and each lane answers that
before asking. Compound conditions likewise share one rule: `undefined`, `null` and `false` satisfy one another, and
anything else must be strictly equal.

**An `extend` chain collapses into one configuration in `tv()`.** `mergeVariantConfigs` joins what parent and child both
declare, the parent's classes first, and lists the child's variant names first, so the plan never knows a chain existed.

**Slot maps carry slot positions, not slot names.** See below.

## The slot lane is inverted, and that is the point

A slot map is sparse: a variant value typically names one to seven of a component's ten or twelve slots. The obvious
implementation — each slot scans every variant and asks "do you have anything for me?" — therefore spends most of its
lookups missing.

So the loop runs the other way. Each compiled value carries the _indices_ of the slots it targets, and one pass
distributes classes into a per-slot buffer shared by every resolver of that call. A slot called without its own props
then just reads its entry.

Per-slot props are the exception: they can select different variant values and flip a compound's conditions, so a slot
called with a variant prop of its own re-resolves from scratch (`resolveSlotWithOverrides`). That lane is deliberately
the slow one. A slot prop left `null` or `undefined` keeps the call's selection there, and compound variants and
compound slots test the slot's props before the call's.

**`base` is always slot position zero.** The plan synthesises it whether or not the configuration declares it, which is
why a plain string class value can be assigned to `texts[0]` without a lookup.

## The cold lane answers exactly what the plan answers

The first calls have no plan, so `resolve/cold.ts` walks the configuration itself. It is a second statement of the
resolution rules, and every rule the plan settles at compile time it applies inline instead. The two share the pieces a
rule lives in — `toVariantKey` and `toDefaultKey` for what a value selects, `pickClassProp` for what a call or a
compound contributes, and the same absent-value rule for its conditions — and restate only the walk: a missing selection
takes the configured default's key, or `"false"` without one; a slot prop left `null` or `undefined` keeps the call's
selection; compound variants and compound slots read a slot's own props, then the call's, then the configured default.
Where the plan reads a compiled group with no prototype, or a string-only flat group behind a type check, the cold lane
guards each read with `Object.hasOwn`, which is the same answer paid per read instead of per definition. A cold slot
call copies the props its slots read when the resolver is called, so a caller who reuses the props object cannot change
what a slot read later resolves to.

Two things follow. The cold lane's answer is not remembered: the store belongs to the plan, so identity of a slot object
holds from the second call on, and a caller who wants it warm renders twice. And the cold lane is held to the plan by
the behaviour sweep, which drives the whole corpus through a fresh resolver per call and requires every outcome to equal
the compiled one — the only proof this file accepts that the two statements of the rules agree.

## What the selection key may and may not collapse

A key is a mixed-radix number, one digit per variant. Two calls sharing a key must be indistinguishable to _everything_
downstream, and there are two different notions of "same value":

- **Resolution** only reads `entry.group[key]`, so two values with the same group key select the same classes and can
  share a digit — cheap, because it is an object read.
- **A compound** compares against the value the caller passed. `true` and `"true"` share the group key `"true"` and
  compare differently, so on any variant a compound tests, each **value the compounds compare against** gets an id of
  its own, found in a `Map` keyed by SameValueZero — the partition every condition kind draws, `NaN` included. Such a
  value also fixes its group key, so these ids come first and group ids follow, adding to the radix rather than
  multiplying it. A value no compound names fails every condition alike and takes its group key's id. The answer is
  remembered per raw value in a second `Map`, so a repeated call costs one `Map.get` on those axes only.

Everything else follows from having to make that distinction hold:

- Id zero stands for the default: a call that omits the variant, and one that passes the value an omitted one resolves
  as. On an axis no compound reads, that is the default's group key, since resolution reads only the key; on one a
  compound reads, it is the configured default exactly as written and nothing else, since a compound compares the raw
  value. So a page mixing `size: "md"` with no `size` at all fills one entry, not two.
- Every value the group does not answer shares one id, because they all resolve to no classes — a value that selects
  nothing (`null`, an array, an object) included. On an axis a compound reads, `null` and `false` keep ids of their own
  when a condition matches an absent value, since they satisfy that condition and the other values the group does not
  answer do not.
- An own key the encoder did not count when sizing the axis — a non-enumerable or symbol-keyed one, or one added to the
  group after compile — can need an id past the radix. The encoder reports that selection as `UNENCODABLE` instead, and
  the call resolves without the store.
- A compound may test a name no variant declares. That name still decides the outcome, so it gets an axis of its own.
- Every axis is therefore finite, sized by the configuration rather than by what callers pass, so no stream of distinct
  values can exhaust one. The per-raw-value `Map` keeps every value the configuration names and only a few others, so it
  stays bounded too. A selection space past one safe integer spans several, joined into a string key, so a large
  configuration stays cached instead of resolving the long way on every call.
- The store keeps two generations rather than an LRU: eviction is one pointer move on overflow instead of bookkeeping on
  every hit, and the retired generation keeps a working set slightly over the limit from thrashing. A hit in the retired
  generation promotes the entry into the current one and counts toward its limit as a store does, so a working set
  larger than the limit, read back over and over, still retires generations and stays bounded.
- The limit is a weight, not an entry count: `GENERATION_LIMIT` is 2048, every entry weighs one, and each caller class a
  flat-lane entry remembers is charged one more, again when a promotion carries it into the current generation. It is
  sized for a component whose selections come from data, not only from call sites: what a component can fill is its
  distinct selections times the classes callers pass it, and a table cell keyed by a row's status and a column's
  alignment fills far more than any count of call sites suggests. Past the working set every miss falls through to the
  merge engine, which is the slowest thing a call can reach, so the limit errs high; a `Map` grows only as entries
  arrive, so a component that never fills it pays nothing for the headroom.
- Ids are handed out as values turn up rather than up front, so a group of two hundred values costs nothing to compile
  and only what a caller actually selects to run.
- `valueIds` is a **null-prototype** object, and so is every compiled variant group and the slot index map. A plain
  object answers `group["toString"]` with a function rather than `undefined`, and a caller chooses that key by passing
  it as a variant value; `"__proto__"` hands the slot lane `Object.prototype` to read slot positions off. The slot lane
  therefore always reads its own compiled group. The flat lane accepts only a string it reads, so a group whose values
  are all strings on a plain prototype is read in place, and the encoder asks `Object.hasOwn` of the configuration's own
  group before it hands a value an id.

## Shapes that are load-bearing

- **The flat store is keyed by the selection, and a caller's class lives inside it.** A selection's answer is stored as
  a plain string until a caller passes a class string; only then does its entry become a record holding the joined and
  merged text and the classes it has met. A hit therefore builds no key, and a component nobody passes a class to never
  allocates the record.
- **A caller's class is remembered from its second sighting, and only so many per selection.** A small per-resolver
  doorkeeper of hashed class strings, allocated on the first class, keeps one-off strings out of the store, and a
  selection stops remembering classes past a fixed count, because the store promotes a live entry whole and would
  otherwise carry an ever-growing map with it. Their merge goes through `twMerge` like every other: the engine's `cn`
  would skip its whole-string probe, but pulls its argument cache into every bundle that renders a variant, for no gain
  this row could measure.
- **A caller's class is merged onto the joined text until the merged answer is proven a safe prefix.** The engine's
  conflict table is not transitive: a class one merge drops can come back once a caller's class overrides what dropped
  it, and a merge of the whole keeps it. The merged answer is therefore reused as the prefix only when merging the
  selection dropped nothing but repeats. That check costs more than one shorter merge saves, so a selection runs it
  once, after it has met a few classes it did not remember, and only under the default `twMerge`; until then, and for
  good when the check fails or the merge is the caller's own, a caller's class merges onto the joined text.
- **`selectForSlot` stays out of line.** Inlining it by hand measured slower on every slot scenario — the engine already
  inlines it, and the larger caller falls out of the shape it optimises.
- **The flat lane accepts only a string it reads.** A configuration without slots compiles every class value to a
  string, so the per-slot form cannot reach that code — and a string-only group is the caller's own object, whose
  inherited members the type check is what keeps out. Loosening it to a truthiness check reintroduces both.
- **`toClassText` is not a wrapper around the flattener.** Its string check is what keeps the common case out of it
  entirely, at compile time and for the runtime `class`/`className` prop.
- **The flattener in `class-names.ts` reproduces clsx exactly, corners included** — a `bigint` contributes nothing
  though the type admits one, and object keys are read with `for…in`. Matching clsx is the contract, so the package
  ships no runtime dependency of its own and every class value means what it means upstream. A randomized unit test
  holds it there: `cx` against a transcription of clsx's algorithm, and `cn` against `tailwind-merge` over that join.
- **A supplied merge's `cn` keys its memo on the strings the caller passed, never on their join.** The default `cn` is
  the engine's own, which caches whole calls; a `createTV` factory with a merge of the caller's wraps it in
  `createMergingCn` instead. A static class list and a `className` keep the hashes V8 already computed for them, so a
  repeated pair costs two `Map` reads; a freshly joined string has to be flattened and hashed before any cache, the
  merge engine's included, can answer it. Only a call of exactly two strings is remembered — one string is already a
  cached-hash hit in the merge engine — and a first class earns a bucket only on its second sighting, so one-off calls
  stay close to what the merge alone costs.
- **`cx` joins in one pass.** A value that is not a string continues the join from where it stands; restarting from the
  first argument re-joins everything before it.
- **A slot call context keeps `conditionValues`, not the caller's props.** A cached resolver outlives its call, and the
  props object a component passes carries `children` — most of a tree. Only the names a compound tests are copied out,
  and a configuration without compounds shares one empty object.
- **The per-slot memo marks an unread slot with a sentinel, not a falsy test.** A slot that resolves to nothing memoises
  `""`, which is falsy like an empty slot of the array; reading the memo by truthiness would merge that slot again on
  every read.
- **A slot call that selects nothing reads the call's shared text.** A sub-component calls its slot with the `className`
  it was given, usually absent, so props carrying only `class` or `className` skip the per-slot re-resolve: an empty
  class returns the memoised answer, and any other merges the shared text with it. Only a prop that is not a class — a
  variant, or a name a compound tests — sends the slot down the override path.
- **A resolver returns the same slot object for a repeated selection.** That is the point — the merge per slot happens
  once — and it makes the object shared, so nothing may mutate it.

## The trade this design makes

The plan is the expensive end, and it is paid on a later call rather than in `tv`. `define-only-*` prices `tv` itself,
`first-render-*` a definition plus the cold lane, and `two-renders-*` and `three-renders-*` a definition through the
call that compiles; all are controls off the aggregates. The resolution rows price the plan, and a component that
renders more than a handful of times earns its plan back on the `repeat-*` shape — read those rows, not a figure written
here, for what any of this costs today.

Three things keep the compiling call from paying more than it must, and all are worth preserving: the selection encoder
hands out ids as values turn up rather than up front; a flat-lane group whose values are all strings is read in place
rather than copied, behind the type check the flat lane already makes; and every other group starts empty and compiles a
value the first time a call selects it, reading `entry.group[key] ?? compileGroupValue(entry, key)`. So a group of two
hundred values costs nothing to compile and only what a caller actually selects to run, and the default — the one value
every call without a selection reads — is the only one compiled up front.

If the compiling call ever needs to come down further, what is left in `compileVariantPlan` is the compound conditions
and the slot entries. The compiling call has no row of its own; compare it with a cold one by hand. Without slots it is
`three-renders-simple` less `two-renders-simple`, since the third call is the one that compiles, against
`first-render-simple` less `define-only-simple` for a cold call; with slots, `two-renders-slots` less
`first-render-slots`. `first-render-cold-simple` and `first-render-cold-slots` price the same cold call with every merge
a miss in the engine's cache, the case a fresh page load meets.

## How much of this a page can actually feel

Every row above is a microbenchmark, and a whole page bounds what any of them is worth. Rendering `apps/web`'s registry
demos through `renderToString` — the densest page this repository can assemble — spends a sliver of its time in resolver
calls, and what the cache saves there sits below the run-to-run noise of the render itself.

That is not an argument against the work — the library is measurably faster, and a consumer with a heavier variant load
than this one gets more of it. It is an argument about where to spend next: resolution is not what a page waits on, so a
further micro-optimisation here buys a fraction of a fraction of the render. Anyone about to open this file to shave
nanoseconds should read this paragraph first and go find a bigger cost somewhere else.

`cacheResolutions: false` may not be free: the slot lane still allocates a per-slot memo, and
`uncached-slots-with-merge` has read slower than a build without the cache. That is also the suite's least stable row,
and the cost was never isolated from it — treat the allocation as a suspect, not a finding. Nothing in this repository
passes the option, which is why it stays one. The memo itself is not wasted under the option: the propless path reads it
on every slot call, so it still pays for a caller that reads one slot twice.

## Changing any of this

Resolution is a hot path and it is layout-sensitive: reshaping a function has moved rows the change could not reach.
Treat every edit under `resolve/`, and any reshape of `compileVariantPlan`, as a performance change requiring a paired
A/B. The method is in
[`benchmarks/di/BENCH_GUIDE.md`](../../benchmarks/di/BENCH_GUIDE.md#comparing-two-builds-paired-alternating-best-of),
and this suite runs it the same way:

- **`bench:ab` first.** It materialises `packages/tailwind-variants/src` for each side — a git ref, or the working tree
  for the new one — measures the rows named, alternates which side goes first, and prints the ratio and each side's
  spread, restoring the working tree on any exit:

  ```bash
  pnpm --filter @benchmark/tailwind-variants bench:ab -- slots-without-merge,repeat-slots-with-merge --base main
  ```

  `--base` defaults to `HEAD~1` and the new side to the working tree.

- **Swap the source by hand** only for a comparison the driver does not cover: check out or stash
  `packages/tailwind-variants/src` per side, then run `BENCH_ONLY=<id> pnpm bench`. That runner rebuilds the package
  before sampling, which is exactly what makes the swap take effect.
- **Swap the build** only when a side cannot be checked out — a published version, a `dist` archived outside the tree.
  Copy each prebuilt `dist` over `packages/tailwind-variants/dist` and drive the child entry directly, one scenario at a
  time:

  ```bash
  BENCH_ONLY=slots-without-merge node --import tsx/esm src/codefast-benches.ts
  ```

  The child entry is mandatory here. `bench` and `bench:fast` both run `src/harness/run.ts`, whose unconditional rebuild
  would overwrite the swapped `dist` from `src` — both sides then measure the same build and every row reports parity.

Scenario ids come from `pnpm --filter @benchmark/tailwind-variants bench:list`.

**Read the right row for what you changed.** Every prop fixture repeats its selections, so with the cache on almost
every row measures a lookup rather than the resolver:

- `uncached-*` runs with `cacheResolutions: false` and is the row to read for the plan walk. A change under `resolve/`
  that does not move it did not do what you think. It has no counterpart in a library without the same switch, so its
  ratio column is meaningless — it is a control, and it is off the aggregates for that reason.
- `repeat-*` is the shape a UI actually has: three selections, fresh props objects, over and over.
- `define-only-*` prices `tv` alone and `first-render-*` a definition plus its first render, which is the cold lane;
  both are per component definition where everything else is per render, so both are off the aggregates too. Neither
  touches the plan — a change under `compile/` shows up in `two-renders-*` and `three-renders-*`, between a fresh
  resolver's compiling call and a cold one.

Rows here are batched loops, so the noise floor is tighter than the DI suite's, but it is still a floor to measure, not
to assume: run an A/A pass on unchanged code before reading a small ratio as signal, as
[the guide describes](../../benchmarks/di/BENCH_GUIDE.md#measure-the-floor-before-you-set-the-threshold), and re-measure
anything near it with more passes. A row with no causal path to a change can still move by noise. The slot rows carry
the widest per-trial spread and swing across runs on unchanged code; do not read a single one closely.

Correctness is not checked by the hand-written tests alone. They assert the behaviour someone thought to write down, and
the changes that hurt here are the ones nobody considered.

[`tests/unit/support/behaviour-sweep.ts`](./tests/unit/support/behaviour-sweep.ts) generates the corpus instead — every
variant value, every pair, every slot with each variant overridden per slot, every odd value a caller can pass including
the inherited keys of a plain object, caller classes that recur, and selection spaces wide enough to fill the store past
its generation limit — and runs the whole thing twice, because a resolver that remembers must answer the second pass
exactly as it answered the first.

[`tests/unit/tv/behaviour-sweep.test.ts`](./tests/unit/tv/behaviour-sweep.test.ts) then holds the corpus to a property
that needs no stored baseline: **a resolver that remembers must answer exactly what one that does not answers.** That is
what caught the selection cache collapsing `toString`, `constructor` and `hasOwnProperty` onto one entry while every
other test stayed green, and it runs on every `pnpm test:unit`. A second property holds the cold lane to the plan:
driven through a fresh resolver per call, the corpus must answer exactly what a shared one does.

The first property cannot see a change that moves the remembering and the uncached flat lanes together, such as a
reshape of `joinVariantClasses`, which both join a selection through; the second can, because the cold lane walks the
configuration itself. Neither can see a change every lane shares, such as one to `toVariantKey`: for that, run
`collectSweepOutcomes` under each build and diff the two, which is what the properties do across an option rather than
across a version.

## License

Released under the [MIT License](./LICENSE).

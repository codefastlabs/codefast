# Architecture

The source of truth for why this package is shaped the way it is. Read it before changing anything under `src/compile/`
or `src/resolve/` — several shapes there look simplifiable and are not.

For why the package exists at all — the comparison against `tailwind-variants` and `cva`, and the type-inference
trade-offs that settled the API — see [DECISIONS.md](./DECISIONS.md), which is a historical design record rather than a
description of the current code.

## The one idea

A variant configuration is fixed the moment `tv` is called. A resolver is then called once per render, forever. So
everything that depends only on the configuration is settled **once**, in `tv`, and resolution reads the result.

```
tv(config)  ──compile──▶  VariantPlan  ──resolve──▶  "px-4 py-2 bg-primary"
   once                                   per call
```

The same idea applied a second time: within one configuration, the answer depends only on the selection, and a list
renders the same few selections thousands of times. So a resolution is settled **once per selection**, and a repeat call
is a lookup.

```
props ──encode──▶ selection key ──▶ cache hit ──▶ the same answer, no walk and no merge
```

That split is the directory layout:

| Path                       | Owns                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| `types.ts`                 | the model: configurations, variant selections, compiled shapes        |
| `tv.ts`                    | the public entry point, and the seam between the phases               |
| `class-names.ts`           | `cx` / `cn` / `createTailwindMergeFn` — class utilities, variant-free |
| `compile/plan.ts`          | `VariantPlan` and how it is built                                     |
| `compile/compound.ts`      | compound variants and slots as flat condition lists, and testing them |
| `compile/class-values.ts`  | flattening configuration class values into plan form                  |
| `compile/configuration.ts` | shape guards, and collapsing an `extend` chain into one configuration |
| `compile/selection.ts`     | encoding a call's selection as one number                             |
| `resolve/variants.ts`      | the flat lane                                                         |
| `resolve/slots.ts`         | the slot lane                                                         |
| `resolve/cache.ts`         | the bounded store a resolver answers a repeated selection from        |

Testing a compound condition lives in `compile/` rather than `resolve/` because the test and the encoding it reads are
one contract. Splitting them by phase would put the two halves of that contract out of each other's sight.

## What the plan settles, and why each one matters

**Default classes are looked up at compile time.** A resolver call reads `entry.defaultClasses`, a monomorphic field,
instead of `defaults[name]` then `group[value]` — two dictionary lookups on the path taken by every variant the caller
did not pass, which is most of them.

**Compound conditions are flat lists.** Compiling them removes an `Object.keys` allocation _per compound variant per
call_, and resolves each condition's configured fallback once.

**Every class value is flattened to a string.** This is what lets resolution be nothing but string concatenation — no
intermediate array, no spread, no flattening pass at runtime. It is safe because flattening joins each argument's
contributions in order and drops the empty ones, so flattening each value separately gives the same answer as flattening
them together.

**Slot maps carry slot positions, not slot names.** See below.

## The slot lane is inverted, and that is the point

A slot map is sparse: a variant value typically names one to seven of a component's ten or twelve slots. The obvious
implementation — each slot scans every variant and asks "do you have anything for me?" — therefore spends most of its
lookups missing.

So the loop runs the other way. Each compiled value carries the _indices_ of the slots it targets, and one pass
distributes classes into a per-slot buffer shared by every resolver of that call. A slot called without its own props
then just reads its entry.

Per-slot props are the exception: they can select different variant values and flip a compound's conditions, so a slot
called with props re-resolves from scratch (`resolveSlotWithOverrides`). That lane is deliberately the slow one.

**`base` is always slot position zero.** The plan synthesises it whether or not the configuration declares it, which is
why a plain string class value can be assigned to `texts[0]` without a lookup.

## What the selection key may and may not collapse

A key is a mixed-radix number, one digit per variant. Two calls sharing a key must be indistinguishable to _everything_
downstream, and there are two different notions of "same value":

- **Resolution** only reads `entry.group[key]`, so two values with the same group key select the same classes and can
  share a digit. A digit is therefore the group key's id — cheap, because it is an object read.
- **A compound** compares against the value the caller passed. `true` and `"true"` share the group key `"true"` and
  compare differently, so for any variant a compound tests, a digit is instead the id of the **raw value**, held in a
  `Map` (which distinguishes them, and `0` from `"0"`). That costs a `Map.get` on those axes only.

Everything else follows from having to make that distinction hold:

- A digit is reserved for "the call omitted this variant", distinct from every value, because an omitted variant takes
  the compiled default and a compound reads its configured fallback.
- Every value the group does not answer shares one id, because they all resolve to no classes.
- A compound may test a name no variant declares. That name still decides the outcome, so it gets an axis of its own.
- A raw-value axis is capped. Past the cap the call reports itself unencodable and resolves the long way, which is also
  what a configuration too large to address in one safe integer does.
- The store's generation limit is sized against what a design system actually asks for, not a guess. A key is one
  selection plus the caller's own class string, so the entries a component can fill is the number of distinct call sites
  it has. Across this repository's 800 `.tsx` files the busiest component reaches fifty, and none exceeds the limit. Two
  generations then mean nothing in a real page is ever evicted, and the caller's class needs no tier of its own.
- Ids are handed out as values turn up rather than up front, so a group of two hundred values costs nothing to compile
  and only what a caller actually selects to run.
- `valueIds` is a **null-prototype** object, and so is every compiled variant group and the slot index map. A plain
  object answers `group["toString"]` with a function rather than `undefined`, and a caller chooses that key by passing
  it as a variant value: the flat lane concatenates the function's source text, and `"__proto__"` hands the slot lane
  `Object.prototype` to read slot positions off. Copying a group key by key onto a prototype-less object costs roughly
  twice what reusing the source object did, which is the price of the whole class of bug and is paid once per component
  definition. Both bulk alternatives measured about four times the key-by-key loop.

## Shapes that are load-bearing

- **`selectForSlot` stays out of line.** Inlining it by hand measured slower on every slot scenario — the engine already
  inlines it, and the larger caller falls out of the shape it optimises.
- **The flat lane casts `PlanClasses` to `string`.** A configuration without slots compiles every class value to a
  string, so the per-slot form cannot reach that code. The cast encodes an invariant the compiler cannot see, not a
  shortcut.
- **`toClassText` is not a wrapper around the flattener.** Its string check is what keeps the common case out of it
  entirely, at compile time and for the runtime `class`/`className` prop.
- **The flattener in `class-names.ts` reproduces clsx exactly, corners included** — a `bigint` contributes nothing
  though the type admits one, and object keys are read with `for…in`. It replaced the dependency, so matching it is the
  contract; the behaviour sweep run against the build that still had clsx is what holds it there.
- **A slot call context keeps `conditionValues`, not the caller's props.** A cached resolver outlives its call, and the
  props object a component passes carries `children` — most of a tree. Only the names a compound tests are copied out,
  and a configuration without compounds shares one empty object.
- **The per-slot memo holds `undefined` and a sentinel apart.** A slot that resolves to nothing and a slot nobody has
  read yet are both absent from an array of strings, and they are not the same.
- **A resolver returns the same slot object for a repeated selection.** That is the point — the merge per slot happens
  once — and it makes the object shared, so nothing may mutate it.

## The trade this design makes

`tv` is the expensive end. It flattens every class value, precomputes slot positions and copies every variant group onto
a prototype-less object, and the `construct-*` rows — added because the other scenarios hoist `tv` out of the timed loop
and so could never see it — put the cost at **0.24× of `tailwind-variants` for a flat component and roughly a fifth for
a slot one**. Read the slot figure loosely: the harness marks that cell unstable in most runs, which is the same reason
this file tells you not to read a single slot row closely.

That is the deliberate shape of the design, not a defect. The same run measures resolution at 4.2× to 118× upstream, so
a component pays for its definition within a render or two.

Two later changes widened the trade rather than the design itself. The selection cache added about a quarter of a
microsecond per definition, and the prototype-less copy roughly doubled what was left — the flat row went from 0.47× to
0.24× on that alone. Two things keep the first of those small, and both are worth preserving: the encoder is compiled on
first resolution rather than in `tv`, so a component defined and never rendered pays nothing, and value ids are handed
out as values turn up rather than up front.

If construction ever needs to come down, that is where to look, and `construct-*` is the row to read.

## How much of this a page can actually feel

Every figure above is a microbenchmark, and one measurement bounds what any of them is worth. Rendering `apps/ui`'s
registry demos through `renderToString` — sixty-eight components, the densest page this repository can assemble — takes
about 15 ms and makes **266 resolver calls**. At the ~95 ns a call the cache saves on those configurations, the whole
cache is worth **~25 µs, or 0.17% of the render**. Three runs of the identical build spread 1.15 ms, so the effect sits
roughly four times below the noise it would have to clear to be seen at all.

That is not an argument against the work — the library is measurably faster, and a consumer with a heavier variant load
than this one gets more of it. It is an argument about where to spend next: resolution is no longer what a page waits
on, so a further micro-optimisation here buys a fraction of a fraction of a percent. Anyone about to open this file to
shave nanoseconds should read this paragraph first and go find a bigger number somewhere else.

`cacheResolutions: false` may not be free: the slot lane still allocates a per-slot memo, and
`uncached-slots-with-merge` has read 0.89–0.99 against the build before the cache existed. That is also the suite's
least stable row, and the cost was never isolated from it — treat the allocation as a suspect, not a finding. Nothing in
this repository passes the option, which is why it stayed one. The memo itself is not wasted under the option: the
propless path reads it on every slot call, so it still pays for a caller that reads one slot twice.

## Changing any of this

Resolution is a hot path and it is layout-sensitive: reshaping a function has moved rows the change could not reach.
Treat every edit under `resolve/`, and any reshape of `compileVariantPlan`, as a performance change requiring a paired
A/B. The method is in [`benchmarks/di-inversify/BENCH_GUIDE.md`](../../benchmarks/di-inversify/BENCH_GUIDE.md); both of
the mechanisms it describes work here, and **pairing them wrong fails silently**:

- **Swap the source** — check out or stash `packages/tailwind-variants/src` per side, then run `bench:isolate`. That
  runner rebuilds the package before sampling, which is exactly what makes the swap take effect.
- **Swap the build** — copy a prebuilt `dist` over `packages/tailwind-variants/dist` per side, then drive the child
  entry directly, one scenario at a time:

  ```bash
  BENCH_ONLY=slots-without-merge node --import tsx/esm src/codefast-benches.ts
  ```

  The child entry is mandatory here. `bench`, `bench:isolate`, `bench:fast`, `bench:full` and `bench:verbose` all run
  `src/harness/run.ts`, whose unconditional rebuild would overwrite the swapped `dist` from `src` — both sides then
  measure the same build and every row reports parity.

Scenario ids come from `BENCH_LIST=1`.

**Read the right row for what you changed.** Every prop fixture repeats its selections, so with the cache on almost
every row now measures a lookup rather than the resolver:

- `uncached-*` runs with `cacheResolutions: false` and is the row to read for the plan walk. A change under `resolve/`
  that does not move it did not do what you think. It has no counterpart in a library without the same switch, so its
  ratio column is meaningless — it is a control, and it is off the aggregates for that reason. `construct-*` measures
  the walk too, since each of its definitions resolves once against an empty cache, but it measures compilation
  alongside it.
- `repeat-*` is the shape a UI actually has: three selections, fresh props objects, over and over.
- `construct-*` is per component definition where everything else is per render, so it is off the aggregates too.

Rows here are batched loops, so the noise floor is tighter than the DI suite's: an A/A run put every median within
±0.6%. Treat a ratio at or above 1.03× as signal, and re-measure anything smaller with more passes before believing it —
a flat-lane row with no causal path to a slot change once read 0.979 over three passes and 1.013 over five. The slot
rows carry the widest per-trial IQR and have swung 0.91 to 0.99 across runs on unchanged code; do not read a single one
closely.

Correctness is not checked by the hand-written tests alone. They assert the behaviour someone thought to write down, and
the changes that hurt here are the ones nobody considered.

[`tests/unit/support/behaviour-sweep.ts`](./tests/unit/support/behaviour-sweep.ts) generates the corpus instead — every
variant value, every pair, every slot with and without per-slot props, every odd value a caller can pass including the
inherited keys of a plain object — and runs the whole thing twice, because a resolver that remembers must answer the
second pass exactly as it answered the first. Over fifty thousand outcomes, in well under a second.

[`tests/unit/common/behaviour-sweep.test.ts`](./tests/unit/common/behaviour-sweep.test.ts) then holds the corpus to a
property that needs no stored baseline: **a resolver that remembers must answer exactly what one that does not
answers.** That is what caught the selection cache collapsing `toString`, `constructor` and `hasOwnProperty` onto one
entry while every other test stayed green, and it now runs on every `pnpm test:unit`.

For a change the property cannot see — one that moves both lanes together, such as a reshape of `resolveVariantClasses`
— run `collectSweepOutcomes` under each build and diff the two, which is what the property does across an option rather
than across a version.

## License

Released under the [MIT License](./LICENSE).

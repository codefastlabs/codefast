# Architecture

The source of truth for why this package is shaped the way it is. Read it before changing anything
under `src/compile/` or `src/resolve/` — several shapes there look simplifiable and are not.

## The one idea

A variant configuration is fixed the moment `tv` is called. A resolver is then called once per
render, forever. So everything that depends only on the configuration is settled **once**, in `tv`,
and resolution reads the result.

```
tv(config)  ──compile──▶  VariantPlan  ──resolve──▶  "px-4 py-2 bg-primary"
   once                                   per call
```

That split is the directory layout:

| Path                       | Owns                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| `types.ts`                 | the model: configurations, variant selections, compiled shapes        |
| `tv.ts`                    | the public entry point, and the seam between the two phases           |
| `class-names.ts`           | `cx` / `cn` / `createTailwindMergeFn` — class utilities, variant-free |
| `compile/plan.ts`          | `VariantPlan` and how it is built                                     |
| `compile/compound.ts`      | compound variants and slots as flat condition lists, and testing them |
| `compile/class-values.ts`  | flattening configuration class values into plan form                  |
| `compile/configuration.ts` | shape guards, and collapsing an `extend` chain into one configuration |
| `resolve/variants.ts`      | the flat lane                                                         |
| `resolve/slots.ts`         | the slot lane                                                         |

Testing a compound condition lives in `compile/` rather than `resolve/` because the test and the
encoding it reads are one contract. Splitting them by phase would put the two halves of that
contract out of each other's sight.

## What the plan settles, and why each one matters

**Default classes are looked up at compile time.** A resolver call reads `entry.defaultClasses`, a
monomorphic field, instead of `defaults[name]` then `group[value]` — two dictionary lookups on the
path taken by every variant the caller did not pass, which is most of them.

**Compound conditions are flat lists.** Compiling them removes an `Object.keys` allocation _per
compound variant per call_, and resolves each condition's configured fallback once.

**Every class value is flattened to a string.** This is what lets resolution be nothing but string
concatenation — no intermediate array, no spread, no clsx at runtime. It is safe because clsx joins
its arguments' contributions in order and drops the empty ones, so flattening each value separately
gives the same answer as flattening them together.

**Slot maps carry slot positions, not slot names.** See below.

## The slot lane is inverted, and that is the point

A slot map is sparse: a variant value typically names one to seven of a component's ten or twelve
slots. The obvious implementation — each slot scans every variant and asks "do you have anything for
me?" — therefore spends most of its lookups missing.

So the loop runs the other way. Each compiled value carries the _indices_ of the slots it targets,
and one pass distributes classes into a per-slot buffer shared by every resolver of that call. A slot
called without its own props then just reads its entry.

Per-slot props are the exception: they can select different variant values and flip a compound's
conditions, so a slot called with props re-resolves from scratch (`resolveSlotWithOverrides`). That
lane is deliberately the slow one.

**`base` is always slot position zero.** The plan synthesises it whether or not the configuration
declares it, which is why a plain string class value can be assigned to `texts[0]` without a lookup.

## Shapes that are load-bearing

- **`selectForSlot` stays out of line.** Inlining it by hand measured slower on every slot scenario
  — the engine already inlines it, and the larger caller falls out of the shape it optimises.
- **The flat lane casts `PlanClasses` to `string`.** A configuration without slots compiles every
  class value to a string, so the per-slot form cannot reach that code. The cast encodes an
  invariant the compiler cannot see, not a shortcut.
- **`toClassText` is not a wrapper around clsx.** Its string check is what keeps the common case off
  clsx entirely, at compile time and for the runtime `class`/`className` prop.

## The trade this design makes

`tv` costs more than it used to — it flattens every class value and precomputes slot positions.
That is once per component definition, at module load, against a resolution that is several times
cheaper on every call. It pays for itself within a couple of renders, and the scenario benchmarks
cannot see it because they hoist `tv` out of the timed loop. Measure construction separately when
changing compile-time work.

## Changing any of this

Resolution is a hot path and it is layout-sensitive: reshaping a function has moved rows the change
could not reach. Treat every edit under `resolve/`, and any reshape of `compileVariantPlan`, as a
performance change requiring a paired A/B. The method is in
[`benchmarks/di-inversify/BENCH_GUIDE.md`](../../benchmarks/di-inversify/BENCH_GUIDE.md); both of the
mechanisms it describes work here, and **pairing them wrong fails silently**:

- **Swap the source** — check out or stash `packages/tailwind-variants/src` per side, then run
  `bench:isolate`. That runner rebuilds the package before sampling, which is exactly what makes the
  swap take effect.
- **Swap the build** — copy a prebuilt `dist` over `packages/tailwind-variants/dist` per side, then
  drive the child entry directly, one scenario at a time:

  ```bash
  BENCH_ONLY=slots-without-merge node --import tsx/esm src/codefast-benches.ts
  ```

  The child entry is mandatory here. `bench`, `bench:isolate`, `bench:fast`, `bench:full` and
  `bench:verbose` all run `src/harness/run.ts`, whose unconditional rebuild would overwrite the
  swapped `dist` from `src` — both sides then measure the same build and every row reports parity.

Scenario ids come from `BENCH_LIST=1`.

Rows here are batched loops, so the noise floor is tighter than the DI suite's: an A/A run put every
median within ±0.6%. Treat a ratio at or above 1.03× as signal, and re-measure anything smaller with
more passes before believing it — a flat-lane row with no causal path to a slot change once read
0.979 over three passes and 1.013 over five.

Correctness is checked by differential dump rather than by the unit tests alone: run every fixture,
prop sweep, slot-props combination and edge configuration through two builds in separate processes
and diff the outputs. The suite passed the compiled-plan rewrite on the first run while the dump
still surfaced a real behavioural delta.

---
"@codefast/tailwind-variants": minor
---

Compile the configuration once, in `tv`, instead of re-deriving it on every resolver call.

`tv` now builds a plan. Variant groups become an array of entries whose default classes are already looked up, compound variants become flat condition lists whose fallbacks are already resolved, and every class value is flattened to a string. Resolution reads monomorphic fields and concatenates strings, so the per-call work that used to happen — `Object.keys` per compound variant, a dictionary lookup per variant per slot, an intermediate array plus a spread into `clsx` — is gone.

Slot resolution is also inverted. A slot map names only a few slots, so having each of N slots scan every variant meant mostly-missing lookups. Each variant value now carries the slot positions it targets, and one pass distributes classes into a per-slot buffer that every resolver of that call shares; a slot called without its own props just reads its entry. Compound slots ride the same pass.

Measured against the previous release on `benchmarks/tailwind-variants` (paired A/B, one subprocess per side per scenario, three passes with the order alternated, median of per-pass ratios): every one of the sixteen scenarios is faster, geometric mean **2.86×**.

| shape                                          | without `tailwind-merge` |        with |
| ---------------------------------------------- | -----------------------: | ----------: |
| `extreme-slots`                                |                    9.64× |       5.99× |
| `slots`                                        |                    5.55× |       3.48× |
| `compound-slots`                               |                    4.94× |       3.21× |
| `complex`                                      |                    2.59× |       2.00× |
| `simple` / `extends` / `create-tv` / `extreme` |              2.22×–2.33× | 1.56×–1.89× |

The merge-enabled rows gain least because merging, not resolution, is what is left in them. The suite's A/A noise floor on the same machine is ±1%.

The trade is a slower `tv` call: flattening every class value and precomputing slot positions costs roughly 400ns more for a simple config and ~3.4µs for a ten-slot one. That is once per component definition, at module load, and against a slot resolution that got ~1.6µs cheaper it pays for itself after about two renders.

One behavioural change, in a corner: a configuration whose classes are all truthy but render to nothing — `tv({ base: {} })` — now returns `undefined` with `twMerge` enabled, where it previously returned `""`. It already returned `undefined` with `twMerge` disabled, so `undefined` is now what "no classes" means either way.

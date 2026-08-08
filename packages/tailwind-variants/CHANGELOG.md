# @codefast/tailwind-variants

## 0.6.0

### Minor Changes

- [#700](https://github.com/codefastlabs/codefast/pull/700) [`ea48ae2`](https://github.com/codefastlabs/codefast/commit/ea48ae205305ee7913cf0ade11f3dc32f6cac874) Thanks [@thevuong](https://github.com/thevuong)! - Authoring a configuration is now type-checked as strictly as calling one. Three typos used to compile and then do nothing: a `defaultVariants` key naming no variant, a `compoundVariants` key naming no variant, and a variant class map naming no slot. Each failed the same silent way — nothing read the stray key, the compound never matched, the slot map was dropped — so a mistyped character removed a style with no error anywhere.

  The root cause was one overload. `extend` was optional on `ExtendedVariantConfig`, which made the last overload a catch-all: a configuration the earlier three correctly rejected still matched it, and `TBase` with nothing to infer from widened to `VariantSchema`, whose key is `string` — so every mistyped name became legal again. `extend` is now required there, which is what that overload was always for. Alongside it, `defaultVariants` and `compoundVariants` no longer act as inference sites for the variant schema (`NoInfer`), so a stray key is rejected instead of quietly widening the schema to include it.

  Two smaller corrections fall out. `defaultVariants` is typed by the new `VariantValues<T>` rather than the call-site `VariantSelection<T>`, so it no longer accepts a `className` a configuration has no use for. And in a slot configuration a variant's object value is now held to the declared slots — `SlotClassValue<S>` — because resolution has always read an object there as slot names rather than clsx conditions; `base` stays admissible whether or not it is declared, matching the plan that synthesises it.

  A configuration without slots keeps its clsx object values, and a compound condition naming an undeclared variant still resolves at runtime for JavaScript callers and merged configurations — it is only the typed authoring path that now rejects it, since no typed call could ever satisfy such a condition.

  `tests/types/common/config-authoring.test.ts` holds all of this with `@ts-expect-error`, the first negative type tests in the package. The 110 existing assertions only ever proved what compiles, which is exactly how three gaps survived.

  **One configuration shape stops compiling.** Requiring `extend` closes the overload that used to accept anything, and that overload was also what accepted a configuration whose literal types had widened — a hoisted `const defaultVariants = { size: "sm" }`, a hoisted `compoundVariants` array, a spread of a shared partial. Those have type `{ size: string }`, which was never assignable to `{ size?: "sm" }`; they compiled only because the catch-all widened the schema to swallow them. Add `as const` to the hoisted value, or inline it.

  The error TypeScript reports for this is `Property 'extend' is missing`, which names the last overload tried rather than the real mismatch. It is the same message a plain variant typo now produces. Nothing in this repository hit either case, but a consumer with a shared configuration fragment will.

- [#700](https://github.com/codefastlabs/codefast/pull/700) [`93b18ac`](https://github.com/codefastlabs/codefast/commit/93b18ac606e7fa6b5de95ca2679a38585c072e5c) Thanks [@thevuong](https://github.com/thevuong)! - A variant function now remembers what each selection resolved to, so a repeated selection skips both the plan walk and `tailwind-merge`. Against the previous build the resolution rows measure 1.08× to 11.9×, and against `tailwind-variants` the suite geomean moves from 6.18× to 19.8×. The motivating measurement: in the merged lane most of the cost was never the merge algorithm — `tailwind-merge` caches — but building and hashing the joined class string to look that cache up, which a key built from the selection avoids entirely.

  The key is a mixed-radix number, one digit per variant. A variant no compound tests is keyed by its group key, since two values sharing a key select the same classes; a variant a compound tests is keyed by the raw value, because a compound compares against what the caller passed and `true` and `"true"` share a group key while comparing differently. A call the key cannot represent — an axis past its capacity, a configuration too large to address in one safe integer, a clsx-shaped `className` — resolves the long way as before.

  Two consequences are worth knowing. A slot component called twice with the same selection gets back the **same** object of slot functions: stable enough for a React dependency array, and shared, so nothing may mutate it. And the store is bounded and keyed by the selection, so a component whose variant values are effectively unique per call fills it with entries nothing reads again — the new `cacheResolutions: false` option turns it off for that component.

  Alongside it: `extendTailwindMerge` is now memoised by `twMergeConfig` identity, so a design system handing one config to a hundred components builds one merge function instead of a hundred, each with its own cache; a slot resolution keeps only the props a compound can read rather than the caller's whole props object, which would otherwise pin `children` for as long as the entry lives; and each slot's merged text is memoised, so re-reading a slot no longer re-runs the merge.

  `tv` itself costs about a quarter of a microsecond more per component definition. The encoder is compiled on first resolution rather than in `tv`, so a component that is defined and never rendered pays nothing for it.

- [#700](https://github.com/codefastlabs/codefast/pull/700) [`d0dd326`](https://github.com/codefastlabs/codefast/commit/d0dd326e01d2bf3ecdf9283384bda22f07c2a6fe) Thanks [@thevuong](https://github.com/thevuong)! - Compile the configuration once, in `tv`, instead of re-deriving it on every resolver call.

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

### Patch Changes

- [#700](https://github.com/codefastlabs/codefast/pull/700) [`fe7e9e4`](https://github.com/codefastlabs/codefast/commit/fe7e9e46c6f42b8ae0bc5070656e085a4fe60436) Thanks [@thevuong](https://github.com/thevuong)! - A variant value naming an `Object.prototype` member no longer reaches it. A compiled variant group is indexed by whatever a caller passes, and it was a plain object — so `group["toString"]` answered with a function instead of `undefined`. The flat lane concatenated that function's source text into the class string, and the slot lane read slot positions off `Object.prototype` and threw:

  ```
  tv({ base: "block", variants: { size: { sm: "p-2" } } })({ size: "toString" })
    →  "block function toString() { [native code] }"

  tv({ slots: { base: "rounded" }, … })({ size: "__proto__" }).base()
    →  TypeError: Cannot read properties of undefined (reading 'length')
  ```

  Groups and the slot index map are now compiled onto prototype-less objects, which closes both resolvers and the selection encoder at once since all three read the same object. It costs roughly twice what reusing the source object did, once per component definition.

  Two smaller things fall out of the same reading. A value the group does not answer is no longer memoised into the id table, which a long-lived server rendering user-supplied values would otherwise grow without bound; and inherited keys no longer consume the ids a group's declared values need, which used to disable a resolver's cache permanently after a few junk values.

## 0.5.0

### Patch Changes

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

## 0.5.0-canary.9

### Patch Changes

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

## 0.5.0-canary.8

## 0.5.0-canary.7

## 0.5.0-canary.6

## 1.0.0-canary.7

## 1.0.0-canary.6

## 0.5.0-canary.5

## 0.5.0-canary.4

## 0.5.0-canary.3

## 0.5.0-canary.2

## 0.5.0-canary.1

## 0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`6350584`](https://github.com/codefastlabs/codefast/commit/635058490b7c08a07771897403107b3ae86fca19) Thanks [@thevuong](https://github.com/thevuong)! - refactor(tailwind-variants): clarify variant API names

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- [`8432414`](https://github.com/codefastlabs/codefast/commit/8432414b941a61f67800c378da73c8f45913913f) Thanks [@thevuong](https://github.com/thevuong)! - refactor(tailwind-variants): streamline variant resolution

- [`6c3ac44`](https://github.com/codefastlabs/codefast/commit/6c3ac44b7ddb9e5bcf3fbe0757e00ef86f27b513) Thanks [@thevuong](https://github.com/thevuong)! - Normalize import statement order and package.json key order repo-wide via the new oxfmt `sortImports`/`sortPackageJson` settings — purely mechanical, no runtime behavior change.

- [`d07b567`](https://github.com/codefastlabs/codefast/commit/d07b5671661e0fbef03fbbf42c1d603a65d796e5) Thanks [@thevuong](https://github.com/thevuong)! - Simplify the `extend` resolver type by dropping a redundant generic parameter — public behavior and inference are unchanged.

- [`649cf5a`](https://github.com/codefastlabs/codefast/commit/649cf5a63b654dd6517ff472a1c2a0e35db86fdf) Thanks [@thevuong](https://github.com/thevuong)! - fix(types): default the variant schema to a keyless record when `tv` is called without `variants`, so `className`/`class` accept full `ClassValue` inputs (arrays, objects) instead of being narrowed by a string index signature

## 0.4.0-canary.6

## 0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`fa338d6`](https://github.com/codefastlabs/codefast/commit/fa338d61fbfafb94beaa4d05d93d01e2c005cc91) Thanks [@thevuong](https://github.com/thevuong)! - Normalize import statement order and package.json key order repo-wide via the new oxfmt `sortImports`/`sortPackageJson` settings — purely mechanical, no runtime behavior change.

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`b097689`](https://github.com/codefastlabs/codefast/commit/b0976892cae3433670837aee0872262d38be0f45) Thanks [@thevuong](https://github.com/thevuong)! - Simplify the `extend` resolver type by dropping a redundant generic parameter — public behavior and inference are unchanged.

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`7a4f8c3`](https://github.com/codefastlabs/codefast/commit/7a4f8c3b487526a319c6808d1164ba1c8168e9b6) Thanks [@thevuong](https://github.com/thevuong)! - fix(types): default the variant schema to a keyless record when `tv` is called without `variants`, so `className`/`class` accept full `ClassValue` inputs (arrays, objects) instead of being narrowed by a string index signature

## 0.3.16-canary.3

### Patch Changes

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

## 0.3.16-canary.2

### Patch Changes

- [`1ad2cb7`](https://github.com/codefastlabs/codefast/commit/1ad2cb73a3f6f8bff2b001e9df2f2492efd89aa2) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`ac54aa0`](https://github.com/codefastlabs/codefast/commit/ac54aa0d3b53acba2f5f75f7ad11b506b249f524) Thanks [@thevuong](https://github.com/thevuong)! - refactor(tailwind-variants): clarify variant API names

- [`7d74f8b`](https://github.com/codefastlabs/codefast/commit/7d74f8bf357a59fa0ff8f6eb388af5d4a538e171) Thanks [@thevuong](https://github.com/thevuong)! - refactor(tailwind-variants): streamline variant resolution

## 0.3.16-canary.1

## 0.3.16-canary.0

## 0.3.15

### Patch Changes

- [`4df6e65`](https://github.com/codefastlabs/codefast/commit/4df6e6579faf21c6dc7622eb424ad213b120dabb) Thanks [@thevuong](https://github.com/thevuong)! - chore(tsdown): remove bench exclusions and streamline configuration files

## 0.3.14

### Patch Changes

- [`85e5ac1`](https://github.com/codefastlabs/codefast/commit/85e5ac122d7a75f756ae4c03b5ab5e9489823b59) Thanks [@thevuong](https://github.com/thevuong)! - docs(tailwind-variants): update README.md for improved clarity and performance emphasis

- [`4957e0e`](https://github.com/codefastlabs/codefast/commit/4957e0e8b4b2428447ef11380397b03deef0b092) Thanks [@thevuong](https://github.com/thevuong)! - fix(vitest): update test file patterns to use .test extension

- [`8109f4e`](https://github.com/codefastlabs/codefast/commit/8109f4e1f8186b91c296d25d640594b43493cdef) Thanks [@thevuong](https://github.com/thevuong)! - docs: update README.md files across packages for consistency and clarity

## 0.3.14-canary.2

### Patch Changes

- [`4957e0e`](https://github.com/codefastlabs/codefast/commit/4957e0e8b4b2428447ef11380397b03deef0b092) Thanks [@thevuong](https://github.com/thevuong)! - fix(vitest): update test file patterns to use .test extension

## 0.3.14-canary.1

## 0.3.14-canary.0

### Patch Changes

- [`85e5ac1`](https://github.com/codefastlabs/codefast/commit/85e5ac122d7a75f756ae4c03b5ab5e9489823b59) Thanks [@thevuong](https://github.com/thevuong)! - docs(tailwind-variants): update README.md for improved clarity and performance emphasis

- [`8109f4e`](https://github.com/codefastlabs/codefast/commit/8109f4e1f8186b91c296d25d640594b43493cdef) Thanks [@thevuong](https://github.com/thevuong)! - docs: update README.md files across packages for consistency and clarity

## 0.3.13

### Patch Changes

- [`02b16bc`](https://github.com/codefastlabs/codefast/commit/02b16bcb5e13712294a2fe285461bd8c9faa3c51) Thanks [@thevuong](https://github.com/thevuong)! - refactor(config): update tsconfig and tsdown for consistency

- [`93b7399`](https://github.com/codefastlabs/codefast/commit/93b7399737eb2220866338da31023f95665021a0) Thanks [@thevuong](https://github.com/thevuong)! - feat(cli): enhance CLI structure and update dependencies

- [`a042ee5`](https://github.com/codefastlabs/codefast/commit/a042ee5a6a10973492665b90d750a8b86817bf7d) Thanks [@thevuong](https://github.com/thevuong)! - feat: standardize TypeScript build configurations across packages

- [`2ba60d2`](https://github.com/codefastlabs/codefast/commit/2ba60d256c93b2590984f3992d35b3d71c40d472) Thanks [@thevuong](https://github.com/thevuong)! - chore(knip): add knip configuration for dependency management

- [`4248d75`](https://github.com/codefastlabs/codefast/commit/4248d75f2d547247dde937c322c2ed48d484f9e0) Thanks [@thevuong](https://github.com/thevuong)! - chore(tests): streamline test coverage commands and configurations

- [`2340231`](https://github.com/codefastlabs/codefast/commit/23402311084871d238ec50aa23061afd4b14e61e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(imports): standardize import paths across applications and benchmarks

- [`35329d5`](https://github.com/codefastlabs/codefast/commit/35329d5f17682542e3ef0907d4936fa513346a72) Thanks [@thevuong](https://github.com/thevuong)! - feat(tsconfig): enforce module detection in TypeScript configuration

## 0.3.13-canary.4

### Patch Changes

- [`93b7399`](https://github.com/codefastlabs/codefast/commit/93b7399737eb2220866338da31023f95665021a0) Thanks [@thevuong](https://github.com/thevuong)! - feat(cli): enhance CLI structure and update dependencies

- [`2ba60d2`](https://github.com/codefastlabs/codefast/commit/2ba60d256c93b2590984f3992d35b3d71c40d472) Thanks [@thevuong](https://github.com/thevuong)! - chore(knip): add knip configuration for dependency management

- [`4248d75`](https://github.com/codefastlabs/codefast/commit/4248d75f2d547247dde937c322c2ed48d484f9e0) Thanks [@thevuong](https://github.com/thevuong)! - chore(tests): streamline test coverage commands and configurations

- [`2340231`](https://github.com/codefastlabs/codefast/commit/23402311084871d238ec50aa23061afd4b14e61e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(imports): standardize import paths across applications and benchmarks

- [`35329d5`](https://github.com/codefastlabs/codefast/commit/35329d5f17682542e3ef0907d4936fa513346a72) Thanks [@thevuong](https://github.com/thevuong)! - feat(tsconfig): enforce module detection in TypeScript configuration

## 0.3.13-canary.3

## 0.3.13-canary.2

### Patch Changes

- [`a042ee5`](https://github.com/codefastlabs/codefast/commit/a042ee5a6a10973492665b90d750a8b86817bf7d) Thanks [@thevuong](https://github.com/thevuong)! - feat: standardize TypeScript build configurations across packages

## 0.3.13-canary.1

### Patch Changes

- [`02b16bc`](https://github.com/codefastlabs/codefast/commit/02b16bcb5e13712294a2fe285461bd8c9faa3c51) Thanks [@thevuong](https://github.com/thevuong)! - refactor(config): update tsconfig and tsdown for consistency

## 0.3.13-canary.0

## 0.3.12

### Patch Changes

- [`b3dfccb`](https://github.com/codefastlabs/codefast/commit/b3dfccbccff8961ca75a4671ae39e7616a7fa59c) Thanks [@thevuong](https://github.com/thevuong)! - refactor: switch package build scripts from tsdown to TypeScript build configs, align UI CSS exports to source CSS paths, and remove obsolete migration tooling

- [`cb53569`](https://github.com/codefastlabs/codefast/commit/cb5356985d4f349dd12a32f9de85cc7d13e8cc74) Thanks [@thevuong](https://github.com/thevuong)! - refactor: migrate package dependencies to catalog references

- [`e032524`](https://github.com/codefastlabs/codefast/commit/e032524a496132bb3ff6377a7348a7771c1d97dd) Thanks [@thevuong](https://github.com/thevuong)! - refactor: migrate tailwind-variants to Node subpath imports

- [`82b37c0`](https://github.com/codefastlabs/codefast/commit/82b37c02ad0086114082cc02be54a60d0c4478a6) Thanks [@thevuong](https://github.com/thevuong)! - refactor: rename typecheck scripts to check-types for consistency

- [`3f647bc`](https://github.com/codefastlabs/codefast/commit/3f647bce65e4c12d3349f06a5a3a80acf13b03de) Thanks [@thevuong](https://github.com/thevuong)! - refactor: align remaining alias references to subpath imports

## 0.3.12-canary.1

## 0.3.12-canary.0

### Patch Changes

- [`b3dfccb`](https://github.com/codefastlabs/codefast/commit/b3dfccbccff8961ca75a4671ae39e7616a7fa59c) Thanks [@thevuong](https://github.com/thevuong)! - refactor: switch package build scripts from tsdown to TypeScript build configs, align UI CSS exports to source CSS paths, and remove obsolete migration tooling

- [`cb53569`](https://github.com/codefastlabs/codefast/commit/cb5356985d4f349dd12a32f9de85cc7d13e8cc74) Thanks [@thevuong](https://github.com/thevuong)! - refactor: migrate package dependencies to catalog references

- [`e032524`](https://github.com/codefastlabs/codefast/commit/e032524a496132bb3ff6377a7348a7771c1d97dd) Thanks [@thevuong](https://github.com/thevuong)! - refactor: migrate tailwind-variants to Node subpath imports

- [`82b37c0`](https://github.com/codefastlabs/codefast/commit/82b37c02ad0086114082cc02be54a60d0c4478a6) Thanks [@thevuong](https://github.com/thevuong)! - refactor: rename typecheck scripts to check-types for consistency

- [`3f647bc`](https://github.com/codefastlabs/codefast/commit/3f647bce65e4c12d3349f06a5a3a80acf13b03de) Thanks [@thevuong](https://github.com/thevuong)! - refactor: align remaining alias references to subpath imports

## 0.3.11

### Patch Changes

- [`dd5130a`](https://github.com/codefastlabs/codefast/commit/dd5130adb5649dca6773614ffda262cdde732d8f) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): downgrade @rslib/core to 0.19.1 in package.json and pnpm-lock.yaml

- [`135c6be`](https://github.com/codefastlabs/codefast/commit/135c6bed9d1bc1e96bad3173adab1bf32d74322f) Thanks [@thevuong](https://github.com/thevuong)! - chore: update linting and formatting scripts in package.json

- [`610cf7a`](https://github.com/codefastlabs/codefast/commit/610cf7a7f9b6e5b37be21e7675ea363ef1020639) Thanks [@thevuong](https://github.com/thevuong)! - fix(hooks): handle missing `navigator.clipboard.writeText` gracefully

- [`42758ab`](https://github.com/codefastlabs/codefast/commit/42758ab9d8f548ea9f4a806a7dbb7ed295fe2390) Thanks [@thevuong](https://github.com/thevuong)! - chore: update package configurations and TypeScript settings

- [`d2abc63`](https://github.com/codefastlabs/codefast/commit/d2abc636245526ec402811d8585d93684865dde6) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): update package versions and configurations

- [`49df885`](https://github.com/codefastlabs/codefast/commit/49df8854d51bad598381be68b6e41096e7da814c) Thanks [@thevuong](https://github.com/thevuong)! - chore: simplify package exports in tailwind-variants

- [`3e90474`](https://github.com/codefastlabs/codefast/commit/3e90474fbbb9f8ac626c5949bfdbac2eaf1cb3e8) Thanks [@thevuong](https://github.com/thevuong)! - chore: update project configuration and dependencies

- [`92d1ed7`](https://github.com/codefastlabs/codefast/commit/92d1ed7650b19f91824cfb38ec238857a3d95876) Thanks [@thevuong](https://github.com/thevuong)! - build: replace rslib with tsdown in library packages

- [`5c09d4c`](https://github.com/codefastlabs/codefast/commit/5c09d4ce2df564dc7ac6727b00cfa668164a1af4) Thanks [@thevuong](https://github.com/thevuong)! - refactor(config): rename `check-types` to `typecheck` and update usage

## 0.3.11-canary.2

### Patch Changes

- [`92d1ed7`](https://github.com/codefastlabs/codefast/commit/92d1ed7650b19f91824cfb38ec238857a3d95876) Thanks [@thevuong](https://github.com/thevuong)! - build: replace rslib with tsdown in library packages

## 0.3.11-canary.1

### Patch Changes

- [`dd5130a`](https://github.com/codefastlabs/codefast/commit/dd5130adb5649dca6773614ffda262cdde732d8f) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): downgrade @rslib/core to 0.19.1 in package.json and pnpm-lock.yaml

- [`42758ab`](https://github.com/codefastlabs/codefast/commit/42758ab9d8f548ea9f4a806a7dbb7ed295fe2390) Thanks [@thevuong](https://github.com/thevuong)! - chore: update package configurations and TypeScript settings

- [`d2abc63`](https://github.com/codefastlabs/codefast/commit/d2abc636245526ec402811d8585d93684865dde6) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): update package versions and configurations

- [`49df885`](https://github.com/codefastlabs/codefast/commit/49df8854d51bad598381be68b6e41096e7da814c) Thanks [@thevuong](https://github.com/thevuong)! - chore: simplify package exports in tailwind-variants

## 0.3.11-canary.0

### Patch Changes

- [`135c6be`](https://github.com/codefastlabs/codefast/commit/135c6bed9d1bc1e96bad3173adab1bf32d74322f) Thanks [@thevuong](https://github.com/thevuong)! - chore: update linting and formatting scripts in package.json

- [`610cf7a`](https://github.com/codefastlabs/codefast/commit/610cf7a7f9b6e5b37be21e7675ea363ef1020639) Thanks [@thevuong](https://github.com/thevuong)! - fix(hooks): handle missing `navigator.clipboard.writeText` gracefully

- [`3e90474`](https://github.com/codefastlabs/codefast/commit/3e90474fbbb9f8ac626c5949bfdbac2eaf1cb3e8) Thanks [@thevuong](https://github.com/thevuong)! - chore: update project configuration and dependencies

- [`5c09d4c`](https://github.com/codefastlabs/codefast/commit/5c09d4ce2df564dc7ac6727b00cfa668164a1af4) Thanks [@thevuong](https://github.com/thevuong)! - refactor(config): rename `check-types` to `typecheck` and update usage

## 0.3.10

### Patch Changes

- [`6737b93`](https://github.com/codefastlabs/codefast/commit/6737b932ed045e2ab1b6da54e3d4c857f77eb436) Thanks [@thevuong](https://github.com/thevuong)! - chore(release): bump package versions

- [`b8aef8a`](https://github.com/codefastlabs/codefast/commit/b8aef8a14a885f146de99be5496fc179c6fb49b3) Thanks [@thevuong](https://github.com/thevuong)! - chore: remove deployment workflows and related scripts

## 0.3.9

### Patch Changes

- [`237b576`](https://github.com/codefastlabs/codefast/commit/237b576f8e12c528cfec40aefe2d0a68c0b01ac4) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): bump package versions across workspaces

- [`888a904`](https://github.com/codefastlabs/codefast/commit/888a9047e4ad2e79e5945fad09d5ffa8baef0a45) Thanks [@thevuong](https://github.com/thevuong)! - refactor(eslint-config): reorganize presets and imports

- [`1751374`](https://github.com/codefastlabs/codefast/commit/175137498b3a5144909a2f80e003d070ca5bf937) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): update Button component to support asChild prop and simplify props structure

## 0.3.9-canary.3

## 0.3.9-canary.2

### Patch Changes

- [`237b576`](https://github.com/codefastlabs/codefast/commit/237b576f8e12c528cfec40aefe2d0a68c0b01ac4) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): bump package versions across workspaces

- [`888a904`](https://github.com/codefastlabs/codefast/commit/888a9047e4ad2e79e5945fad09d5ffa8baef0a45) Thanks [@thevuong](https://github.com/thevuong)! - refactor(eslint-config): reorganize presets and imports

## 0.3.9-canary.1

## 0.3.9-canary.0

### Patch Changes

- [`1751374`](https://github.com/codefastlabs/codefast/commit/175137498b3a5144909a2f80e003d070ca5bf937) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): update Button component to support asChild prop and simplify props structure

## 0.3.8

### Patch Changes

- [`1cf6c06`](https://github.com/codefastlabs/codefast/commit/1cf6c06046d25579e0e36f013bf108d7011139d8) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): update imports to use `@codefast/tailwind-variants` for utility functions and types

- [`ec076da`](https://github.com/codefastlabs/codefast/commit/ec076da4d889b6ed03c16ef685405855900683cd) Thanks [@thevuong](https://github.com/thevuong)! - chore(package): add sideEffects field to package.json for better tree-shaking

- [`bf65c06`](https://github.com/codefastlabs/codefast/commit/bf65c06d104797263d3c8d9240a29154f6419c92) Thanks [@thevuong](https://github.com/thevuong)! - refactor(deps): upgrade various dependencies across packages

- [`1b9ab0e`](https://github.com/codefastlabs/codefast/commit/1b9ab0e5af2f02473d572a0443501216cc3fa880) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): update imports to use `@codefast/tailwind-variants`

- [`f22d0a4`](https://github.com/codefastlabs/codefast/commit/f22d0a4cd16f5a7d8e7979292ff016e5bb42f029) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): rename component variant files to use `.tsx` extension for consistency

- [`05d78a4`](https://github.com/codefastlabs/codefast/commit/05d78a4be23ea0f4acd39208ddbb22c817c89714) Thanks [@thevuong](https://github.com/thevuong)! - test(ui): add comprehensive unit tests for various hooks

- [`cacf996`](https://github.com/codefastlabs/codefast/commit/cacf99660c812b5e5fafa5fd3beeab776b9683d7) Thanks [@thevuong](https://github.com/thevuong)! - feat(ui): introduce new CheckboxGroup, InputNumber, and ProgressCircle components with comprehensive tests

- [`a5d483b`](https://github.com/codefastlabs/codefast/commit/a5d483b6232088b6d74e6146e0d1510843241ad0) Thanks [@thevuong](https://github.com/thevuong)! - refactor(jest-setup): extract custom matcher declarations to dedicated file

- [`30ae5af`](https://github.com/codefastlabs/codefast/commit/30ae5af9b720a42f1debb2bb595b778bd64a43a5) Thanks [@thevuong](https://github.com/thevuong)! - feat(image-loader): add secure URL matching utilities and integrate with loaders

- [`45507b5`](https://github.com/codefastlabs/codefast/commit/45507b55c52516b69e63d67dd1c4a090aea87ef3) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): restructure CSS files and remove deprecated styles

- [`c4404a3`](https://github.com/codefastlabs/codefast/commit/c4404a33ea694eacb0469772cdc834809d13aabc) Thanks [@thevuong](https://github.com/thevuong)! - refactor(eslint-config): simplify `ignores` patterns in `next-app` preset

- [`71a49ff`](https://github.com/codefastlabs/codefast/commit/71a49ff554e6c73b855c10aa0a6e7e74ce8c1f23) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): remove deprecated component exports and streamline imports

- [`ac55f56`](https://github.com/codefastlabs/codefast/commit/ac55f569207dfd79f270f7ed6a0a1d0c6c5cee5e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(styles): replace `@variant dark` with `.dark` in globals.css

- [`7fe14d9`](https://github.com/codefastlabs/codefast/commit/7fe14d9b6189384211e3d6da507943127f6b8de2) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): remove variant files and inline logic into core components

- [`f48e0fb`](https://github.com/codefastlabs/codefast/commit/f48e0fb7a47c5e5d5218505a23d348c90c961b1b) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): remove @codefast/hooks dependency and integrate hooks directly into @codefast/ui

- [`98fadf6`](https://github.com/codefastlabs/codefast/commit/98fadf6702c1f47515569d8bb6c38bfa75bbf5bd) Thanks [@thevuong](https://github.com/thevuong)! - refactor(checkbox-group, input, input-number, progress-circle): migrate components to primitives and remove deprecated files

- [`c322adb`](https://github.com/codefastlabs/codefast/commit/c322adbb6953fd3bf17376d2ac3064747604113f) Thanks [@thevuong](https://github.com/thevuong)! - refactor(configs): adjust PostCSS plugins and remove unused deps

- [`6d4b17e`](https://github.com/codefastlabs/codefast/commit/6d4b17e577bda3b5d5a6c74dea28d6968b527751) Thanks [@thevuong](https://github.com/thevuong)! - feat(styles): add usage examples for CSS variables to enhance documentation

- [`da3d5d1`](https://github.com/codefastlabs/codefast/commit/da3d5d114ada0c48ffcb79d993c8e9a07f420c70) Thanks [@thevuong](https://github.com/thevuong)! - refactor(deps): update Jest and SWC dependencies

- [`f40943c`](https://github.com/codefastlabs/codefast/commit/f40943c85ff0daf8ae3a48deb3e2c848b0a54976) Thanks [@thevuong](https://github.com/thevuong)! - refactor(styles): remove `@tailwindcss/typography` for simplicity

- [`dbe05a0`](https://github.com/codefastlabs/codefast/commit/dbe05a0246a7e2a582f6c7255d3a458002295f29) Thanks [@thevuong](https://github.com/thevuong)! - refactor(styles): update comment formatting in global and theme CSS files

- [`9de2f17`](https://github.com/codefastlabs/codefast/commit/9de2f173fcac4ffe2dc919b98029321468a25b4b) Thanks [@thevuong](https://github.com/thevuong)! - feat(ui): update styles version and dependencies for animations and typography

- [`1163fa8`](https://github.com/codefastlabs/codefast/commit/1163fa802d29abb68a53eb403295ef1a27cdc7d9) Thanks [@thevuong](https://github.com/thevuong)! - feat(eslint-config): add support for multiple configuration presets in exports

- [`1ff5e63`](https://github.com/codefastlabs/codefast/commit/1ff5e63747205c248d326ba4b38a3b1caff91335) Thanks [@thevuong](https://github.com/thevuong)! - refactor(typescript-config): update TypeScript configurations for consistency and maintainability

## 0.3.8-canary.4

### Patch Changes

- [`ec076da`](https://github.com/codefastlabs/codefast/commit/ec076da4d889b6ed03c16ef685405855900683cd) Thanks [@thevuong](https://github.com/thevuong)! - chore(package): add sideEffects field to package.json for better tree-shaking

- [`f22d0a4`](https://github.com/codefastlabs/codefast/commit/f22d0a4cd16f5a7d8e7979292ff016e5bb42f029) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): rename component variant files to use `.tsx` extension for consistency

- [`05d78a4`](https://github.com/codefastlabs/codefast/commit/05d78a4be23ea0f4acd39208ddbb22c817c89714) Thanks [@thevuong](https://github.com/thevuong)! - test(ui): add comprehensive unit tests for various hooks

- [`cacf996`](https://github.com/codefastlabs/codefast/commit/cacf99660c812b5e5fafa5fd3beeab776b9683d7) Thanks [@thevuong](https://github.com/thevuong)! - feat(ui): introduce new CheckboxGroup, InputNumber, and ProgressCircle components with comprehensive tests

- [`45507b5`](https://github.com/codefastlabs/codefast/commit/45507b55c52516b69e63d67dd1c4a090aea87ef3) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): restructure CSS files and remove deprecated styles

- [`71a49ff`](https://github.com/codefastlabs/codefast/commit/71a49ff554e6c73b855c10aa0a6e7e74ce8c1f23) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): remove deprecated component exports and streamline imports

- [`7fe14d9`](https://github.com/codefastlabs/codefast/commit/7fe14d9b6189384211e3d6da507943127f6b8de2) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): remove variant files and inline logic into core components

## 0.3.8-canary.3

### Patch Changes

- [`bf65c06`](https://github.com/codefastlabs/codefast/commit/bf65c06d104797263d3c8d9240a29154f6419c92) Thanks [@thevuong](https://github.com/thevuong)! - refactor(deps): upgrade various dependencies across packages

## 0.3.8-canary.2

### Patch Changes

- [`1cf6c06`](https://github.com/codefastlabs/codefast/commit/1cf6c06046d25579e0e36f013bf108d7011139d8) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): update imports to use `@codefast/tailwind-variants` for utility functions and types

- [`1b9ab0e`](https://github.com/codefastlabs/codefast/commit/1b9ab0e5af2f02473d572a0443501216cc3fa880) Thanks [@thevuong](https://github.com/thevuong)! - refactor(ui): update imports to use `@codefast/tailwind-variants`

- [`ac55f56`](https://github.com/codefastlabs/codefast/commit/ac55f569207dfd79f270f7ed6a0a1d0c6c5cee5e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(styles): replace `@variant dark` with `.dark` in globals.css

- [`c322adb`](https://github.com/codefastlabs/codefast/commit/c322adbb6953fd3bf17376d2ac3064747604113f) Thanks [@thevuong](https://github.com/thevuong)! - refactor(configs): adjust PostCSS plugins and remove unused deps

- [`6d4b17e`](https://github.com/codefastlabs/codefast/commit/6d4b17e577bda3b5d5a6c74dea28d6968b527751) Thanks [@thevuong](https://github.com/thevuong)! - feat(styles): add usage examples for CSS variables to enhance documentation

- [`da3d5d1`](https://github.com/codefastlabs/codefast/commit/da3d5d114ada0c48ffcb79d993c8e9a07f420c70) Thanks [@thevuong](https://github.com/thevuong)! - refactor(deps): update Jest and SWC dependencies

- [`f40943c`](https://github.com/codefastlabs/codefast/commit/f40943c85ff0daf8ae3a48deb3e2c848b0a54976) Thanks [@thevuong](https://github.com/thevuong)! - refactor(styles): remove `@tailwindcss/typography` for simplicity

- [`dbe05a0`](https://github.com/codefastlabs/codefast/commit/dbe05a0246a7e2a582f6c7255d3a458002295f29) Thanks [@thevuong](https://github.com/thevuong)! - refactor(styles): update comment formatting in global and theme CSS files

## 0.3.8-canary.1

### Patch Changes

- [`a5d483b`](https://github.com/codefastlabs/codefast/commit/a5d483b6232088b6d74e6146e0d1510843241ad0) Thanks [@thevuong](https://github.com/thevuong)! - refactor(jest-setup): extract custom matcher declarations to dedicated file

- [`9de2f17`](https://github.com/codefastlabs/codefast/commit/9de2f173fcac4ffe2dc919b98029321468a25b4b) Thanks [@thevuong](https://github.com/thevuong)! - feat(ui): update styles version and dependencies for animations and typography

- [`1163fa8`](https://github.com/codefastlabs/codefast/commit/1163fa802d29abb68a53eb403295ef1a27cdc7d9) Thanks [@thevuong](https://github.com/thevuong)! - feat(eslint-config): add support for multiple configuration presets in exports

## 0.3.8-canary.0

### Patch Changes

- [`30ae5af`](https://github.com/codefastlabs/codefast/commit/30ae5af9b720a42f1debb2bb595b778bd64a43a5) Thanks [@thevuong](https://github.com/thevuong)! - feat(image-loader): add secure URL matching utilities and integrate with loaders

- [`c4404a3`](https://github.com/codefastlabs/codefast/commit/c4404a33ea694eacb0469772cdc834809d13aabc) Thanks [@thevuong](https://github.com/thevuong)! - refactor(eslint-config): simplify `ignores` patterns in `next-app` preset

- [`1ff5e63`](https://github.com/codefastlabs/codefast/commit/1ff5e63747205c248d326ba4b38a3b1caff91335) Thanks [@thevuong](https://github.com/thevuong)! - refactor(typescript-config): update TypeScript configurations for consistency and maintainability

## 0.3.7

### Patch Changes

- [`d35a1b7`](https://github.com/codefastlabs/codefast/commit/d35a1b76ad65d12a0ebb69dd141b2c38d98973d0) Thanks [@thevuong](https://github.com/thevuong)! - chore: bump package versions for dependency updates

- [`6995bee`](https://github.com/codefastlabs/codefast/commit/6995bee4991257294cc6d520af6989e237392775) Thanks [@thevuong](https://github.com/thevuong)! - chore(tailwind-variants): downgrade version to `0.3.7-canary.2`

- [`288ce19`](https://github.com/codefastlabs/codefast/commit/288ce19a5ab93a2e926579b5404395b050eadc36) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): update @rslib/core and eslint-plugin-turbo to version 0.14.0 and 2.5.7 respectively

## 0.3.7-canary.4

### Patch Changes

- [`d35a1b7`](https://github.com/codefastlabs/codefast/commit/d35a1b76ad65d12a0ebb69dd141b2c38d98973d0) Thanks [@thevuong](https://github.com/thevuong)! - chore: bump package versions for dependency updates

## 0.3.7-canary.3

### Patch Changes

- [`6995bee`](https://github.com/codefastlabs/codefast/commit/6995bee4991257294cc6d520af6989e237392775) Thanks [@thevuong](https://github.com/thevuong)! - chore(tailwind-variants): downgrade version to `0.3.7-canary.2`

## 0.3.7-canary.2

### Patch Changes

- [`288ce19`](https://github.com/codefastlabs/codefast/commit/288ce19a5ab93a2e926579b5404395b050eadc36) Thanks [@thevuong](https://github.com/thevuong)! - chore(deps): update @rslib/core and eslint-plugin-turbo to version 0.14.0 and 2.5.7 respectively

## 0.3.7-canary.1

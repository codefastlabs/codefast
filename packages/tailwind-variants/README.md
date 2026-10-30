# @codefast/tailwind-variants

> **Note.** A future release renames this package `@codefast/tv`, and only the name changes: when it lands, swap the
> dependency and change every `from "@codefast/tailwind-variants"` import to `from "@codefast/tv"`. Until then, keep
> installing `@codefast/tailwind-variants`.

A type-safe variant styling API for Tailwind CSS — a faster drop-in replacement for `tailwind-variants`, for anyone
building components whose classes depend on props.

[![npm version](https://img.shields.io/npm/v/@codefast/tailwind-variants)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![license](https://img.shields.io/npm/l/@codefast/tailwind-variants)](./LICENSE)

## Overview

`@codefast/tailwind-variants` turns one configuration into a typed function that returns the right Tailwind classes for
a set of props. Describe your `base`, `variants`, and `slots` once; call the function with props; get back a merged
class string. It's a drop-in, faster replacement for `tailwind-variants`, with the same configuration shape.

`tv()` costs next to nothing. The first calls resolve straight from the configuration, the next compiles it into a plan,
and from then on resolving a component is string work — with a repeated selection answered from a cache.

- **One configuration, one typed function.** Describe `base`, `variants`, `compoundVariants`, `slots`, and
  `defaultVariants` once; get back a function whose props are inferred from it.
- **Conflicts settled by [`cn`](https://github.com/shadcn-ui/cn).** A caller's `className` wins over the configuration,
  and an unknown variant value is a type error.
- **Compiled once, when it pays.** `tv()` only wraps the configuration; the first renders read it directly — two for a
  component without slots, one with them — and the next compiles it into a plan, so a component rendered that few times
  costs no more than those renders, and every render after is string work with repeated selections answered from a
  cache.
- **Drop-in, with no runtime dependencies of its own.** Same configuration shape as `tailwind-variants`; the merge
  engine, `cn`, is a peer, so you get one copy at the version you chose.

## Installation

```bash
pnpm add @codefast/tailwind-variants cn
# npm install @codefast/tailwind-variants cn
# yarn add @codefast/tailwind-variants cn
```

`@codefast/tailwind-variants` ships ESM only. `cn` is a peer dependency (`>=0.5.0`), and the package runs on Node.js
22.12 or later and in Chrome and Edge 136, Firefox 136, or Safari 18.4 or later
([support policy](../../SUPPORT.md#browsers)). It requires TypeScript 7 or later for its types. It's published on 0.x
and versioned on its own track: breaking changes ship as minor versions, so pin the minor version when you need
stability.

## Quick start

```ts
import { tv } from "@codefast/tailwind-variants";

const button = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium",
  variants: {
    variant: { primary: "bg-primary text-primary-foreground", outline: "border border-input bg-background" },
    size: { sm: "h-9 px-3 text-sm", md: "h-10 px-4", lg: "h-11 px-8" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

button();
// => "inline-flex items-center justify-center rounded-md font-medium bg-primary text-primary-foreground h-10 px-4"

button({ variant: "outline", size: "lg" });
// => "... border border-input bg-background h-11 px-8"

button({ size: "sm", className: "w-full" });
// => "... bg-primary text-primary-foreground h-9 px-3 text-sm w-full"
```

Every call accepts `class` and `className` for ad-hoc additions. Both are appended last, `class` before `className`, so
they win any Tailwind conflict with the configuration. A resolution with no classes at all returns `""`.

A variant value is read as its group key: a number and its string spelling select the same key (`cols: 1` or
`cols: "1"`), `""` reads as `false`, and `null`, an array or an object selects nothing. Only an omitted or `undefined`
value falls back to `defaultVariants`.

## Variants

### Boolean variants

A variant group with `"true"` / `"false"` keys accepts real booleans. When such a group has no entry in
`defaultVariants`, it defaults to `false`:

```ts
const toggle = tv({
  base: "rounded-md text-sm",
  variants: {
    pressed: { true: "bg-accent", false: "bg-transparent" },
    disabled: { true: "pointer-events-none opacity-50" },
  },
});

toggle(); // => "rounded-md text-sm bg-transparent"
toggle({ pressed: true, disabled: true });
// => "rounded-md text-sm bg-accent pointer-events-none opacity-50"
```

### Compound variants

`compoundVariants` apply extra classes only when all listed conditions match. A condition value may be an array,
matching any of its entries, and `undefined`, `null` and `false` match one another, so a condition on `false` also holds
for an omitted boolean variant. An entry that declares both `class` and `className` applies both:

```ts
const alert = tv({
  base: "rounded-lg border px-4 py-3",
  variants: {
    variant: { default: "bg-background", destructive: "text-destructive" },
    size: { sm: "text-sm", md: "text-base" },
  },
  compoundVariants: [{ variant: "destructive", size: ["sm", "md"], className: "font-semibold" }],
  defaultVariants: { variant: "default", size: "md" },
});

alert({ variant: "destructive" });
// => "rounded-lg border px-4 py-3 text-destructive text-base font-semibold"
```

## Slots

Add `slots` to style a multi-part component. The variant function then returns an object of per-slot functions. A
variant value can be a plain class string (applied to the `base` slot) or a slot-to-class map:

```ts
const card = tv({
  slots: {
    root: "rounded-xl border bg-card shadow-sm",
    header: "flex flex-col gap-1.5 p-6",
    content: "p-6 pt-0",
  },
  variants: { inset: { true: { content: "px-3" } } },
});

const styles = card({ inset: true });

styles.root(); // => "rounded-xl border bg-card shadow-sm"
styles.content(); // => "p-6 pt-0 px-3"
styles.content({ className: "pb-0" }); // => "p-6 pt-0 px-3 pb-0" — merged per slot
```

Each slot function also accepts variant props of its own, which override the values given at the top-level call for that
slot only; a variant left `null` or `undefined` there keeps the call's selection, and compound variants and compound
slots test the slot's own props before the call's. In a slot configuration, a compound variant's `class` or `className`
may be a slot map.

### Compound slots

`compoundSlots` target several slots at once, optionally gated on variant conditions:

```ts
const pagination = tv({
  slots: { item: "flex flex-wrap", prev: "", next: "" },
  variants: { size: { sm: "", md: "" } },
  compoundSlots: [
    { slots: ["item", "prev", "next"], className: "size-9 rounded-md" },
    { slots: ["item", "prev", "next"], size: "sm", className: "size-7 text-xs" },
  ],
  defaultVariants: { size: "md" },
});

pagination({ size: "sm" }).item();
// => "flex flex-wrap rounded-md size-7 text-xs"
```

## Extending

`extend` inherits another variant function's configuration and merges the child's onto it the way upstream does. What
both declare joins, the parent's classes first: the `base` (a slot parent's `base` slot included), each variant value,
and each slot or slot-map entry. Defaults merge with the child's winning, compound variants and compound slots
concatenate with the parent's first, and a child's `compoundSlots` apply without redeclaring `slots`. The child's
variant names come first, so its variants' classes are emitted before the parent's. The resulting types reflect the
union, and a chain of any depth collapses into one configuration when `tv()` runs:

```ts
const baseButton = tv({
  base: "inline-flex items-center rounded-md",
  variants: { size: { sm: "h-9 px-3", md: "h-10 px-4" } },
  defaultVariants: { size: "md" },
});

const iconButton = tv({
  extend: baseButton,
  base: "aspect-square",
  variants: { tone: { ghost: "hover:bg-accent", outline: "border border-input" } },
  defaultVariants: { tone: "ghost" },
});

iconButton();
// => "inline-flex items-center rounded-md aspect-square hover:bg-accent h-10 px-4"

iconButton({ tone: "outline", size: "sm" });
// => "inline-flex items-center rounded-md aspect-square border border-input h-9 px-3"

const compactButton = tv({ extend: baseButton, variants: { size: { sm: "text-xs" } } });

compactButton({ size: "sm" });
// => "inline-flex items-center rounded-md h-9 px-3 text-xs" — the redeclared value joins the parent's
```

## Options and `createTV`

`tv(config, options)` takes an optional second argument:

- `twMerge` — how conflicts are resolved: `true` merges with `cn`'s `twMerge` (the default), `false` keeps every
  declared class, and a function `(classes: string) => string` replaces the merge — `extendTailwindMerge(…)` from
  `cn/config` for custom class groups, or another engine.
- `cacheResolutions` — set `false` to resolve every call from scratch (default `true`).

A variant function remembers what each selection resolved to, because a list renders the same few selections many times
and both the plan walk and the merge are pure functions of the selection. Two consequences are worth knowing:

- Once its plan is compiled — from the second call on — a slot component called with a selection it has already seen
  gets back the **same** object of slot functions. That is stable enough for a React dependency array; it also means the
  object is shared, so do not mutate it.
- The store is bounded and keyed by the selection, so a variant whose values are effectively unique per call (an id, a
  timestamp, a fresh object) fills it with entries nothing reads again. `cacheResolutions: false` is the escape hatch
  for that component.

`createTV(options)` bakes those options into a shared factory and returns `{ tv, cn }`:

```ts
import { createTV } from "@codefast/tailwind-variants";
import { extendTailwindMerge } from "cn/config";

const { tv, cn } = createTV({
  twMerge: extendTailwindMerge({ extend: { classGroups: { "font-size": [{ text: ["huge"] }] } } }),
});

cn("text-base", "text-huge"); // => "text-huge" — the custom group is understood
```

Options passed locally to `tv(config, options)` override the factory's, one by one: an option left out or `undefined`
takes the shared value. Every variant function also exposes `config`, its fully merged configuration (what `extend`
reads), and `variantKeys`, the variant names in declaration order with an extending function's own first — the same list
upstream exposes, for splitting variant props from the rest by hand.

### Choosing the merge engine

The package imports two things from [`cn`](https://github.com/shadcn-ui/cn): its `twMerge`, as the default merge, and
its `cn`, which this package re-exports. `cn` produces the same output as `tailwind-merge` and runs faster on a string
it has not seen; anything else comes in through the `twMerge` option, so the application decides which engine runs. An
app that still imports `tailwind-merge` elsewhere can alias it to `cn` so the bundle carries one engine:

```ts
// vite.config.ts
resolve: { alias: { "tailwind-merge": "cn" } },
```

The merge runs on every selection a resolver has not answered before, so the engine decides what a first render costs. A
repeated selection without a caller class is answered from the store. A caller's class merges onto the selection's
classes: a component without slots remembers the answer from that class's second sighting, while a slot called with a
class merges on every call.

## Class utilities

```ts
import { cn, cx } from "@codefast/tailwind-variants";

cn("px-4 py-2", "px-6"); // => "py-2 px-6" — joined, then merged
cx("px-4 py-2", "px-6"); // => "px-4 py-2 px-6" — joined only, no merging
cn("base", isActive && "text-primary", { hidden: false }); // conditional values, the shapes clsx accepts
```

`cn` is the engine's own, re-exported, and answers a repeated call from its argument cache. `cx` joins the same shapes
without merging, and is what `createTV` returns as `cn` under `twMerge: false`.

## TypeScript

`VariantProps` extracts the variant props of a variant function (with `class` / `className` stripped) for reuse in
component props:

```tsx
import { tv } from "@codefast/tailwind-variants";
import type { VariantProps } from "@codefast/tailwind-variants";
import type { ComponentProps } from "react";

const button = tv({
  base: "rounded px-4 py-2",
  variants: { variant: { primary: "bg-primary", outline: "border" } },
});

interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof button> {}

function Button({ variant, className, ...props }: ButtonProps) {
  return <button className={button({ variant, className })} {...props} />;
}
```

Variant values, slot names, and compound conditions are all inferred — passing an unknown variant value or accessing a
slot that does not exist is a type error. `ClassValue` is the type of anything accepted where classes are expected
(strings, numbers, nested arrays, readonly ones included, condition objects). Configuration and option types
(`VariantConfig`, `SlotVariantConfig`, `ExtendedVariantConfig`, `TailwindVariantsOptions`, and friends) are exported for
library authors, as are the resolver shapes: `VariantResolver<Variants, Slots>` selects `FlatVariantResolver` without
slots and `SlottedVariantResolver` with them, and `TailwindVariantsFactory` is `typeof tv`. A configuration held in a
variable is typed by its shape exactly as the same object literal would be.

## Migrating from `tailwind-variants`

The configuration shape is the same — `base`, `variants`, `slots`, `defaultVariants`, `compoundVariants`,
`compoundSlots`, `extend`, plus the `twMerge` option — so for most codebases the migration is the import:

```diff
- import { tv, cn, cx } from "tailwind-variants";
+ import { tv, cn, cx } from "@codefast/tailwind-variants";
```

Resolution matches upstream `tailwind-variants` 4.0.0 — variant values, `extend`, compounds, slot props, `class` and
`className`, and `""` for no classes. The differences to check for are in what the package exports and returns:

- `createTV` returns an object `{ tv, cn }` sharing the global options, rather than a bare `tv` function — destructure
  instead of assigning directly.
- `cnMerge` and a mutable `defaultConfig` are not exported; use `createTV` to configure merging.
- `clsx`, `twJoin`, `twMerge` and the default export are not re-exported; import them from `cn`, the merge engine this
  package is built on.
- There is no `twMergeConfig`: pass `twMerge: extendTailwindMerge(config)` instead, with `extendTailwindMerge` from
  `cn/config`, which is also how upstream's `lite` entry takes a merge function. The package has one entry point, so
  `tailwind-variants/lite`, `/merge`, `/config` and `/utils` have no counterpart: `twMerge: false` is the merge-free
  `tv`.
- `variantKeys` is exposed as upstream exposes it; the other metadata upstream attaches to the function (`base`,
  `variants`, `defaultVariants`, `slots`, `compoundVariants`, `compoundSlots`, `extend`) lives under `config`.

## Benchmarks

The repository maintains a [benchmark suite](../../benchmarks/tailwind-variants) that runs the same variant workloads —
simple, complex, slots, compound slots, `extend`, `createTV`, and extreme configurations, each with and without merging
— against the upstream `tailwind-variants` package and `class-variance-authority` in isolated subprocesses. Its
[`RESULTS.md`](../../benchmarks/tailwind-variants/RESULTS.md) is generated from the committed baseline — every figure,
the bundle table, and every row the package loses — and CI fails when it drifts from that run. Numbers vary by hardware,
so run it yourself rather than reading them here:

```bash
pnpm --filter @benchmark/tailwind-variants bench
```

The speed comes from settling things once, and only once a component has shown it will be rendered again. `tv()` wraps
the configuration and the first calls read it directly; the next call compiles it into a plan — compound conditions and
slot positions settled, each variant value flattened to a string the first time a call selects it — so every resolution
after is string concatenation rather than dictionary lookups. The answer is then settled per selection, so a list
rendering the same few selections resolves each of them once. `cx` joins directly while every argument is a string, and
`cn` is the engine's own, answering a repeated call from its argument cache. The suite prices both ends:
`define-only-*`, `first-render-*`, `two-renders-*` and `three-renders-*` for a definition and its first renders, the
resolution rows for every render after.

## Documentation

- [Rendered docs on codefastlabs.com](https://codefastlabs.com/docs/tailwind-variants)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — the compile-then-resolve design, which parts are load-bearing, and how to
  measure a change to it
- [DECISIONS.md](./DECISIONS.md) — why the package exists and the choices that fix its API
- [CHANGELOG.md](./CHANGELOG.md) — release history

## Contributing

Issues and pull requests are welcome. Start with the repository's [contributing guide](../../CONTRIBUTING.md); it covers
the toolchain, the test layout, and the release flow.

## License

Released under the [MIT License](./LICENSE).

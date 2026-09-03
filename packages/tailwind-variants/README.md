# @codefast/tailwind-variants

A type-safe variant styling API for Tailwind CSS — a faster drop-in replacement for `tailwind-variants`, for anyone
building components whose classes depend on props.

[![npm version](https://img.shields.io/npm/v/@codefast/tailwind-variants)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![license](https://img.shields.io/npm/l/@codefast/tailwind-variants)](./LICENSE)

## Overview

`@codefast/tailwind-variants` turns one configuration into a typed function that returns the right Tailwind classes for
a set of props. Describe your `base`, `variants`, and `slots` once; call the function with props; get back a merged
class string. It's a drop-in, faster replacement for `tailwind-variants`, with the same configuration shape.

`tv()` compiles the configuration up front, so resolving a component is string work — and a repeated selection comes
from a cache.

- **One configuration, one typed function.** Describe `base`, `variants`, `compoundVariants`, `slots`, and
  `defaultVariants` once; get back a function whose props are inferred from it.
- **Conflicts settled by `tailwind-merge`.** A caller's `className` wins over the configuration, and an unknown variant
  value is a type error.
- **Compiled up front.** The configuration becomes a plan when `tv()` runs, so resolving a component is string work, and
  a repeated selection is answered from a cache.
- **Drop-in, with no runtime dependencies of its own.** Same configuration shape as `tailwind-variants`;
  `tailwind-merge` is a peer, so you get one copy at the version you chose.

## Installation

```bash
pnpm add @codefast/tailwind-variants tailwind-merge
# npm install @codefast/tailwind-variants tailwind-merge
# yarn add @codefast/tailwind-variants tailwind-merge
```

`@codefast/tailwind-variants` ships ESM only. `tailwind-merge` is a peer dependency (`>=3.0.0`), and the package
requires Node.js 24 or later. It's published on 0.x and versioned on its own track: breaking changes ship as minor
versions, so pin the minor version when you need stability.

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

Every call accepts `className` or `class` for ad-hoc additions. They are appended last, so they win any Tailwind
conflict with the configuration; when both are passed, `className` is used.

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
matching any of its entries:

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
slot only. In a slot configuration, a compound variant's `className` may be a slot map too.

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

`extend` inherits another variant function's configuration. Base classes concatenate; variants, slots, defaults, and
compound definitions merge; the resulting types reflect the union; and a chain of any depth collapses into one
configuration when `tv()` runs:

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
// => "inline-flex items-center rounded-md aspect-square h-10 px-4 hover:bg-accent"

iconButton({ tone: "outline", size: "sm" });
// => "inline-flex items-center rounded-md aspect-square h-9 px-3 border border-input"
```

## Options and `createTV`

`tv(config, options)` takes an optional second argument:

- `twMerge` — set `false` to keep every declared class instead of resolving conflicts (default `true`).
- `twMergeConfig` — a `tailwind-merge` `ConfigExtension` for custom class groups.
- `cacheResolutions` — set `false` to resolve every call from scratch (default `true`).

A variant function remembers what each selection resolved to, because a list renders the same few selections many times
and both the plan walk and the merge are pure functions of the selection. Two consequences are worth knowing:

- A slot component called twice with the same selection gets back the **same** object of slot functions. That is stable
  enough for a React dependency array; it also means the object is shared, so do not mutate it.
- The store is bounded and keyed by the selection, so a variant whose values are effectively unique per call (an id, a
  timestamp, a fresh object) fills it with entries nothing reads again. `cacheResolutions: false` is the escape hatch
  for that component.

`createTV(options)` bakes those options into a shared factory and returns `{ tv, cn }`:

```ts
import { createTV } from "@codefast/tailwind-variants";

const { tv, cn } = createTV({
  twMergeConfig: { extend: { classGroups: { "font-size": [{ text: ["huge"] }] } } },
});

cn("text-base", "text-huge"); // => "text-huge" — the custom group is understood
```

Options passed locally to `tv(config, options)` override the factory's globals. Every variant function also exposes a
read-only `config` property carrying its fully merged configuration, which is what `extend` reads.

## Class utilities

```ts
import { cn, cx } from "@codefast/tailwind-variants";

cn("px-4 py-2", "px-6"); // => "py-2 px-6" — joined, then tailwind-merge
cx("px-4 py-2", "px-6"); // => "px-4 py-2 px-6" — joined only, no merging
cn("base", isActive && "text-primary", { hidden: false }); // conditional values, the shapes clsx accepts
```

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
(strings, numbers, nested arrays, condition objects). Configuration and option types (`VariantConfig`,
`SlotVariantConfig`, `ExtendedVariantConfig`, `TailwindVariantsOptions`, `VariantResolver`, and friends) are exported
for library authors.

## Migrating from `tailwind-variants`

The configuration shape is the same — `base`, `variants`, `slots`, `defaultVariants`, `compoundVariants`,
`compoundSlots`, `extend`, plus the `twMerge` / `twMergeConfig` options — so for most codebases the migration is the
import:

```diff
- import { tv, cn, cx } from "tailwind-variants";
+ import { tv, cn, cx } from "@codefast/tailwind-variants";
```

Two differences to check for:

- `createTV` returns an object `{ tv, cn }` sharing the global options, rather than a bare `tv` function — destructure
  instead of assigning directly.
- `cnMerge` and a mutable `defaultConfig` are not exported; use `createTV` to configure merging.

## Benchmarks

The repository maintains a [benchmark suite](../../benchmarks/tailwind-variants) that runs the same variant workloads —
simple, complex, slots, compound slots, `extend`, `createTV`, and extreme configurations, each with and without merging
— against the upstream `tailwind-variants` package and `class-variance-authority` in isolated subprocesses. Numbers vary
by hardware, so run it yourself rather than reading them here:

```bash
pnpm --filter @codefast/benchmark-tailwind-variants bench
```

The speed comes from settling things once. The configuration is settled when `tv()` is called: variant groups, compound
conditions, and slot positions are compiled into a plan, and every class value is flattened to a string, so resolving a
component is string concatenation rather than dictionary lookups. The answer is then settled per selection, so a list
rendering the same few selections resolves each of them once. `cn` / `cx` take the same string fast path, joining
directly when every argument is already a string. The trade is that `tv()` itself does more work per component
definition, against a resolution that is cheaper on every render; the suite measures both.

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

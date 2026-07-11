# @codefast/tailwind-variants

A type-safe variant styling API for Tailwind CSS — a faster drop-in replacement for `tailwind-variants`, used in production by [@codefast/ui](https://github.com/codefastlabs/codefast/tree/main/packages/ui).

[![npm version](https://img.shields.io/npm/v/@codefast/tailwind-variants)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![license](https://img.shields.io/npm/l/@codefast/tailwind-variants)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

Describe a component's `base` classes, `variants`, `compoundVariants`, `slots`, and `defaultVariants` once; get back a fully typed function that resolves the right Tailwind classes and settles conflicts with `tailwind-merge`.

## Installation

```bash
pnpm add @codefast/tailwind-variants
# npm install @codefast/tailwind-variants
# yarn add @codefast/tailwind-variants
```

Ships ESM only, with `clsx` and `tailwind-merge` as its sole runtime dependencies. Requires Node >= 24 at build/install time.

## Quick Start

```ts
import { tv } from "@codefast/tailwind-variants";

const button = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium",
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground",
      outline: "border border-input bg-background",
    },
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4",
      lg: "h-11 px-8",
    },
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

Every call site accepts `className` or `class` for ad-hoc additions; conflicting Tailwind classes are merged automatically (`className` wins when both are passed).

## Variants

### Boolean variants

A variant group with `"true"` / `"false"` keys accepts real booleans. When such a group has no entry in `defaultVariants`, it defaults to `false`:

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

`compoundVariants` apply extra classes only when all listed conditions match. A condition value may be an array, matching any of its entries:

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

Add `slots` to style a multi-part component. The variant function then returns an object of per-slot functions. Variant values can be a plain class string (applied to the `base` slot) or a slot-to-class map:

```ts
const card = tv({
  slots: {
    root: "rounded-xl border bg-card shadow-sm",
    header: "flex flex-col gap-1.5 p-6",
    content: "p-6 pt-0",
  },
  variants: {
    inset: {
      true: { content: "px-3" },
    },
  },
});

const styles = card({ inset: true });

styles.root(); // => "rounded-xl border bg-card shadow-sm"
styles.content(); // => "p-6 pt-0 px-3"
styles.content({ className: "pb-0" }); // per-slot override, merged per slot
```

Each slot function also accepts variant props of its own, which override the values given at the top-level call for that slot only.

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

`extend` inherits another variant function's configuration — base classes, variants, slots, defaults, and compound definitions all merge, and the resulting types reflect the union:

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

`createTV(options)` bakes those options into a shared factory and returns `{ tv, cn }`:

```ts
import { createTV } from "@codefast/tailwind-variants";

const { tv, cn } = createTV({
  twMergeConfig: {
    extend: { classGroups: { "font-size": [{ text: ["huge"] }] } },
  },
});

cn("text-base", "text-huge"); // => "text-huge" — custom group is understood
```

Options passed locally to `tv(config, options)` override the factory's globals. Every variant function also exposes a read-only `config` property carrying its fully merged configuration.

## Class utilities

```ts
import { cn, cx } from "@codefast/tailwind-variants";

cn("px-4 py-2", "px-6"); // => "py-2 px-6" — clsx + tailwind-merge
cx("px-4 py-2", "px-6"); // => "px-4 py-2 px-6" — clsx only, no merging
cn("base", isActive && "text-primary", { hidden: false }); // conditional values, same shapes as clsx
```

## TypeScript

`VariantProps` extracts the variant props of a variant function (with `class` / `className` stripped) for reuse in component props:

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

Variant values, slot names, and compound conditions are all inferred — passing an unknown variant value or accessing a slot that does not exist is a type error. Configuration and option types (`VariantConfig`, `SlotVariantConfig`, `TailwindVariantsOptions`, `ClassValue`, and friends) are exported for library authors.

## Migrating from `tailwind-variants`

The configuration shape is the same — `base`, `variants`, `slots`, `defaultVariants`, `compoundVariants`, `compoundSlots`, `extend`, plus the `twMerge` / `twMergeConfig` options — so for most codebases the migration is the import:

```diff
- import { tv, cn, cx } from "tailwind-variants";
- import type { VariantProps } from "tailwind-variants";
+ import { tv, cn, cx } from "@codefast/tailwind-variants";
+ import type { VariantProps } from "@codefast/tailwind-variants";
```

Two verified differences:

- `createTV` returns an object `{ tv, cn }` sharing the global options, rather than a bare `tv` function — destructure instead of assigning directly.
- `cnMerge` and the mutable `defaultConfig` are not exported; use `createTV` to configure merging.

## Benchmarks

The repository maintains a [benchmark suite](https://github.com/codefastlabs/codefast/tree/main/benchmarks/tailwind-variants) that runs the same variant workloads — simple, complex, slots, compound slots, `extend`, `createTV`, and extreme configurations, each with and without merging — against the upstream `tailwind-variants` package and `class-variance-authority` in isolated subprocesses. `@codefast/tailwind-variants` is consistently faster than upstream `tailwind-variants` across that suite. Numbers vary by hardware, so run it yourself:

```bash
pnpm --filter @codefast/benchmark-tailwind-variants bench
```

The speed comes from work done once at `tv()` creation time — variant keys and boolean defaults are pre-computed — plus string fast paths in `cn` / `cx` that skip `clsx` when every argument is already a string.

## License

MIT — see [LICENSE](https://github.com/codefastlabs/codefast/blob/main/LICENSE). Release history lives in the [CHANGELOG](https://github.com/codefastlabs/codefast/blob/main/packages/tailwind-variants/CHANGELOG.md).

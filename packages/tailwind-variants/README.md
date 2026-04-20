# @codefast/tailwind-variants

A drop-in, type-safe replacement for `tailwind-variants` with significantly faster runtime performance. Same API — just change the import.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/tailwind-variants.svg)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/tailwind-variants.svg)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/tailwind-variants)](https://bundlephobia.com/package/@codefast/tailwind-variants)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Why @codefast/tailwind-variants](#why-codefasttailwind-variants)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Slots](#slots)
  - [Compound Variants](#compound-variants)
  - [Boolean Variants](#boolean-variants)
  - [Compound Slots](#compound-slots)
  - [Extending Configurations](#extending-configurations)
  - [Global Configuration with `createTV`](#global-configuration-with-createtv)
- [Class Utilities](#class-utilities)
- [API Reference](#api-reference)
- [TypeScript Integration](#typescript-integration)
- [Performance](#performance)
- [Migration](#migration)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Why @codefast/tailwind-variants

`@codefast/tailwind-variants` is an **API-compatible, higher-performance** alternative to [tailwind-variants](https://github.com/nextui-org/tailwind-variants) with the same surface area (`tv`, `createTV`, `cn`, `cx`, `VariantProps`).

### Performance

Benchmarked on Apple M-series silicon. Values are operations/second — higher is better. Run `pnpm --filter @codefast/benchmark-tailwind-variants bench` for numbers on your own hardware.

| Benchmark                   | @codefast/tailwind-variants | tailwind-variants | class-variance-authority |     Speedup     |
| --------------------------- | :-------------------------: | :---------------: | :----------------------: | :-------------: |
| **Simple Variants**         |        477.8K ops/s         |    71.6K ops/s    |       356.1K ops/s       | **6.7x faster** |
| **Simple + Merge**          |        280.7K ops/s         |    66.3K ops/s    |       225.4K ops/s       | **4.2x faster** |
| **Complex Variants**        |        301.1K ops/s         |    48.8K ops/s    |            -             | **6.2x faster** |
| **Slots**                   |         53.7K ops/s         |    10.9K ops/s    |            -             | **4.9x faster** |
| **Compound Slots**          |         31.3K ops/s         |    6.9K ops/s     |            -             | **4.5x faster** |
| **Extreme (240+ variants)** |         10.6K ops/s         |    2.6K ops/s     |            -             | **4.1x faster** |

> CVA does not support slots, compound slots, or `extend`, so it only appears in the simple-variant comparisons.

### Feature matrix

| Feature                   | @codefast/tailwind-variants | tailwind-variants |  CVA   |
| ------------------------- | :-------------------------: | :---------------: | :----: |
| Basic / default variants  |             Yes             |        Yes        |  Yes   |
| Boolean variants          |             Yes             |        Yes        |  Yes   |
| Compound variants         |             Yes             |        Yes        |  Yes   |
| Slots                     |             Yes             |        Yes        |   No   |
| Compound slots            |             Yes             |        Yes        |   No   |
| `extend` inheritance      |             Yes             |        Yes        |   No   |
| Built-in `tailwind-merge` |             Yes             |        Yes        | Manual |
| TypeScript support        |            Full             |       Full        |  Full  |
| Runtime performance       |           Fastest           |      Slowest      | Medium |

### Migration at a glance

```diff
- import { tv } from "tailwind-variants";
+ import { tv } from "@codefast/tailwind-variants";
```

All configuration shapes, option names, and return types are identical.

---

## Requirements

- TypeScript `>= 5.9` (recommended for best type inference)
- Tailwind CSS `>= 4` — optional peer; the variant function itself is pure JavaScript and only produces classes you would use with Tailwind

## Installation

```bash
pnpm add @codefast/tailwind-variants
# or
npm install @codefast/tailwind-variants
# or
yarn add @codefast/tailwind-variants
```

Runtime dependencies are installed automatically:

- `clsx` — conditional class string composition
- `tailwind-merge` — Tailwind class conflict resolution

## Quick Start

```typescript
import { tv } from "@codefast/tailwind-variants";

const button = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4",
      lg: "h-11 px-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

button();
// "inline-flex items-center ... bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"

button({ variant: "destructive", size: "lg" });
// "inline-flex items-center ... bg-destructive ... h-11 px-8"

button({ variant: "outline", size: "sm", className: "w-full" });
// "inline-flex items-center ... border border-input ... h-9 px-3 text-sm w-full"
```

You can pass either `className` or `class` on the call-site — both are recognised, and `className` wins when both are supplied.

## Usage

### Slots

Define `slots` to style a multi-part component. The variant function returns an object whose keys are the slot functions. A `base` slot is always available:

```typescript
import { tv } from "@codefast/tailwind-variants";

const card = tv({
  slots: {
    base: "rounded-lg border bg-card text-card-foreground shadow-sm",
    header: "flex flex-col space-y-1.5 p-6",
    content: "p-6 pt-0",
    footer: "flex items-center p-6 pt-0",
  },
  variants: {
    variant: {
      default: "",
      destructive: {
        base: "border-destructive",
        header: "text-destructive",
      },
    },
  },
});

const styles = card();
styles.base(); // "rounded-lg border bg-card ..."
styles.header(); // "flex flex-col space-y-1.5 p-6"
styles.content(); // "p-6 pt-0"
styles.footer(); // "flex items-center p-6 pt-0"

const destructive = card({ variant: "destructive" });
destructive.base(); // "... border-destructive"
destructive.header(); // "... text-destructive"
```

Each slot function accepts its own `className`/`class` override, which is merged per-slot:

```typescript
styles.header({ className: "pb-0" });
```

### Compound Variants

Attach classes that only apply when **all** listed conditions match:

```typescript
const alert = tv({
  base: "relative w-full rounded-lg border px-4 py-3",
  variants: {
    variant: {
      default: "bg-background text-foreground",
      destructive: "border-destructive/50 text-destructive",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
    },
  },
  compoundVariants: [
    {
      variant: "destructive",
      size: "md",
      className: "font-semibold",
    },
  ],
  defaultVariants: { variant: "default", size: "md" },
});

alert({ variant: "destructive", size: "md" });
// "... border-destructive/50 text-destructive text-base font-semibold"

alert({ variant: "destructive", size: "sm" });
// "... border-destructive/50 text-destructive text-sm" (font-semibold omitted)
```

A variant key inside a compound can also be an array, matching any of the listed values.

### Boolean Variants

Use `true` / `false` keys to declare boolean-addressable variants. The props can be passed as real booleans:

```typescript
const toggle = tv({
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium",
  variants: {
    pressed: {
      true: "bg-accent text-accent-foreground",
      false: "bg-transparent",
    },
    disabled: {
      true: "opacity-50 pointer-events-none",
      false: "",
    },
  },
  defaultVariants: { pressed: false, disabled: false },
});

toggle({ pressed: true });
// "... bg-accent text-accent-foreground"

toggle({ pressed: true, disabled: true });
// "... bg-accent text-accent-foreground opacity-50 pointer-events-none"
```

When a variant group has `"true"` or `"false"` keys but no explicit default, the resolver defaults to `"false"`.

### Compound Slots

Target one or more slots when a set of variants match:

```typescript
const dialog = tv({
  slots: {
    overlay: "fixed inset-0 bg-background/80 backdrop-blur-sm",
    content: "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    header: "flex flex-col space-y-1.5 text-center sm:text-left",
    footer: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
  },
  variants: {
    size: { sm: "", lg: "" },
  },
  compoundSlots: [
    { size: "sm", slots: ["content"], className: "max-w-md" },
    { size: "lg", slots: ["content"], className: "max-w-2xl" },
  ],
});

dialog({ size: "sm" }).content(); // "... max-w-md"
dialog({ size: "lg" }).content(); // "... max-w-2xl"
```

### Extending Configurations

Use `extend` to inherit variants and slots from another variant function, then add or override:

```typescript
const baseButton = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium",
  variants: {
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4",
    },
  },
  defaultVariants: { size: "md" },
});

const iconButton = tv({
  extend: baseButton,
  base: "aspect-square",
  variants: {
    variant: {
      ghost: "hover:bg-accent hover:text-accent-foreground",
      outline: "border border-input",
    },
  },
  defaultVariants: { variant: "ghost" },
});

iconButton();
// "inline-flex items-center ... aspect-square h-10 px-4 hover:bg-accent ..."

iconButton({ variant: "outline", size: "sm" });
// "inline-flex items-center ... aspect-square h-9 px-3 text-sm border border-input"
```

Both variant schemas and slot schemas merge; TypeScript reflects the union in `VariantProps`.

### Global Configuration with `createTV`

`createTV` builds a factory that pre-applies `twMerge` / `twMergeConfig` to every variant function and `cn` invocation produced by it:

```typescript
import { createTV } from "@codefast/tailwind-variants";

const { tv, cn } = createTV({
  twMerge: true,
  twMergeConfig: {
    extend: {
      classGroups: {
        "font-size": ["text-custom-sm", "text-custom-lg"],
      },
    },
  },
});

// Both `tv` and `cn` now share the extended merge rules.
```

Local options passed to `tv(config, options)` still take precedence over the factory's global options.

## Class Utilities

### `cn(...classes)`

Composes classes with `clsx`, then resolves Tailwind conflicts with `tailwind-merge`:

```typescript
import { cn } from "@codefast/tailwind-variants";

cn("px-4 py-2", "px-6 py-3");
// "px-6 py-3"

cn("base", isActive && "text-primary", { disabled: isDisabled });
// "base text-primary" (when isActive, not disabled)
```

### `cx(...classes)`

Composes classes with `clsx` **without** `tailwind-merge`. Use when you need to preserve every token, or when merging isn't meaningful (non-Tailwind classes):

```typescript
import { cx } from "@codefast/tailwind-variants";

cx("px-4 py-2", "px-6 py-3");
// "px-4 py-2 px-6 py-3"
```

## API Reference

### `tv(config, options?)`

Creates a variant function from a configuration.

| Parameter | Type                                                                   | Description                                                                                                       |
| --------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `config`  | `Configuration` \| `ConfigurationWithSlots` \| `ExtendedConfiguration` | Object with any of `base`, `variants`, `slots`, `compoundVariants`, `compoundSlots`, `defaultVariants`, `extend`. |
| `options` | `TailwindVariantsConfiguration`                                        | Optional: `twMerge?: boolean` (default `true`), `twMergeConfig?: ConfigExtension` (see `tailwind-merge`).         |

**Returns** — a callable variant function. Without `slots`, it returns `string \| undefined`. With `slots`, it returns an object of slot functions (including an implicit `base`).

The returned function also exposes a read-only `config` property carrying the fully merged configuration (useful for introspection and the `extend` chain).

### `createTV(globalConfig?)`

| Parameter      | Type                            | Description                                            |
| -------------- | ------------------------------- | ------------------------------------------------------ |
| `globalConfig` | `TailwindVariantsConfiguration` | Shared `twMerge` / `twMergeConfig` applied to outputs. |

**Returns** `{ tv, cn }`. Local `options` given to `tv(config, options)` override the factory's globals.

### `cn(...classes)` / `cx(...classes)`

| Parameter    | Type           | Description                                                         |
| ------------ | -------------- | ------------------------------------------------------------------- |
| `...classes` | `ClassValue[]` | Accepts strings, arrays, and condition maps (same shape as `clsx`). |

`cn` returns a tailwind-merged string. `cx` returns the raw concatenation.

### `VariantProps<T>`

Extracts variant props from a variant function for use in component props. `class` and `className` are stripped.

```typescript
import { tv, type VariantProps } from "@codefast/tailwind-variants";

const button = tv({
  /* ... */
});
type ButtonVariantProps = VariantProps<typeof button>;
// { variant?: "default" | "destructive" | "outline"; size?: "sm" | "md" | "lg" }
```

### Exported types

The following types are exported for advanced/library use:

`ClassValue`, `Configuration`, `ConfigurationWithSlots`, `ConfigurationSchema`, `ConfigurationVariants`, `ExtendedConfiguration`, `CompoundVariantType`, `CompoundVariantWithSlotsType`, `CompoundSlotType`, `MergedSchemas`, `MergedSlotSchemas`, `SlotConfigurationSchema`, `SlotProperties`, `SlotFunctionType`, `SlotFunctionProperties`, `BooleanVariantChecker`, `StringToBooleanType`, `TailwindVariantsConfiguration`, `TailwindVariantsFactory`, `TailwindVariantsFactoryResult`, `TailwindVariantsReturnType`, `VariantFunctionType`, `VariantProps`.

## TypeScript Integration

### Component props

```typescript
import { tv, type VariantProps } from "@codefast/tailwind-variants";
import type { ComponentProps } from "react";

const button = tv({
  base: "px-4 py-2 rounded",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
    size: { sm: "text-sm", lg: "text-lg" },
  },
});

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>;

function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={button({ variant, size, className })} {...props} />;
}
```

### Slot-based components are fully typed

Accessing a slot that doesn't exist is a type error:

```typescript
const card = tv({
  slots: { base: "rounded-lg border", header: "p-4", content: "p-4" },
  variants: {
    variant: { elevated: { base: "shadow-lg", header: "bg-muted" } },
  },
});

const styles = card({ variant: "elevated" });
styles.base(); // OK
styles.header(); // OK
styles.content(); // OK
// styles.footer(); // ts error — "footer" is not a slot
```

### Disabling Tailwind merge

Set `twMerge: false` when you need every declared class preserved:

```typescript
const component = tv(
  { base: "px-4 py-2", variants: { size: { sm: "px-2 py-1", lg: "px-6 py-3" } } },
  { twMerge: false },
);
```

## Performance

- Tree-shakeable ESM exports; `sideEffects: false`.
- Runtime dependencies are `clsx` and `tailwind-merge` only.
- Variant keys and boolean defaults are **pre-computed at `tv()` creation time** so the hot path avoids repeated `Object.keys()` and boolean coercion.
- `cn` / `cx` take a fast path that skips `clsx` when all arguments are strings or falsy.
- Per-instance `tailwind-merge` services are cached; `extendTailwindMerge` is only used when `twMergeConfig` is supplied.

### Creation-time validation

`compoundVariants` is validated once when `tv()` is called — passing a non-array throws immediately rather than lazily at render time.

### Optimization tip

Define variant functions at module scope, not inside component bodies:

```tsx
// Good — created once at module load
const buttonVariants = tv({
  /* ... */
});

function Button({ variant, className, ...props }) {
  return <button className={buttonVariants({ variant, className })} {...props} />;
}
```

## Migration

### From `tailwind-variants`

Replace the import. No other code changes required.

```diff
- import { tv, createTV, cn, cx, type VariantProps } from "tailwind-variants";
+ import { tv, createTV, cn, cx, type VariantProps } from "@codefast/tailwind-variants";
```

### From `class-variance-authority`

```typescript
// CVA
import { cva } from "class-variance-authority";
const button = cva("px-4 py-2 rounded", {
  variants: { variant: { primary: "bg-blue-500 text-white" } },
});

// @codefast/tailwind-variants
import { tv } from "@codefast/tailwind-variants";
const button = tv({
  base: "px-4 py-2 rounded",
  variants: { variant: { primary: "bg-blue-500 text-white" } },
});
```

Key differences from CVA:

1. `base` is a property on the configuration object — not the first positional argument.
2. Slots, compound slots, and `extend` are natively supported.
3. Tailwind-class conflict resolution is built in.

## Best Practices

1. **Declare variant functions at module scope.** Avoids per-render allocation and preserves the pre-computed caches.
2. **Always set `defaultVariants`.** Ensures the base appearance is deterministic and makes each variant prop truly optional at the type level.
3. **Prefer slots for multi-part components.** Each slot gets its own class override and per-slot compound targeting.
4. **Use `extend` for specialisations.** A `baseButton` variant function can back `iconButton`, `linkButton`, etc., with fully-merged types.
5. **Reach for `cn` only for ad-hoc joins.** Variant functions already tailwind-merge their output — don't re-merge the result unless you're stacking on external classes.

## Contributing

Contributions are welcome. See the [repository-root contributing guide](../../README.md#contributing) for the general workflow.

Package-local scripts:

```bash
# watch-mode build (uses tsdown)
pnpm --filter @codefast/tailwind-variants dev

# one-shot production build
pnpm --filter @codefast/tailwind-variants build

# unit tests
pnpm --filter @codefast/tailwind-variants test
pnpm --filter @codefast/tailwind-variants test:coverage

# type-check only
pnpm --filter @codefast/tailwind-variants check-types
```

This package builds with [`tsdown`](https://tsdown.dev) (see `tsdown.config.ts`), emitting per-file `*.mjs` / `*.d.mts` into `dist/`.

## License

MIT — see the repository-level [LICENSE](../../LICENSE).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

# @codefast/tailwind-variants

Type-safe variant API for Tailwind CSS with enhanced functionality and advanced TypeScript support for building flexible component styling systems.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/tailwind-variants.svg)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/tailwind-variants.svg)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/tailwind-variants)](https://bundlephobia.com/package/@codefast/tailwind-variants)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Why @codefast/tailwind-variants?](#why-codefasttailwind-variants)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Slots](#slots---multi-part-components)
  - [Compound Variants](#compound-variants)
  - [Boolean Variants](#boolean-variants)
  - [Configuration Extension](#configuration-extension)
  - [Compound Slots](#compound-slots)
  - [Global Configuration](#global-configuration-with-createtv)
- [Utility Functions](#utility-functions)
- [API Reference](#api-reference)
- [TypeScript Integration](#typescript-integration)
- [Performance](#performance)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Why @codefast/tailwind-variants?

This library is a **high-performance, drop-in replacement** for [tailwind-variants](https://github.com/nextui-org/tailwind-variants) with the same API but significantly better performance.

### Performance Comparison

Benchmarked on Apple M-series chip. Results show operations per second (higher is better). Run `pnpm --filter @codefast/benchmark-tailwind-variants bench` to get results on your machine.

| Benchmark                   | @codefast/tailwind-variants | tailwind-variants | class-variance-authority |     Speedup     |
| --------------------------- | :-------------------------: | :---------------: | :----------------------: | :-------------: |
| **Simple Variants**         |        477.8K ops/s         |    71.6K ops/s    |       356.1K ops/s       | **6.7x faster** |
| **Simple + Merge**          |        280.7K ops/s         |    66.3K ops/s    |       225.4K ops/s       | **4.2x faster** |
| **Complex Variants**        |        301.1K ops/s         |    48.8K ops/s    |            -             | **6.2x faster** |
| **Slots**                   |         53.7K ops/s         |    10.9K ops/s    |            -             | **4.9x faster** |
| **Compound Slots**          |         31.3K ops/s         |    6.9K ops/s     |            -             | **4.5x faster** |
| **Extreme (240+ variants)** |         10.6K ops/s         |    2.6K ops/s     |            -             | **4.1x faster** |

> **Note:** CVA does not support slots, compound slots, or extends -- it is only included in simple variant benchmarks. Benchmark results may vary by hardware and environment.

### Feature Comparison

| Feature            | @codefast/tailwind-variants | tailwind-variants |  CVA   |
| ------------------ | :-------------------------: | :---------------: | :----: |
| Basic Variants     |             Yes             |        Yes        |  Yes   |
| Boolean Variants   |             Yes             |        Yes        |  Yes   |
| Compound Variants  |             Yes             |        Yes        |  Yes   |
| Default Variants   |             Yes             |        Yes        |  Yes   |
| **Slots**          |             Yes             |        Yes        |   No   |
| **Compound Slots** |             Yes             |        Yes        |   No   |
| **Extends**        |             Yes             |        Yes        |   No   |
| Tailwind Merge     |          Built-in           |     Built-in      | Manual |
| TypeScript         |            Full             |       Full        |  Full  |
| **Performance**    |           Fastest           |      Slowest      | Medium |
| Bundle Size        |            ~5KB             |       ~4KB        |  ~1KB  |

### Migration from tailwind-variants

Migrating is as simple as changing your import:

```diff
- import { tv } from "tailwind-variants";
+ import { tv } from "@codefast/tailwind-variants";
```

The API is 100% compatible. All existing code works without any changes.

---

## Installation

```bash
pnpm add @codefast/tailwind-variants
```

Or using npm:

```bash
npm install @codefast/tailwind-variants
```

**Optional peer dependency:**

```bash
pnpm add tailwindcss
```

**Runtime dependencies** (installed automatically):

- `clsx` -- Utility for constructing className strings conditionally
- `tailwind-merge` -- Utility for merging Tailwind CSS classes and resolving conflicts

**Requirements:**

- Node.js >= 24.0.0 (LTS)
- TypeScript >= 5.9.2 (recommended)
- Tailwind CSS >= 4.0.0 (optional)

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
// => "inline-flex items-center ... bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"

button({ variant: "destructive", size: "lg" });
// => "inline-flex items-center ... bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 px-8"

button({ variant: "outline", size: "sm", className: "w-full" });
// => "inline-flex items-center ... border border-input ... h-9 px-3 text-sm w-full"
```

## Usage

### Slots -- Multi-part Components

Slots enable styling for components with multiple distinct parts:

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

const cardStyles = card();
cardStyles.base(); // => "rounded-lg border bg-card text-card-foreground shadow-sm"
cardStyles.header(); // => "flex flex-col space-y-1.5 p-6"
cardStyles.content(); // => "p-6 pt-0"
cardStyles.footer(); // => "flex items-center p-6 pt-0"

const destructiveCard = card({ variant: "destructive" });
destructiveCard.base(); // => "... border-destructive"
destructiveCard.header(); // => "... text-destructive"
```

### Compound Variants

Apply styles when multiple variant conditions are met simultaneously:

```typescript
import { tv } from "@codefast/tailwind-variants";

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
      className: "font-semibold", // Only when variant=destructive AND size=md
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

alert({ variant: "destructive", size: "md" });
// => "... border-destructive/50 text-destructive text-base font-semibold"

alert({ variant: "destructive", size: "sm" });
// => "... border-destructive/50 text-destructive text-sm"  (no font-semibold)
```

### Boolean Variants

Use `true`/`false` keys for boolean-based variant conditions:

```typescript
import { tv } from "@codefast/tailwind-variants";

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
  defaultVariants: {
    pressed: false,
    disabled: false,
  },
});

toggle({ pressed: true }); // => "... bg-accent text-accent-foreground"
toggle({ pressed: true, disabled: true }); // => "... bg-accent text-accent-foreground opacity-50 pointer-events-none"
```

### Configuration Extension

Extend existing variant configurations to build specialized components:

```typescript
import { tv } from "@codefast/tailwind-variants";

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
// => "inline-flex items-center ... aspect-square h-10 px-4 hover:bg-accent hover:text-accent-foreground"

iconButton({ variant: "outline", size: "sm" });
// => "inline-flex items-center ... aspect-square h-9 px-3 text-sm border border-input"
```

### Compound Slots

Apply styles to specific slots based on variant conditions:

```typescript
import { tv } from "@codefast/tailwind-variants";

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

dialog({ size: "sm" }).content(); // => "... max-w-md"
dialog({ size: "lg" }).content(); // => "... max-w-2xl"
```

### Global Configuration with createTV

Create a factory with global configuration applied to all variant instances:

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

// tv() and cn() now use the global config automatically
```

## Utility Functions

### cn(...classes)

Combines and merges CSS classes using `tailwind-merge` for conflict resolution:

```typescript
import { cn } from "@codefast/tailwind-variants";

cn("px-4 py-2", "px-6 py-3");
// => "px-6 py-3" (later classes override)

cn("base-class", true && "conditional", false && "skipped");
// => "base-class conditional"
```

### cx(...classes)

Combines CSS classes using `clsx` without Tailwind-aware conflict resolution:

```typescript
import { cx } from "@codefast/tailwind-variants";

cx("px-4 py-2", "px-6 py-3");
// => "px-4 py-2 px-6 py-3" (no conflict resolution)
```

## API Reference

### tv(config, options?)

Creates a variant function from configuration.

| Parameter | Type        | Description                                                                                                                     |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `config`  | `TVConfig`  | Configuration object defining `base`, `variants`, `slots`, `compoundVariants`, `compoundSlots`, `defaultVariants`, and `extend` |
| `options` | `TVOptions` | Optional settings: `twMerge` (boolean), `twMergeConfig` (object)                                                                |

**Returns:** A callable variant function. When slots are defined, returns an object of slot functions.

### createTV(globalConfig?)

Creates a factory with global configuration settings.

| Parameter      | Type        | Description                                        |
| -------------- | ----------- | -------------------------------------------------- |
| `globalConfig` | `TVOptions` | Global configuration applied to all `tv` instances |

**Returns:** `{ tv, cn }` -- Functions with global settings applied.

### cn(...classes)

| Parameter    | Type           | Description                      |
| ------------ | -------------- | -------------------------------- |
| `...classes` | `ClassValue[]` | CSS classes to combine and merge |

**Returns:** `string` -- Merged class string with Tailwind conflicts resolved.

### cx(...classes)

| Parameter    | Type           | Description            |
| ------------ | -------------- | ---------------------- |
| `...classes` | `ClassValue[]` | CSS classes to combine |

**Returns:** `string` -- Combined class string without conflict resolution.

### VariantProps\<T\>

TypeScript utility type that extracts variant props from a variant function:

```typescript
import { tv, type VariantProps } from "@codefast/tailwind-variants";

const button = tv({
  /* ... */
});
type ButtonVariants = VariantProps<typeof button>;
```

## TypeScript Integration

### Extracting Props

```typescript
import { tv, type VariantProps } from "@codefast/tailwind-variants";

const button = tv({
  base: "px-4 py-2 rounded",
  variants: {
    variant: { primary: "bg-blue-500 text-white", secondary: "bg-gray-500 text-white" },
    size: { sm: "text-sm", lg: "text-lg" },
  },
});

type ButtonProps = VariantProps<typeof button>;
// { variant?: "primary" | "secondary"; size?: "sm" | "lg"; className?: string }
```

### Slots Type Safety

Slot functions are fully typed. Accessing a non-existent slot produces a TypeScript error:

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
// styles.footer(); // TypeScript error -- slot does not exist
```

### Configuration Options

```typescript
const component = tv(
  { base: 'px-4 py-2', variants: { size: { sm: 'px-2 py-1', lg: 'px-6 py-3' } } },
  {
    twMerge: true,       // Enable Tailwind class conflict resolution (default: true)
    twMergeConfig: { ... }, // Custom tailwind-merge configuration
  },
);
```

Set `twMerge: false` to disable Tailwind-aware merging when you need to preserve duplicate utility classes.

## Performance

### Bundle Size

- Tree-shakeable exports
- Minimal runtime dependencies (`clsx` + `tailwind-merge`)
- ~5KB minified + gzipped

### Runtime Performance

- Cached `tailwind-merge` instances for reuse
- Efficient class merging algorithms
- Lazy evaluation of variant resolution
- Minimal memory footprint

### Optimization Tip

Always define variant configurations outside of component render functions:

```typescript
// Good -- created once
const buttonVariants = tv({ base: 'px-4 py-2 rounded', variants: { /* ... */ } });

function Button({ variant, className, ...props }) {
  return <button className={buttonVariants({ variant, className })} {...props} />;
}
```

## Migration Guide

### From tailwind-variants

Change the import path. No other changes needed:

```diff
- import { tv } from "tailwind-variants";
+ import { tv } from "@codefast/tailwind-variants";
```

### From class-variance-authority (CVA)

```typescript
// Before (CVA)
import { cva } from "class-variance-authority";
const button = cva("px-4 py-2 rounded", {
  variants: { variant: { primary: "bg-blue-500 text-white" } },
});

// After
import { tv } from "@codefast/tailwind-variants";
const button = tv({
  base: "px-4 py-2 rounded",
  variants: { variant: { primary: "bg-blue-500 text-white" } },
});
```

**Key differences from CVA:**

1. Uses `base` property instead of first string parameter.
2. Native slots and compound slots support.
3. Built-in configuration extension via `extend`.
4. Built-in Tailwind class conflict resolution.

## Best Practices

1. **Define variants outside components** -- Avoids recreating the configuration on every render.
2. **Use `defaultVariants`** -- Ensures components always have a sensible default appearance.
3. **Leverage slots for multi-part components** -- Keeps styling co-located and type-safe.
4. **Use `extend` for component hierarchies** -- Create base configurations and extend them for specialized variants.
5. **Use `cn` for one-off class overrides** -- The `className` prop on variant functions already uses Tailwind merge.

## Contributing

We welcome contributions! Please see the [contributing guide](../../README.md#contributing) in the root of this repository for detailed instructions.

For package-specific development:

```bash
# Development mode with watch
pnpm dev --filter=@codefast/tailwind-variants

# Run tests
pnpm test --filter=@codefast/tailwind-variants

# Run tests with coverage
pnpm test:coverage --filter=@codefast/tailwind-variants
```

Package build/dev scripts use TypeScript directly via `tsc -p tsconfig.build.json` (watch mode for `pnpm dev --filter=@codefast/tailwind-variants`).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.

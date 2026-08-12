# RFC: Tailwind Variants (TV) - Type-Safe Variant API for Tailwind CSS

> **Status:** accepted and implemented. Written 2025-09-14; `tv()`, slots, `extend`, compound variants, `cn`/`cx` and
> `createTV` have all shipped in `@codefast/tailwind-variants`.
>
> **This is a design record, not API documentation.** For real usage see [README.md](./README.md) — read that first.
> This document is kept for the _why_ (the comparison against `tailwind-variants`/`cva`, the type-inference trade-offs),
> which is written down nowhere else; the code below illustrates design intent at the time and is not checked against
> the current API.
>
> The **Future Roadmap** section at the end is a wish list from when the RFC was written, not a plan: the browser
> extension, the VS Code extension and the CLI migration tool do not exist and are not scheduled.

## Summary

**Tailwind Variants (TV)** is a powerful library designed to create type-safe variant APIs for Tailwind CSS, letting
developers build flexible component systems with a simple syntax and an excellent developer experience.

## Motivation

Managing component variants in Tailwind CSS usually leads to:

- Code duplication and poor maintainability
- Missing type safety when using TypeScript
- Complex logic to handle conditional classes
- Difficulty extending and reusing components
- Class conflicts that are not resolved automatically

TV solves these problems by providing a declarative, type-safe API with automatic class merging and a capable variant
system.

## Detailed Design

### 1. Core API - The `tv()` Function

#### 1.1 Basic Usage

```typescript
const button = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      outline: "border border-input",
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

// Usage
button(); // -> classes with default variants
button({ variant: "destructive", size: "lg" });
button({ className: "w-full" }); // merge custom classes
```

#### 1.2 Nested Arrays Support

```typescript
const component = tv({
  base: ["base-1", ["base-2", ["base-3"]]], // Flatten automatically
  variants: {
    color: {
      primary: ["text-blue-500", ["bg-blue-50", ["hover:bg-blue-100"]]],
    },
  },
});
```

#### 1.3 Boolean Variants

```typescript
const toggle = tv({
  base: "toggle-base",
  variants: {
    disabled: {
      true: "opacity-50 cursor-not-allowed",
      false: "opacity-100",
    },
  },
});

// Usage
toggle({ disabled: true });
toggle({ disabled: false });
toggle(); // Uses false as default for boolean variants
```

### 2. Compound Variants System

#### 2.1 Basic Compound Variants

```typescript
const button = tv({
  base: "button-base",
  variants: {
    variant: {
      primary: "bg-blue-500",
      secondary: "bg-gray-500",
    },
    size: {
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  compoundVariants: [
    {
      // Apply when variant=primary AND size=lg
      variant: "primary",
      size: "lg",
      className: "shadow-lg font-bold",
    },
  ],
});
```

#### 2.2 Type Safety

- Compound variants only accept valid combinations
- Compile-time errors for invalid variant keys
- Full IntelliSense support

### 3. Slots System - Multi-Element Components

#### 3.1 Basic Slots

```typescript
const card = tv({
  slots: {
    base: "rounded-lg border shadow-sm",
    header: "flex flex-col space-y-1.5 p-6",
    title: "font-semibold leading-none",
    description: "text-sm text-muted-foreground",
    content: "p-6 pt-0",
    footer: "flex items-center p-6 pt-0",
  },
  variants: {
    size: {
      sm: {
        header: "p-4",
        content: "p-4 pt-0",
        footer: "p-4 pt-0",
      },
      lg: {
        header: "p-8",
        content: "p-8 pt-0",
        footer: "p-8 pt-0",
      },
    },
  },
});

// Usage
const { base, header, title, content } = card({ size: "sm" });
base(); // -> card base classes
header(); // -> header classes with size=sm
title({ className: "text-xl" }); // -> title + custom classes
```

#### 3.2 Slot-Level Variant Overrides

```typescript
const menu = tv({
  slots: {
    base: "menu-base",
    item: "menu-item",
  },
  variants: {
    color: {
      primary: {
        base: "bg-blue-500",
        item: "text-blue-600",
      },
    },
  },
});

// Individual slot override
const { base, item } = menu();
item({ color: "secondary" }); // Override color for just this slot
```

#### 3.3 Compound Slots

```typescript
const pagination = tv({
  slots: {
    base: "flex space-x-2",
    item: "px-3 py-1",
    prev: "px-3 py-1",
    next: "px-3 py-1",
  },
  compoundSlots: [
    {
      // Apply to multiple slots when conditions are met
      slots: ["item", "prev", "next"],
      size: "sm",
      className: ["w-8 h-8", "text-xs"],
    },
  ],
});
```

### 4. Extends System - Component Inheritance

#### 4.1 Basic Extension

```typescript
const baseInput = tv({
  base: "border rounded px-3 py-2",
  variants: {
    size: {
      sm: "text-sm px-2 py-1",
      lg: "text-lg px-4 py-3",
    },
  },
});

const textArea = tv({
  base: "min-h-[80px] resize-none",
  extend: baseInput, // Inherit all variants and base classes
  variants: {
    size: {
      sm: "min-h-[60px]", // Override specific size
      lg: "min-h-[120px]",
    },
  },
});
```

#### 4.2 Multi-Level Extension

```typescript
const themeButton = tv({ base: "font-medium", variants: {...} });
const appButton = tv({ extend: themeButton });
const specificButton = tv({ extend: appButton });
// Inheritance chain: themeButton -> appButton -> specificButton
```

#### 4.3 Slots Extension

```typescript
const baseCard = tv({
  slots: { base: "rounded", content: "p-4" },
  variants: { size: { sm: { content: "p-2" } } },
});

const extendedCard = tv({
  extend: baseCard,
  slots: { footer: "border-t" }, // Add new slots
  variants: {
    size: {
      sm: { footer: "text-sm" }, // Extend existing variants
    },
  },
});
```

### 5. Tailwind Merge Integration

#### 5.1 Automatic Conflict Resolution

```typescript
const component = tv({
  base: "text-lg text-sm px-4 px-2", // Conflicts resolved: text-sm px-2
});

// Result: "text-sm px-2" (later classes win)
```

#### 5.2 Custom Tailwind Merge Config

```typescript
const component = tv(
  {
    base: "text-tiny text-small shadow-small shadow-large",
    variants: {
      size: {
        sm: "w-unit-2",
        lg: "w-unit-6",
      },
    },
  },
  {
    twMergeConfig: {
      extend: {
        classGroups: {
          "font-size": [{ text: ["tiny", "small", "medium", "large"] }],
        },
        theme: {
          spacing: ["unit", "unit-2", "unit-4", "unit-6"],
        },
      },
    },
  },
);
```

#### 5.3 Disable Tailwind Merge

```typescript
const component = tv(
  { base: "px-4 px-2" }, // Both classes preserved
  { twMerge: false },
);
// Result: "px-4 px-2" (no merging)
```

### 6. Factory Pattern with createTV

#### 6.1 Theme Configuration

```typescript
const { tv: createThemeTV } = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        "font-size": [{ text: ["xs", "sm", "base", "lg"] }],
      },
    },
  },
});

// All components created with this factory inherit the config
const alert = createThemeTV({
  base: "rounded border p-4",
  variants: { variant: { default: "bg-background" } },
});
```

#### 6.2 Config Override

```typescript
const { tv } = createTV({ twMerge: false });
const component = tv(
  { base: "conflicting classes" },
  { twMerge: true }, // Override factory config
);
```

### 7. Type Safety & Developer Experience

#### 7.1 VariantProps Type Extraction

```typescript
const button = tv({
  variants: {
    variant: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
});

// Extract props type for React components
type ButtonProps = VariantProps<typeof button>;
// { variant?: "primary" | "secondary", size?: "sm" | "md" | "lg", className?: ClassValue }

interface MyButtonProps extends ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### 7.2 ClassValue Support

```typescript
// Accepts multiple class formats
button({
  className: "custom-class", // string
});
button({
  className: ["class1", "class2"], // array
});
button({
  className: { conditional: true, other: false }, // object
});
```

### 8. Advanced Patterns & Real-World Usage

#### 8.1 Responsive Design System

```typescript
const grid = tv({
  base: "grid gap-4",
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      auto: "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
    },
  },
});
```

#### 8.2 Design System Components

```typescript
// Navigation with compound variants
const nav = tv({
  slots: { root: "flex", list: "flex space-x-1", link: "px-3 py-2" },
  variants: {
    orientation: {
      horizontal: { list: "flex-row" },
      vertical: { list: "flex-col space-x-0 space-y-1" },
    },
    variant: {
      pills: { link: "rounded-full" },
    },
  },
  compoundVariants: [
    {
      orientation: "vertical",
      variant: "pills",
      className: { list: "space-y-2" },
    },
  ],
});
```

#### 8.3 Form Component Inheritance

```typescript
const baseInput = tv({
  base: "border rounded focus:ring-2",
  variants: { size: { sm: "px-2 py-1", lg: "px-4 py-3" } },
});

const textInput = tv({ extend: baseInput });
const select = tv({
  extend: baseInput,
  base: "cursor-pointer",
  variants: { size: { sm: "pr-6", lg: "pr-10" } },
});
const textarea = tv({
  extend: baseInput,
  base: "min-h-[80px]",
  variants: { size: { sm: "min-h-[60px]", lg: "min-h-[120px]" } },
});
```

## Developer Experience (DX)

### 1. IntelliSense & Autocompletion

- Full TypeScript support with strict type inference
- Autocomplete for variant keys and values
- Error highlighting for invalid configurations

### 2. Runtime Safety

- Automatic validation of the compound variants configuration
- Clear error messages for configuration errors
- Graceful handling of undefined/null values

### 3. Performance

- Minimal runtime overhead
- Efficient class string concatenation
- Tree-shaking friendly architecture

### 4. Debugging

- Clear component hierarchy with extends
- Transparent class resolution process
- Development mode warnings

## Migration & Adoption

### 1. From CSS Modules/Styled Components

```typescript
// Before: CSS Modules
import styles from "./button.module.css";
const className = `${styles.base} ${variant === "primary" ? styles.primary : styles.secondary}`;

// After: TV
const button = tv({
  base: "base-styles",
  variants: { variant: { primary: "primary-styles", secondary: "secondary-styles" } },
});
const className = button({ variant: "primary" });
```

### 2. From Class Variance Authority (CVA)

- A similar API, with many more features on top
- A simple migration path — the syntax is nearly identical
- Adds slots, extends and compound slots

## Ecosystem Integration

### 1. React Integration

```typescript
import React from "react";
import { tv } from "@codefast/tailwind-variants";
import type { VariantProps } from "@codefast/tailwind-variants";

const button = tv({...});

interface ButtonProps extends VariantProps<typeof button> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, ...variants }) => {
  return (
    <button className={button(variants)}>
      {children}
    </button>
  );
};
```

### 2. Vue Integration

```vue
<script setup lang="ts">
import { tv } from "@codefast/tailwind-variants";
const button = tv({...});
const props = defineProps<{variant?: "primary" | "secondary"}>();
</script>

<template>
  <button :class="button(props)">
    <slot />
  </button>
</template>
```

### 3. Framework Agnostic

- No dependency on any specific framework
- Usable with vanilla JS, React, Vue, Svelte and Solid.js
- Server-side rendering friendly

## Performance Considerations

### 1. Bundle Size

- Tree-shaking to drop unused code
- Minimal runtime with optimized class concatenation
- No external dependencies other than tailwind-merge

### 2. Runtime Performance

- Efficient caching of compiled class strings
- Optimized conditional logic for variants
- Minimal memory footprint

### 3. Build Time

- No build-time dependencies
- Compatible with every bundler
- Works with the Tailwind CSS JIT compiler

## Testing Strategy

### 1. Unit Testing

- Test individual variant combinations
- Validate class string outputs
- Test edge cases and error conditions

### 2. Integration Testing

- Test with real component frameworks
- Validate TypeScript integration
- Test complex inheritance scenarios

### 3. Performance Testing

- Bundle size impact measurements
- Runtime performance benchmarks
- Memory usage profiling

## Future Roadmap

### 1. Enhanced Type Safety

- Stricter validation for compound variants
- Better error messages with suggestions
- Advanced type inference improvements

### 2. Additional Features

- Animation/transition utilities
- Theme switching capabilities
- CSS-in-JS integration options

### 3. Developer Tools

- Browser extension for debugging
- VS Code extension with enhanced IntelliSense
- CLI tools for migration assistance

## Conclusion

Tailwind Variants (TV) provides a complete solution for managing variants in Tailwind CSS:

- **Type Safety**: Full TypeScript support with strict inference
- **Flexibility**: Slots, extends and compound variants for every use case
- **Performance**: Minimal overhead with efficient class merging
- **DX**: Excellent developer experience with IntelliSense and clear APIs
- **Scalability**: From simple components to complex design systems

TV is the ideal tool for teams that want to build maintainable, scalable component systems with Tailwind CSS in
production.

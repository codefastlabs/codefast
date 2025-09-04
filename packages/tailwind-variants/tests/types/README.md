# Type Inference Testing with expect-type

This directory contains comprehensive type inference tests for the `@codefast/tailwind-variants` package. The main purpose is to verify that TypeScript correctly **infers** (tự động suy luận) the types for variant fields and default variants, ensuring developers get proper intellisense and autocomplete support.

## Overview

The `expect-type` library allows us to test TypeScript type inference at compile time. These tests simulate **real-world usage scenarios** that developers encounter daily. If these tests fail or show type errors, it means the library needs to be improved to provide better type inference.

**Key Principle**: These tests represent how developers actually use the library in their projects. If TypeScript can't infer the correct types, developers won't get proper autocomplete and type safety.

## Key Concepts

### 1. Type Inference for Variant Fields

When you define a `tv` configuration with variants, TypeScript **automatically infers** the correct types for each field. This means you get autocomplete and type checking without manually defining types. For example:

```typescript
const buttonVariants = tv({
  defaultVariants: {
    size: "default", // Type: "default" | "icon" | "lg" | "sm" | undefined
    variant: "default", // Type: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary" | undefined
  },
  variants: {
    size: {
      default: "h-10 py-2 px-4",
      icon: "h-10 w-10",
      lg: "h-11 px-8 rounded-md",
      sm: "h-9 px-3 rounded-md",
    },
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
  },
});
```

### 2. Testing Type Inference

We use `expect-type` to test that TypeScript **correctly infers** the types without any manual type annotations:

```typescript
import { expectTypeOf } from "expect-type";
import { tv, type VariantProps } from "@/index";

const buttonVariants = tv({
  // ... configuration
});

// Test type inference for the function parameters
type ButtonProps = VariantProps<typeof buttonVariants>;

// Test size field type inference
expectTypeOf<ButtonProps["size"]>().toEqualTypeOf<"default" | "lg" | "sm" | "icon" | undefined>();

// Test variant field type inference
expectTypeOf<ButtonProps["variant"]>().toEqualTypeOf<
  "default" | "destructive" | "ghost" | "link" | "outline" | "secondary" | undefined
>();
```

### 3. Testing Default Variants

We can also test that TypeScript **infers** the correct types for default variants:

```typescript
// Test defaultVariants type inference
type DefaultVariants = NonNullable<Parameters<typeof buttonVariants>[0]>;
expectTypeOf<DefaultVariants["size"]>().toEqualTypeOf<
  "default" | "icon" | "lg" | "sm" | undefined
>();
expectTypeOf<DefaultVariants["variant"]>().toEqualTypeOf<
  "default" | "destructive" | "ghost" | "link" | "outline" | "secondary" | undefined
>();
```

## Test Cases (16 Real-World Scenarios)

### 1. Basic Button Variants

Tests the basic type inference for a button component with `size` and `variant` fields.

**Expected Types:**

- `size`: `"default" | "lg" | "sm" | "icon" | undefined`
- `variant`: `"default" | "destructive" | "ghost" | "link" | "outline" | "secondary" | undefined`

### 2. Card Variants with Slots

Tests type inference for components with slots and slot-specific variants.

**Expected Types:**

- `size`: `"default" | "lg" | "sm" | undefined`
- `variant`: `"default" | "destructive" | "success" | undefined`

### 3. Boolean Variants

Tests type inference for boolean variants (true/false).

**Expected Types:**

- `disabled`: `boolean | undefined`
- `size`: `"default" | "lg" | "sm" | undefined`

### 4. Extended Variants

Tests type inference for components that extend other components.

**Expected Types:**

- `size`: `"default" | "lg" | "sm" | undefined` (merged from base and extension)

### 5. Compound Variants

Tests type inference for components with compound variants.

**Expected Types:**

- `orientation`: `"horizontal" | "vertical" | undefined`
- `variant`: `"default" | "pills" | undefined`

### 6. Compound Slots

Tests type inference for components with compound slots.

**Expected Types:**

- `size`: `"default" | "lg" | "sm" | undefined`
- `variant`: `"default" | "outline" | undefined`

### 7. CreateTV Factory

Tests type inference for components created with the `createTV` factory function.

**Expected Types:**

- `variant`: `"default" | "destructive" | undefined`

### 8. Multi-Level Extends

Tests type inference for components with multiple levels of extension.

**Expected Types:**

- `size`: `"default" | "lg" | undefined`
- `color`: `"primary" | "secondary" | undefined`
- `weight`: `"bold" | "normal" | undefined`

### 9. Nested Variants

Tests type inference for components with nested variant structures.

**Expected Types:**

- `size`: `"default" | "lg" | undefined`
- `theme`: `"dark" | "light" | undefined`

### 10. Base Only Components

Tests type inference for components with only base class (no variants).

**Expected Types:**

- `className`: `string | undefined`

### 11. Default Variants Only

Tests type inference for components with only defaultVariants.

**Expected Types:**

- `size`: `"default" | "lg" | undefined`
- `className`: `string | undefined`

### 12. Number Variants

Tests type inference for components with number-based variants.

**Expected Types:**

- `columns`: `1 | 2 | 3 | 4 | undefined`
- `gap`: `0 | 1 | 2 | 4 | undefined`

### 13. Mixed Variant Types

Tests type inference for components with mixed variant types (string, boolean, etc.).

**Expected Types:**

- `size`: `"sm" | "md" | "lg" | undefined`
- `disabled`: `boolean | undefined`
- `color`: `"primary" | "secondary" | "success" | undefined`

### 14. Conditional Variants

Tests type inference for components with conditional variants and compound variants.

**Expected Types:**

- `intent`: `"primary" | "secondary" | "danger" | undefined`
- `size`: `"small" | "medium" | "large" | undefined`

### 15. Custom ClassName Prop

Tests type inference for components with custom className handling.

**Expected Types:**

- `variant`: `"default" | "primary" | undefined`
- `className`: `string | undefined`

### 16. Deeply Nested Extends

Tests type inference for components with deeply nested extension hierarchy (4 levels).

**Expected Types:**

- `level1`: `"a" | "b" | undefined`
- `level2`: `"x" | "y" | undefined`
- `level3`: `"alpha" | "beta" | undefined`
- `level4`: `"one" | "two" | undefined`

## Running Tests

To run the basic runtime tests:

```bash
pnpm test tests/types/type-inference.test.ts
```

Note: The test files focus on real-world usage scenarios that developers encounter daily.

## Visual Studio Code Integration

When working in VS Code, you can hover over the fields in your `tv` configuration to see the inferred types:

1. **Hover over `defaultVariants.size`**: You'll see the exact type union
2. **Hover over `defaultVariants.variant`**: You'll see the exact type union
3. **Use `VariantProps<typeof yourComponent>`**: To get the inferred prop types

## Example: Hover Behavior

When you hover over the `size` field in `defaultVariants`:

```typescript
defaultVariants: {
  size: "default", // ← Hover here to see: "default" | "icon" | "lg" | "sm" | undefined
  variant: "default", // ← Hover here to see: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary" | undefined
}
```

This provides immediate feedback about what values are valid for each field, making development more efficient and reducing runtime errors.

## Benefits

1. **Compile-time Type Safety**: Catch type errors before runtime
2. **IntelliSense Support**: Get autocomplete and type hints in your IDE
3. **Documentation**: Types serve as living documentation
4. **Refactoring Safety**: TypeScript will catch breaking changes
5. **Developer Experience**: Better IDE support with accurate type information

## Troubleshooting

If type inference is not working as expected:

1. **Check TypeScript Version**: Ensure you're using TypeScript 4.9+ for best type inference
2. **Verify Configuration**: Make sure your `tsconfig.json` has `strict: true`
3. **Import Issues**: Ensure you're importing from the correct path
4. **Generic Constraints**: Check that your generic types are properly constrained

## Related Files

- `type-inference.test.ts`: **Real-world type inference tests** that simulate actual developer usage. These tests verify that TypeScript can correctly infer types for all common scenarios.
- `TYPE_INFERENCE_ISSUES.md`: Documentation of discovered type inference issues and required improvements
- `README.md`: This documentation file

## Test Philosophy (TDD Approach)

These tests follow **Test-Driven Development (TDD)** principles: **"Write tests first, then make the library work with them."**

- Each test represents a real-world usage pattern that developers expect to work
- We use `VariantProps<typeof tvFunction>` to extract parameter types - this is the correct way
- If TypeScript can't infer the correct types, the library needs to be improved
- The tests ensure that developers get proper autocomplete and type safety
- Runtime tests pass, but type inference issues indicate areas for improvement

**Key Insight**: We write tests for how the library _should_ work, not how it currently works. This drives the library's evolution.

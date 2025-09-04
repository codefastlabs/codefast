# Type Inference Issues Discovered

This document lists the type inference issues discovered through our TDD (Test-Driven Development) approach. These issues indicate areas where the `tv` library needs improvement to provide better type inference.

## 🚨 Current Issues

### 1. VariantProps Type Extraction

**Issue**: `VariantProps<typeof tvFunction>` does not correctly extract the parameter types.

**Error Messages**:

```
Property 'size' does not exist on type 'VariantProps<VariantFunction<...>>'
Property 'variant' does not exist on type 'VariantProps<VariantFunction<...>>'
Property 'className' does not exist on type 'VariantProps<VariantFunction<...>>'
```

**Expected Behavior**:

```typescript
const buttonVariants = tv({
  variants: {
    size: { default: "...", lg: "..." },
    variant: { default: "...", destructive: "..." },
  },
});

type ButtonProps = VariantProps<typeof buttonVariants>;
// Should work: ButtonProps["size"] should be "default" | "lg" | undefined
```

### 2. Slot Function Type Inference

**Issue**: `VariantProps<typeof slotFunction>` does not correctly extract slot parameter types.

**Error Messages**:

```
Property 'className' does not exist on type 'VariantProps<SlotFunction<...>>'
```

**Expected Behavior**:

```typescript
const card = cardVariants({ size: "sm" });
type BaseSlotProps = VariantProps<typeof card.base>;
// Should work: BaseSlotProps["className"] should be string | undefined
```

### 3. Return Type Inference

**Issue**: The return type of `tv` function is not correctly inferred for type testing.

**Error Messages**:

```
This expression is not callable.
Type 'ExpectString<...>' has no call signatures.
```

**Expected Behavior**:

```typescript
const result = buttonVariants({ size: "lg" });
expectTypeOf(result).toBeString(); // Should work
```

## 🎯 Test Cases That Should Work

### Basic Button Component

```typescript
const buttonVariants = tv({
  variants: {
    size: { default: "...", lg: "..." },
    variant: { default: "...", destructive: "..." },
  },
});

type ButtonProps = VariantProps<typeof buttonVariants>;
expectTypeOf<ButtonProps["size"]>().toEqualTypeOf<"default" | "lg" | undefined>();
expectTypeOf<ButtonProps["variant"]>().toEqualTypeOf<"default" | "destructive" | undefined>();
```

### Card Component with Slots

```typescript
const cardVariants = tv({
  slots: { base: "...", content: "..." },
  variants: {
    size: { default: {}, lg: { content: "..." } },
  },
});

const card = cardVariants({ size: "lg" });
type CardProps = VariantProps<typeof cardVariants>;
expectTypeOf<CardProps["size"]>().toEqualTypeOf<"default" | "lg" | undefined>();
```

### Boolean Variants

```typescript
const toggleVariants = tv({
  variants: {
    disabled: { true: "...", false: "..." },
  },
});

type ToggleProps = VariantProps<typeof toggleVariants>;
expectTypeOf<ToggleProps["disabled"]>().toEqualTypeOf<boolean | undefined>();
```

### Extended Components

```typescript
const baseVariants = tv({ variants: { size: { default: "..." } } });
const extendedVariants = tv({ extend: baseVariants });

type ExtendedProps = VariantProps<typeof extendedVariants>;
expectTypeOf<ExtendedProps["size"]>().toEqualTypeOf<"default" | undefined>();
```

## 🔧 Required Library Improvements

### 1. Fix VariantProps Type Definition

The `VariantProps` type should correctly extract the parameter types from the `tv` function:

```typescript
// Current (broken)
type VariantProps<T> = T extends (...args: infer P) => any ? P[0] : never;

// Should be (working)
type VariantProps<T> = T extends (...args: [infer P]) => any ? P : never;
```

### 2. Improve Slot Function Type Inference

Slot functions should have proper type inference for their parameters:

```typescript
// Should work
type SlotProps = VariantProps<typeof slotFunction>;
expectTypeOf<SlotProps["className"]>().toEqualTypeOf<string | undefined>();
```

### 3. Fix Return Type Inference

The return type should be properly inferred for type testing:

```typescript
// Should work
const result = tvFunction({ size: "lg" });
expectTypeOf(result).toBeString();
```

## 📊 Impact Assessment

### Developer Experience Impact

- ❌ **No Autocomplete**: Developers can't get proper IntelliSense
- ❌ **No Type Safety**: TypeScript can't catch type errors
- ❌ **Poor DX**: No hover information for valid values

### Library Quality Impact

- ❌ **Incomplete Type System**: Core type inference doesn't work
- ❌ **Reduced Trust**: Library appears broken to TypeScript users
- ❌ **Maintenance Burden**: Harder to refactor safely

## 🚀 Next Steps

1. **Fix VariantProps Implementation**: Update the core type definition
2. **Improve Slot Type Inference**: Ensure slot functions have proper types
3. **Test All Scenarios**: Ensure all test cases pass
4. **Update Documentation**: Reflect the improved type system
5. **Release Update**: Provide better type inference to users

## 📝 Notes

- All runtime tests pass (16/16) ✅
- Type inference tests fail due to library limitations ❌
- **54 TypeScript errors** discovered through comprehensive testing
- This is expected in TDD approach - tests drive library improvement
- The goal is to make the library work with these test cases, not change the tests

## 🚨 Critical Issue: Jest vs TypeScript

**Problem**: Jest tests pass while TypeScript compilation fails with 54 errors.

**Root Cause**:

- Jest only runs runtime tests, not type checking
- `expect-type` tests compile-time types but Jest doesn't fail on type errors
- This creates a false sense of success

**Solution**:

- Use `pnpm test:types` to run both TypeScript check and Jest tests
- This ensures both type inference and runtime behavior are verified
- Script fails if either TypeScript check or Jest tests fail

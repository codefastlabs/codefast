# TypeScript Enhancement Plan for Tailwind Variants

## Overview

This document outlines a comprehensive plan to enhance TypeScript type safety in the `tailwind-variants` package, eliminating all `any` types and providing robust type inference, IntelliSense support, and compile-time type checking.

## Current State Analysis

### Strengths

- ✅ Basic TypeScript support with generic types
- ✅ Function overloads for different configurations
- ✅ Type-safe variant definitions
- ✅ Slot system with type constraints

### Issues Identified

- ❌ Multiple `any` types used throughout the codebase
- ❌ Limited type inference for variant values
- ❌ Missing compile-time validation for compound variants
- ❌ Incomplete IntelliSense support for dynamic variant keys
- ❌ Type assertions (`as any`) used in critical paths

## Enhancement Goals

### 1. Eliminate All `any` Types

- Replace all `any` types with precise generic types
- Implement proper type constraints for all function parameters
- Use conditional types for better type inference

### 2. Enhanced Type Inference

- Automatic inference of variant keys and values
- Type-safe compound variant definitions
- Proper return type inference for slot functions

### 3. IntelliSense Improvements

- Autocomplete for variant keys and values
- Type hints for compound variant combinations
- Real-time validation of variant configurations

### 4. Compile-time Validation

- Validate compound variant definitions against available variants
- Ensure slot names match variant configurations
- Prevent invalid variant combinations

## Implementation Plan

### Phase 1: Core Type System Overhaul

#### 1.1 Enhanced Generic Type Definitions

```typescript
// Current
type ConfigSchema = Record<string, Record<string, ClassProperty>>;

// Enhanced
type VariantValue<T> = T extends Record<string, ClassProperty> ? T : ClassProperty;

type ConfigSchema<T = Record<string, ClassProperty>> = {
  readonly [K in keyof T]: VariantValue<T[K]>;
};

// Type-safe variant key extraction
type VariantKeys<T> = keyof T;

// Type-safe variant value extraction
type VariantValues<T, K extends keyof T> =
  T[K] extends Record<string, ClassProperty> ? keyof T[K] : never;
```

#### 1.2 Improved Variant Props Type

```typescript
// Current
type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | undefined;
};

// Enhanced with better inference
type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: VariantValues<T, Variant> | undefined;
};

// Boolean variant handling
type BooleanVariantValue<T> = T extends "true" | "false" ? boolean : T extends boolean ? T : T;
```

#### 1.3 Type-Safe Compound Variants

```typescript
// Current
type CompoundVariant<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
} & {
  readonly className: ClassProperty;
};

// Enhanced with validation
type ValidCompoundVariant<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: VariantValues<T, Variant>;
} & {
  readonly className: ClassProperty;
};

// Compile-time validation helper
type ValidateCompoundVariant<T extends ConfigSchema, C> =
  C extends ValidCompoundVariant<T> ? C : never;
```

### Phase 2: Function Signature Improvements

#### 2.1 Enhanced TV Function Overloads

```typescript
// Current overloads with any types
function tv<T extends ConfigSchema>(
  config: Config<T>,
  tvConfig?: TVConfig,
): VariantFunction<T, Record<string, never>>;

// Enhanced with precise types
function tv<T extends ConfigSchema, S extends SlotSchema = Record<string, never>>(
  config: ConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;

// Extended configuration with proper merging
function tv<
  TBase extends ConfigSchema,
  TExtension extends ConfigSchema,
  SBase extends SlotSchema,
  SExtension extends SlotSchema,
>(
  config: ExtendedConfig<TBase, TExtension, SBase, SExtension>,
  tvConfig?: TVConfig,
): VariantFunction<MergeSchemas<TBase, TExtension>, MergeSlotSchemas<SBase, SExtension>>;
```

#### 2.2 Type-Safe Return Types

```typescript
// Enhanced return type with conditional logic
type TVReturnType<
  T extends ConfigSchema,
  S extends SlotSchema,
  C extends Config<T> | ConfigWithSlots<T, S>,
> =
  S extends Record<string, ClassProperty>
    ? {
        readonly [K in keyof S]: SlotFunction<T>;
      } & {
        readonly base: SlotFunction<T>;
      }
    : C extends { base: ClassProperty }
      ? SlotFunction<T>
      : SlotFunction<T>;

// Slot function with proper typing
type SlotFunction<T extends ConfigSchema> = (
  props?: {
    readonly className?: ClassProperty;
  } & ConfigVariants<T>,
) => string | undefined;
```

### Phase 3: Configuration Validation

#### 3.1 Compile-time Configuration Validation

```typescript
// Validate variant configurations
type ValidateVariants<T extends ConfigSchema> = {
  readonly [K in keyof T]: T[K] extends Record<string, ClassProperty> ? T[K] : never;
};

// Validate compound variants against available variants
type ValidateCompoundVariants<
  T extends ConfigSchema,
  C extends readonly CompoundVariant<T>[],
> = C extends readonly [infer First, ...infer Rest]
  ? First extends ValidCompoundVariant<T>
    ? Rest extends readonly CompoundVariant<T>[]
      ? ValidateCompoundVariants<T, Rest>
      : never
    : never
  : C;

// Validate slot configurations
type ValidateSlots<S extends SlotSchema, T extends ConfigSchema> = {
  readonly [K in keyof S]: S[K] extends ClassProperty ? S[K] : never;
};
```

#### 3.2 Enhanced Configuration Interfaces

```typescript
// Base configuration with validation
interface ValidatedConfig<T extends ConfigSchema> {
  readonly base?: ClassProperty;
  readonly compoundVariants?: ValidateCompoundVariants<T, readonly CompoundVariant<T>[]>;
  readonly defaultVariants?: Partial<ConfigVariants<T>>;
  readonly variants?: ValidateVariants<T>;
}

// Configuration with slots and validation
interface ValidatedConfigWithSlots<T extends ConfigSchema, S extends SlotSchema>
  extends ValidatedConfig<T> {
  readonly compoundSlots?: readonly CompoundSlot<T, S>[];
  readonly slots?: ValidateSlots<S, T>;
}
```

### Phase 4: Advanced Type Features

#### 4.1 Template Literal Types for Dynamic Keys

```typescript
// Dynamic variant key generation
type VariantKey<T extends string> = T extends `${infer Prefix}${infer Suffix}`
  ? `${Capitalize<Prefix>}${Suffix}`
  : T;

// Conditional variant types
type ConditionalVariant<T, Condition> = Condition extends true ? T : never;

// Branded types for variant keys
type BrandedVariantKey<T extends string> = T & { readonly __brand: "variant-key" };
```

#### 4.2 Utility Types for Type Manipulation

```typescript
// Extract variant keys from configuration
type ExtractVariantKeys<T> = T extends { variants: infer V }
  ? V extends ConfigSchema
    ? keyof V
    : never
  : never;

// Extract slot keys from configuration
type ExtractSlotKeys<T> = T extends { slots: infer S }
  ? S extends SlotSchema
    ? keyof S
    : never
  : never;

// Merge configurations with type safety
type MergeConfigs<T1 extends ConfigSchema, T2 extends ConfigSchema> = {
  readonly [K in keyof T1 | keyof T2]: K extends keyof T1
    ? K extends keyof T2
      ? T1[K] & T2[K]
      : T1[K]
    : T2[K];
};
```

### Phase 5: IntelliSense Enhancements

#### 5.1 JSDoc Documentation

````typescript
/**
 * Creates a type-safe variant function with full IntelliSense support
 * @template T - The variant configuration schema
 * @template S - The slot configuration schema
 * @param config - The variant configuration with validation
 * @param tvConfig - Optional TV configuration
 * @returns A type-safe variant function with proper return types
 *
 * @example
 * ```typescript
 * const button = tv({
 *   variants: {
 *     size: { sm: "h-8", md: "h-10", lg: "h-12" },
 *     variant: { primary: "bg-blue-500", secondary: "bg-gray-500" }
 *   }
 * });
 *
 * // TypeScript will provide autocomplete for size and variant values
 * const className = button({ size: "md", variant: "primary" });
 * ```
 */
function tv<T extends ConfigSchema, S extends SlotSchema = Record<string, never>>(
  config: ValidatedConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;
````

#### 5.2 Type Guards and Predicates

```typescript
// Type guard for variant configurations
function isValidVariantConfig<T>(config: unknown): config is ConfigSchema<T> {
  return (
    typeof config === "object" &&
    config !== null &&
    Object.values(config).every((value) => typeof value === "object" && value !== null)
  );
}

// Type predicate for slot configurations
function isValidSlotConfig<T>(config: unknown): config is SlotSchema<T> {
  return (
    typeof config === "object" &&
    config !== null &&
    Object.values(config).every((value) => typeof value === "string" || Array.isArray(value))
  );
}
```

## Implementation Steps

### Step 1: Remove `any` Types (Week 1-2)

1. **Identify all `any` usages** in the codebase
2. **Replace with precise types** using the enhanced type system
3. **Update function signatures** to use proper generics
4. **Test type safety** with existing test cases

### Step 2: Enhance Type Inference (Week 3-4)

1. **Implement enhanced generic types** for better inference
2. **Add conditional types** for dynamic behavior
3. **Update return types** to be more precise
4. **Add type validation** for configurations

### Step 3: Improve IntelliSense (Week 5-6)

1. **Add comprehensive JSDoc** documentation
2. **Implement type guards** for runtime validation
3. **Add utility types** for common operations
4. **Test IntelliSense** in development environment

### Step 4: Configuration Validation (Week 7-8)

1. **Implement compile-time validation** for compound variants
2. **Add slot validation** against variant configurations
3. **Create validation utilities** for common patterns
4. **Update test suite** to include type validation tests

### Step 5: Advanced Features (Week 9-10)

1. **Implement template literal types** for dynamic keys
2. **Add branded types** for variant keys
3. **Create advanced utility types** for type manipulation
4. **Add performance optimizations** for type checking

## Testing Strategy

### Type Safety Tests

```typescript
// Test that invalid configurations are caught at compile time
const invalidConfig = tv({
  variants: {
    size: {
      // @ts-expect-error - Invalid variant value
      invalid: 123,
    },
  },
});

// Test that compound variants are validated
const invalidCompound = tv({
  variants: {
    size: { sm: "h-8", md: "h-10" },
  },
  compoundVariants: [
    {
      // @ts-expect-error - Invalid variant key
      invalidKey: "value",
      className: "bg-red-500",
    },
  ],
});
```

### IntelliSense Tests

```typescript
// Test autocomplete for variant keys
const button = tv({
  variants: {
    size: { sm: "h-8", md: "h-10", lg: "h-12" },
    variant: { primary: "bg-blue-500", secondary: "bg-gray-500" },
  },
});

// TypeScript should provide autocomplete for these keys
const className = button({
  size: "md", // Should autocomplete: "sm" | "md" | "lg"
  variant: "primary", // Should autocomplete: "primary" | "secondary"
});
```

### Performance Tests

```typescript
// Test type checking performance with large configurations
const largeConfig = tv({
  variants: {
    // 100+ variant keys
    size: {
      /* 50+ values */
    },
    color: {
      /* 50+ values */
    },
    // ... more variants
  },
});

// Should not cause performance issues during type checking
```

## Success Metrics

### Type Safety

- ✅ Zero `any` types in the codebase
- ✅ 100% compile-time validation of configurations
- ✅ No type assertions (`as any`) in critical paths
- ✅ Proper type inference for all function calls

### IntelliSense

- ✅ Autocomplete for all variant keys and values
- ✅ Real-time validation of variant combinations
- ✅ Proper return type inference for slot functions
- ✅ Comprehensive JSDoc documentation

### Developer Experience

- ✅ Clear error messages for invalid configurations
- ✅ Intuitive type definitions
- ✅ Consistent API design
- ✅ Excellent IDE support

## Risk Mitigation

### Breaking Changes

- **Gradual migration**: Implement changes incrementally
- **Backward compatibility**: Maintain existing API surface
- **Migration guide**: Provide clear upgrade instructions
- **Deprecation warnings**: Warn about deprecated patterns

### Performance Impact

- **Type checking performance**: Monitor compilation times
- **Bundle size**: Ensure no significant increase in bundle size
- **Runtime performance**: Maintain existing runtime performance
- **Memory usage**: Optimize type definitions for memory efficiency

### Complexity Management

- **Documentation**: Comprehensive documentation for all new types
- **Examples**: Provide clear examples for common use cases
- **Testing**: Extensive testing of type safety features
- **Code reviews**: Thorough review of type system changes

## Conclusion

This enhancement plan will transform the `tailwind-variants` package into a fully type-safe, IntelliSense-enabled library that provides excellent developer experience while maintaining backward compatibility and performance. The implementation will be done incrementally to minimize risk and ensure quality at each step.

# Immediate Action Plan: TypeScript Enhancement

## Priority 1: Critical `any` Type Removal (Week 1)

### Target: Line 546 and surrounding code in `src/index.ts`

#### Current Issues Identified:

1. `const configAny = config as any;` - Line ~540
2. `const { compoundSlots, extend } = configAny;` - Line ~541
3. `mergedConfig = extend ? mergeConfigs(extend.config, config as any) : (config as any);` - Line ~550
4. `const tvFunction = (props: any = {}) => {` - Line ~560
5. `const slotFunctions: Record<string, any> = {};` - Line ~580
6. `slotFunctions.base = (slotProps: any = {}) => {` - Line ~585

#### Immediate Fixes:

##### 1. Replace `configAny` with proper typing

```typescript
// ❌ Current
const configAny = config as any;
const { compoundSlots, extend } = configAny;

// ✅ Enhanced
const { compoundSlots, extend } = config as ConfigWithSlots<T, S>;
```

##### 2. Fix mergeConfigs call

```typescript
// ❌ Current
mergedConfig = extend ? mergeConfigs(extend.config, config as any) : (config as any);

// ✅ Enhanced
if (extend) {
  mergedConfig = mergeConfigs(
    extend.config,
    config as ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
  );
} else {
  mergedConfig = config as Config<T> | ConfigWithSlots<T, S>;
}
```

##### 3. Fix function parameter typing

```typescript
// ❌ Current
const tvFunction = (props: any = {}) => {

// ✅ Enhanced
const tvFunction = (props: ConfigVariants<T> & { className?: ClassProperty } = {}) => {
```

##### 4. Fix slot functions typing

```typescript
// ❌ Current
const slotFunctions: Record<string, any> = {};
slotFunctions.base = (slotProps: any = {}) => {

// ✅ Enhanced
const slotFunctions: Record<string, SlotFunction<T>> = {};
slotFunctions.base = (slotProps: { className?: ClassProperty } = {}) => {
```

## Priority 2: Enhanced Type Definitions (Week 1-2)

### Target: Core type definitions in `src/index.ts`

#### 1. Update ConfigSchema type

```typescript
// ❌ Current
type ConfigSchema = Record<string, Record<string, ClassProperty>>;

// ✅ Enhanced
type ConfigSchema<T = Record<string, ClassProperty>> = {
  readonly [K in keyof T]: T[K] extends Record<string, ClassProperty> ? T[K] : ClassProperty;
};
```

#### 2. Update ConfigVariants type

```typescript
// ❌ Current
type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | undefined;
};

// ✅ Enhanced
type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: T[Variant] extends Record<string, ClassProperty>
    ? keyof T[Variant]
    : T[Variant];
};
```

#### 3. Update CompoundVariant type

```typescript
// ❌ Current
type CompoundVariant<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
} & {
  readonly className: ClassProperty;
};

// ✅ Enhanced
type CompoundVariant<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: T[Variant] extends Record<string, ClassProperty>
    ? keyof T[Variant]
    : T[Variant];
} & {
  readonly className: ClassProperty;
};
```

## Priority 3: Function Overload Improvements (Week 2)

### Target: TV function overloads

#### Current Overloads:

```typescript
// ❌ Current - uses any types
function tv<T extends ConfigSchema>(
  config: Config<T>,
  tvConfig?: TVConfig,
): VariantFunction<T, Record<string, never>>;

function tv<T extends ConfigSchema, S extends SlotSchema>(
  config: ConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;
```

#### Enhanced Overloads:

```typescript
// ✅ Enhanced - eliminates any types
function tv<T extends ConfigSchema, S extends SlotSchema = Record<string, never>>(
  config: ConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;

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

## Priority 4: Slot Resolution Enhancement (Week 2-3)

### Target: `resolveSlotClasses` function

#### Current Issues:

- Uses type assertions (`as any`)
- Limited type safety for variant access
- No validation for slot keys

#### Enhanced Implementation:

```typescript
// ✅ Enhanced slot resolution with proper typing
const resolveSlotClasses = <T extends ConfigSchema, S extends SlotSchema>(
  slotKey: keyof S,
  baseSlotClasses: ClassProperty,
  variants: T | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
  compoundVariants: readonly CompoundVariantWithSlots<T, S>[] | undefined,
  compoundSlotClasses: ClassProperty[],
): ClassProperty[] => {
  const classes: ClassProperty[] = [baseSlotClasses];

  // Apply variant classes with type safety
  if (variants) {
    for (const variantKey of Object.keys(variants) as (keyof T)[]) {
      const variantGroup = variants[variantKey];
      const variantValue = variantProps[variantKey];

      // Get the value to use with proper typing
      let valueToUse: string | undefined;

      if (variantValue !== undefined) {
        valueToUse = String(variantValue);
      } else if (defaultVariants[variantKey] !== undefined) {
        valueToUse = String(defaultVariants[variantKey]);
      } else if (typeof variantGroup === "object" && "false" in variantGroup) {
        valueToUse = "false";
      }

      if (
        valueToUse !== undefined &&
        typeof variantGroup === "object" &&
        valueToUse in variantGroup
      ) {
        const variantConfig = variantGroup[valueToUse as keyof typeof variantGroup];

        if (variantConfig) {
          if (
            typeof variantConfig === "object" &&
            !Array.isArray(variantConfig) &&
            variantConfig !== null
          ) {
            // Handle slot-specific variant with type safety
            const slotVariant = (variantConfig as Record<string, ClassProperty>)[slotKey as string];

            if (slotVariant !== undefined) {
              classes.push(slotVariant);
            }
          } else if (slotKey === "base") {
            // For base slot, apply non-object variants
            classes.push(variantConfig);
          }
        }
      }
    }
  }

  // Apply compound variants with type safety
  if (compoundVariants) {
    const resolvedProps = { ...defaultVariants, ...variantProps };

    for (const compound of compoundVariants) {
      const matches = Object.entries(compound).every(([key, value]) => {
        if (key === "className") return true;

        const propertyValue = resolvedProps[key as keyof T];
        return propertyValue === value;
      });

      if (matches) {
        const className = compound.className;

        if (typeof className === "object" && className !== null && !Array.isArray(className)) {
          // Slot-specific compound variant with type safety
          const slotClass = (className as Record<string, ClassProperty>)[slotKey as string];

          if (slotClass !== undefined) {
            classes.push(slotClass);
          }
        } else if (slotKey === "base") {
          // Base compound variant
          classes.push(className);
        }
      }
    }
  }

  // Add compound slot classes
  classes.push(...compoundSlotClasses);

  return classes;
};
```

## Priority 5: Testing Implementation (Week 3)

### Create Type Safety Tests

#### File: `tests/unit/types.test.ts`

```typescript
import { tv } from "@/index";

describe("TypeScript Type Safety", () => {
  test("should provide proper type inference for variant keys", () => {
    const button = tv({
      variants: {
        size: { sm: "h-8", md: "h-10", lg: "h-12" },
        variant: { primary: "bg-blue-500", secondary: "bg-gray-500" },
      },
    });

    // TypeScript should infer these types correctly
    const result = button({
      size: "md", // Should autocomplete: "sm" | "md" | "lg"
      variant: "primary", // Should autocomplete: "primary" | "secondary"
    });

    expect(typeof result).toBe("string");
  });

  test("should catch invalid variant values at compile time", () => {
    const button = tv({
      variants: {
        size: { sm: "h-8", md: "h-10" },
      },
    });

    // This should cause a TypeScript error
    // @ts-expect-error - Invalid variant value
    const result = button({ size: "invalid" });
  });

  test("should provide proper typing for slot functions", () => {
    const card = tv({
      slots: {
        base: "rounded-lg border",
        header: "p-4",
        content: "p-4 pt-0",
      },
      variants: {
        size: {
          sm: { header: "p-2", content: "p-2 pt-0" },
          lg: { header: "p-6", content: "p-6 pt-0" },
        },
      },
    });

    const { base, header, content } = card({ size: "lg" });

    // These should be functions with proper typing
    expect(typeof base).toBe("function");
    expect(typeof header).toBe("function");
    expect(typeof content).toBe("function");

    const baseResult = base();
    const headerResult = header();
    const contentResult = content();

    expect(typeof baseResult).toBe("string");
    expect(typeof headerResult).toBe("string");
    expect(typeof contentResult).toBe("string");
  });
});
```

## Priority 6: Documentation Updates (Week 3-4)

### Update JSDoc Comments

#### Enhanced TV Function Documentation:

````typescript
/**
 * Creates a type-safe variant function with full IntelliSense support
 *
 * @template T - The variant configuration schema
 * @template S - The slot configuration schema (defaults to empty object)
 * @param config - The variant configuration with validation
 * @param tvConfig - Optional TV configuration for tailwind-merge settings
 * @returns A type-safe variant function with proper return types
 *
 * @example
 * ```typescript
 * const button = tv({
 *   base: "px-4 py-2 rounded",
 *   variants: {
 *     size: { sm: "h-8", md: "h-10", lg: "h-12" },
 *     variant: { primary: "bg-blue-500", secondary: "bg-gray-500" }
 *   },
 *   defaultVariants: {
 *     size: "md",
 *     variant: "primary"
 *   }
 * });
 *
 * // TypeScript will provide autocomplete for size and variant values
 * const className = button({ size: "lg", variant: "secondary" });
 * ```
 */
function tv<T extends ConfigSchema, S extends SlotSchema = Record<string, never>>(
  config: ConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;
````

## Implementation Checklist

### Week 1:

- [ ] Replace `configAny` with proper typing (Line 540-541)
- [ ] Fix mergeConfigs call (Line 550)
- [ ] Fix function parameter typing (Line 560)
- [ ] Fix slot functions typing (Line 580-585)
- [ ] Update ConfigSchema type definition
- [ ] Update ConfigVariants type definition
- [ ] Update CompoundVariant type definition

### Week 2:

- [ ] Enhance TV function overloads
- [ ] Update SlotFunction type definition
- [ ] Enhance resolveSlotClasses function
- [ ] Add type guards for validation
- [ ] Create type safety tests

### Week 3:

- [ ] Complete type safety tests
- [ ] Add IntelliSense tests
- [ ] Update JSDoc documentation
- [ ] Test with existing test suite
- [ ] Performance testing

### Week 4:

- [ ] Final testing and validation
- [ ] Documentation updates
- [ ] Performance optimization
- [ ] Release preparation

## Success Criteria

### Type Safety:

- [ ] Zero `any` types in critical functions
- [ ] Proper type inference for all variant keys and values
- [ ] Compile-time validation of compound variants
- [ ] Type-safe slot function returns

### IntelliSense:

- [ ] Autocomplete for variant keys
- [ ] Autocomplete for variant values
- [ ] Proper return type inference
- [ ] Real-time validation feedback

### Performance:

- [ ] No significant increase in compilation time
- [ ] Maintained runtime performance
- [ ] Optimized type checking
- [ ] Efficient memory usage

## Risk Mitigation

### Breaking Changes:

- [ ] Maintain backward compatibility
- [ ] Gradual migration approach
- [ ] Clear migration documentation
- [ ] Deprecation warnings

### Performance Impact:

- [ ] Monitor compilation times
- [ ] Test with large configurations
- [ ] Optimize type definitions
- [ ] Profile memory usage

### Quality Assurance:

- [ ] Comprehensive testing
- [ ] Code review process
- [ ] Documentation updates
- [ ] User feedback collection

## Next Steps

1. **Start with Priority 1** - Remove critical `any` types
2. **Test incrementally** - Verify each change with existing tests
3. **Monitor performance** - Track compilation and runtime performance
4. **Gather feedback** - Collect user feedback on IntelliSense improvements
5. **Iterate** - Refine based on testing and feedback

This immediate action plan provides a clear roadmap for enhancing TypeScript type safety in the `tailwind-variants` package while maintaining backward compatibility and performance.

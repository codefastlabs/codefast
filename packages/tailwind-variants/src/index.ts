import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

// =============================================================================
// Core Utility Types
// =============================================================================

/**
 * Converts string "true"/"false" to boolean, leaves other types unchanged
 * Enhanced to handle actual booleans and provide better type inference
 */
type StringToBoolean<T> = T extends "false" | "true" ? boolean : T extends boolean ? T : T;

/**
 * Utility to normalize inferred never types to an empty object
 */
type IfNever<T, Then, Else> = [T] extends [never] ? Then : Else;

/**
 * Helper types to determine if a variant key accepts boolean values
 */
type IsBooleanVariant<T extends Record<string, unknown>> = "true" extends keyof T
  ? true
  : "false" extends keyof T
    ? true
    : false;

/**
 * Enhanced VariantProps with better type inference and boolean handling
 * Provides strict typing for variant component props extraction
 * Uses overloaded types to handle different function signatures precisely
 */
type VariantProps<Component, OmitKeys extends string = never> = Component extends (
  props?: infer P,
) => unknown
  ? P extends ConfigVariants<infer T>
    ? Omit<ConfigVariants<IfNever<T, Record<string, never>, T>>, OmitKeys> & {
        readonly className: ClassValue;
      }
    : P extends Record<string, unknown>
      ? Omit<P & { className?: ClassValue }, OmitKeys> & { readonly className: ClassValue }
      : { readonly className: ClassValue }
  : Component extends VariantFunction<infer T>
    ? Omit<ConfigVariants<IfNever<T, Record<string, never>, T>>, OmitKeys> & {
        readonly className: ClassValue;
      }
    : never;

// =============================================================================
// Schema Types
// =============================================================================

/**
 * Base configuration schema for variants
 */
type ConfigSchema = Record<string, Record<string, ClassValue>>;

/**
 * Base slot schema
 */
type SlotSchema = Record<string, ClassValue>;

/**
 * Enhanced ConfigVariants with better boolean handling and strict typing
 */
type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
} & {
  readonly className?: ClassValue;
};

/**
 * Extract slot properties with type safety
 */
type SlotProps<S extends SlotSchema> = {
  readonly [Slot in keyof S]?: ClassValue;
};

// =============================================================================
// Compound Variants Types
// =============================================================================

/**
 * Enhanced compound variant with strict type checking and boolean support
 */
type CompoundVariant<T extends ConfigSchema> = Partial<{
  readonly [Variant in keyof T]: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
}> & {
  readonly className: ClassValue;
};

/**
 * Enhanced compound variant with slots and strict type checking
 */
type CompoundVariantWithSlots<T extends ConfigSchema, S extends SlotSchema> = Partial<{
  readonly [Variant in keyof T]: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
}> & {
  readonly className: ClassValue | SlotProps<S>;
};

/**
 * Enhanced compound slots with strict type checking
 */
type CompoundSlot<T extends ConfigSchema, S extends SlotSchema> =
  T extends Record<string, never>
    ? {
        readonly slots: readonly (keyof S)[];
        readonly className: ClassValue;
      }
    : {
        readonly slots: readonly (keyof S)[];
        readonly className: ClassValue;
      } & {
        readonly [K in keyof T]?: IsBooleanVariant<T[K]> extends true
          ? boolean | StringToBoolean<keyof T[K]>
          : StringToBoolean<keyof T[K]>;
      };

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Configuration without slots - type-safe variant definition
 */
interface Config<T extends ConfigSchema> {
  readonly base?: ClassValue;
  readonly compoundVariants?: readonly CompoundVariant<T>[];
  readonly defaultVariants?: ConfigVariants<T>;
  readonly variants?: T;
}

/**
 * Configuration with slots - extended type-safe definition
 */
interface ConfigWithSlots<T extends ConfigSchema, S extends SlotSchema> {
  readonly base?: ClassValue;
  readonly compoundSlots?: readonly CompoundSlot<T, S>[];
  readonly compoundVariants?: readonly CompoundVariantWithSlots<T, S>[];
  readonly defaultVariants?: ConfigVariants<T>;
  readonly slots?: S;
  readonly variants?: T;
}

/**
 * TV configuration options
 */
interface TVConfig {
  readonly twMerge?: boolean;
  readonly twMergeConfig?: ConfigExtension<string, string>;
}

// =============================================================================
// Return Types
// =============================================================================

/**
 * Enhanced slot function with strict typing and optional props
 */
type SlotFunction<T extends ConfigSchema> = (props?: ConfigVariants<T>) => string | undefined;

/**
 * Utility type to ensure proper prop passing to slot functions
 */
type SlotFunctionProps<T extends ConfigSchema> = {
  readonly [K in keyof ConfigVariants<T>]?: ConfigVariants<T>[K];
} & {
  readonly className?: ClassValue;
};

/**
 * Enhanced TVReturnType with better conditional typing and slot handling
 */
type TVReturnType<T extends ConfigSchema, S extends SlotSchema> =
  // Check if we have slots (non-empty slot schema)
  keyof S extends never
    ? SlotFunction<T> // No slots - return single function
    : {
        readonly [K in keyof S]: SlotFunction<T>;
      } & {
        readonly base: SlotFunction<T>;
      };

// =============================================================================
// Variant Function Interface
// =============================================================================

/**
 * Enhanced VariantFunction with stricter typing and better inference
 */
interface VariantFunction<T extends ConfigSchema, S extends SlotSchema = SlotSchema> {
  config: Config<T> | ConfigWithSlots<T, S>;

  // Function can be called with or without parameters
  (
    props?: ConfigVariants<T>,
  ): S extends Record<string, never> ? string | undefined : TVReturnType<T, S>;
}

// =============================================================================
// Extended Configuration Types
// =============================================================================

/**
 * Merge two schemas recursively with type safety
 */
type MergeSchemas<TBase extends ConfigSchema, TExtension extends ConfigSchema> = TBase & TExtension;

/**
 * Merge slot schemas with type safety
 */
type MergeSlotSchemas<SBase extends SlotSchema, SExtension extends SlotSchema> = SBase & SExtension;

/**
 * Extended configuration for inheritance with proper type merging
 */
interface ExtendedConfig<
  TBase extends ConfigSchema,
  TExtension extends ConfigSchema,
  SBase extends SlotSchema,
  SExtension extends SlotSchema,
> {
  readonly base?: ClassValue;
  readonly compoundSlots?: readonly CompoundSlot<
    MergeSchemas<TBase, TExtension>,
    MergeSlotSchemas<SBase, SExtension>
  >[];
  readonly compoundVariants?: readonly CompoundVariantWithSlots<
    MergeSchemas<TBase, TExtension>,
    MergeSlotSchemas<SBase, SExtension>
  >[];
  readonly defaultVariants?: ConfigVariants<MergeSchemas<TBase, TExtension>>;
  readonly extend?: VariantFunction<TBase, SBase>;
  readonly slots?: SExtension;
  readonly variants?: TExtension;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Optimized class concatenation using clsx
 */
const cx = (...classes: ClassValue[]): string => {
  return clsx(classes);
};

/**
 * Creates a tailwind merge function with optional configuration
 */
const createTailwindMerge = (
  config?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  return config ? extendTailwindMerge(config) : twMerge;
};

/**
 * Enhanced type guard for slot-specific objects with better type inference
 */
const isSlotObject = (value: ClassValue): value is Record<string, ClassValue> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  );
};

/**
 * Type guard to check if a variant value is a boolean variant
 */
const isBooleanVariant = <T extends Record<string, unknown>>(
  variantGroup: T,
): variantGroup is T & (Record<"false", unknown> | Record<"true", unknown>) => {
  return "true" in variantGroup || "false" in variantGroup;
};

/**
 * Enhanced type guard for boolean values with proper type narrowing
 */
const isBooleanValue = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

/**
 * Type guard to check if a config has slots
 */
const hasSlots = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S>,
): config is ConfigWithSlots<T, S> => {
  return "slots" in config && config.slots !== undefined;
};

/**
 * Type guard to check if a config has extend
 */
const hasExtend = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
): config is ExtendedConfig<ConfigSchema, T, SlotSchema, S> => {
  return "extend" in config && config.extend !== undefined;
};

// =============================================================================
// Compound Variants Logic
// =============================================================================

/**
 * Applies compound variants based on resolved props
 * Optimized with early returns, cached resolved props, and for...of loops
 */
const applyCompoundVariants = <T extends ConfigSchema>(
  compoundVariants: readonly CompoundVariant<T>[],
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): ClassValue[] => {
  const resolvedProps = { ...defaultVariants, ...variantProps };
  const result: ClassValue[] = [];

  for (const compound of compoundVariants) {
    let matches = true;

    // Cache compound keys to avoid repeated Object.entries calls
    const compoundKeys = Object.keys(compound) as (keyof typeof compound)[];

    for (const key of compoundKeys) {
      if (key === "className") {
        continue;
      }

      const propertyValue = resolvedProps[key];
      const compoundValue = compound[key];

      // Enhanced boolean variant handling with proper type checking
      if (isBooleanValue(compoundValue)) {
        const resolvedPropertyValue = propertyValue === undefined ? false : propertyValue;

        if (resolvedPropertyValue !== compoundValue) {
          matches = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        matches = false;
        break;
      }
    }

    if (matches) {
      result.push(compound.className);
    }
  }

  return result;
};

/**
 * Applies compound slots based on resolved props
 * Optimized with early returns, cached resolved props, and for...of loops
 */
const applyCompoundSlots = <T extends ConfigSchema, S extends SlotSchema>(
  compoundSlots: readonly CompoundSlot<T, S>[] | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): Record<keyof S, ClassValue[]> => {
  if (!compoundSlots?.length) {
    return {} as Record<keyof S, ClassValue[]>;
  }

  const resolvedProps = { ...defaultVariants, ...variantProps };
  const result = {} as Record<keyof S, ClassValue[]>;

  for (const compound of compoundSlots) {
    let matches = true;

    // Get all variant keys from compound, excluding special keys
    const compoundEntries = Object.entries(compound).filter(
      ([key]) => key !== "className" && key !== "slots",
    ) as [keyof T, T[keyof T][keyof T[keyof T]]][];

    for (const [key, compoundValue] of compoundEntries) {
      const propertyValue = resolvedProps[key];

      // Enhanced boolean variant handling with proper type checking
      if (isBooleanValue(compoundValue)) {
        const resolvedPropertyValue = propertyValue === undefined ? false : propertyValue;

        if (resolvedPropertyValue !== compoundValue) {
          matches = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        matches = false;
        break;
      }
    }

    if (matches) {
      for (const slot of compound.slots) {
        if (!result[slot]) {
          result[slot] = [];
        }

        result[slot].push(compound.className);
      }
    }
  }

  return result;
};

// =============================================================================
// Slot Resolution Logic
// =============================================================================

/**
 * Resolves classes for a specific slot with optimized variant processing
 * Uses cached resolved props and for...of loops for better performance
 */
const resolveSlotClasses = <T extends ConfigSchema, S extends SlotSchema>(
  slotKey: keyof S,
  baseSlotClasses: ClassValue,
  variants: T | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
  compoundVariants: readonly CompoundVariantWithSlots<T, S>[] | undefined,
  compoundSlotClasses: ClassValue[],
): ClassValue[] => {
  const classes: ClassValue[] = [baseSlotClasses];
  const resolvedProps = { ...defaultVariants, ...variantProps };

  // Apply variant classes with optimized iteration
  if (variants) {
    const variantKeys = Object.keys(variants) as (keyof T)[];

    for (const variantKey of variantKeys) {
      const variantGroup = variants[variantKey];
      const variantValue = resolvedProps[variantKey];

      // Enhanced value resolution with proper boolean handling
      let valueToUse: string | undefined;

      if (variantValue !== undefined) {
        valueToUse = isBooleanValue(variantValue) ? String(variantValue) : String(variantValue);
      } else if (defaultVariants[variantKey] !== undefined) {
        const defaultValue = defaultVariants[variantKey];

        valueToUse = isBooleanValue(defaultValue) ? String(defaultValue) : String(defaultValue);
      } else if (isBooleanVariant(variantGroup)) {
        // For boolean variants without explicit value, default to false
        valueToUse = "false";
      }

      if (valueToUse && valueToUse in variantGroup) {
        const variantConfig = variantGroup[valueToUse];

        if (variantConfig) {
          if (isSlotObject(variantConfig)) {
            // Handle slot-specific variant
            const slotVariant = variantConfig[slotKey as string];

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

  // Apply compound variants with optimized matching
  if (compoundVariants?.length) {
    for (const compound of compoundVariants) {
      let matches = true;

      // Cache compound keys to avoid repeated Object.entries calls
      const compoundKeys = Object.keys(compound) as (keyof typeof compound)[];

      for (const key of compoundKeys) {
        if (key === "className") {
          continue;
        }

        if (resolvedProps[key] !== compound[key]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const className = compound.className;

        if (isSlotObject(className)) {
          // Slot-specific compound variant
          const slotClass = className[slotKey as string];

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

// =============================================================================
// Configuration Merging
// =============================================================================

/**
 * Deep merges variant groups with optimized object handling
 * Uses for...of loops and cached keys for better performance
 */
const mergeVariantGroups = (
  baseGroup: Record<string, ClassValue>,
  extensionGroup: Record<string, ClassValue>,
): Record<string, ClassValue> => {
  const mergedGroup = { ...baseGroup };
  const extensionKeys = Object.keys(extensionGroup);

  for (const variantValue of extensionKeys) {
    const extensionValue = extensionGroup[variantValue];
    const baseValue = mergedGroup[variantValue];

    if (baseValue === undefined) {
      // New variant value
      mergedGroup[variantValue] = extensionValue;
    } else {
      // Merge individual variant value
      if (isSlotObject(baseValue) && isSlotObject(extensionValue)) {
        // Both are slot-specific objects, merge them
        mergedGroup[variantValue] = {
          ...baseValue,
          ...extensionValue,
        };
      } else {
        // One or both are primitive, extension overrides
        mergedGroup[variantValue] = extensionValue;
      }
    }
  }

  return mergedGroup;
};

/**
 * Merges configurations with optimized deep merging and reduced object allocations
 */
const mergeConfigs = (
  baseConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
  extensionConfig:
    | Config<ConfigSchema>
    | ConfigWithSlots<ConfigSchema, SlotSchema>
    | ExtendedConfig<ConfigSchema, ConfigSchema, SlotSchema, SlotSchema>,
): Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> => {
  // Recursively merge if base has extend
  const resolvedBase =
    hasExtend(baseConfig) && baseConfig.extend
      ? mergeConfigs(baseConfig.extend.config, baseConfig)
      : baseConfig;

  // Merge base classes efficiently
  const mergedBase = extensionConfig.base
    ? resolvedBase.base
      ? cx(resolvedBase.base, extensionConfig.base)
      : extensionConfig.base
    : resolvedBase.base;

  // Deep merge variants with optimized iteration
  const mergedVariants = { ...resolvedBase.variants } as ConfigSchema;

  if (extensionConfig.variants) {
    const extensionVariantKeys = Object.keys(extensionConfig.variants);

    for (const variantKey of extensionVariantKeys) {
      const extensionVariantGroup = extensionConfig.variants[variantKey];

      if (variantKey in mergedVariants) {
        // Deep merge variant values
        mergedVariants[variantKey] = mergeVariantGroups(
          mergedVariants[variantKey],
          extensionVariantGroup,
        );
      } else {
        // New variant key
        mergedVariants[variantKey] = extensionVariantGroup;
      }
    }
  }

  // Merge slots efficiently
  const resolvedSlots = hasSlots(resolvedBase) ? resolvedBase.slots : {};
  const extensionSlots = hasSlots(extensionConfig) ? extensionConfig.slots : {};
  const mergedSlots = { ...resolvedSlots, ...extensionSlots };

  const hasSlotsResult = Object.keys(mergedSlots).length > 0;

  if (hasSlotsResult) {
    return {
      base: mergedBase,
      compoundSlots: [
        ...(hasSlots(resolvedBase) && Array.isArray(resolvedBase.compoundSlots)
          ? resolvedBase.compoundSlots
          : []),
        ...(hasSlots(extensionConfig) && Array.isArray(extensionConfig.compoundSlots)
          ? extensionConfig.compoundSlots
          : []),
      ],
      compoundVariants: [
        ...(resolvedBase.compoundVariants ?? []),
        ...(extensionConfig.compoundVariants ?? []),
      ],
      defaultVariants: { ...resolvedBase.defaultVariants, ...extensionConfig.defaultVariants },
      slots: mergedSlots,
      variants: mergedVariants,
    };
  }

  return {
    base: mergedBase,
    compoundVariants: [
      ...(resolvedBase.compoundVariants ?? []),
      ...(extensionConfig.compoundVariants ?? []),
    ],
    defaultVariants: { ...resolvedBase.defaultVariants, ...extensionConfig.defaultVariants },
    variants: mergedVariants,
  };
};

// =============================================================================
// Helper Functions for TV
// =============================================================================

/**
 * Creates slot functions with precise typing
 */
const createSlotFunctions = <T extends ConfigSchema, S extends SlotSchema>(
  mergedSlots: S,
  mergedBase: ClassValue | undefined,
  mergedVariants: T,
  mergedDefaultVariants: ConfigVariants<T>,
  mergedCompoundVariants: readonly CompoundVariantWithSlots<T, S>[] | undefined,
  compoundSlotClasses: Record<keyof S, ClassValue[]>,
  variantProps: ConfigVariants<T>,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
): Record<keyof S, SlotFunction<T>> & { base: SlotFunction<T> } => {
  const slotFunctions = {} as Record<keyof S, SlotFunction<T>> & { base: SlotFunction<T> };

  // Create base slot function with proper typing
  slotFunctions.base = (slotProps: SlotFunctionProps<T> = {}) => {
    const baseSlotClass = mergedSlots?.base ?? mergedBase;
    const baseClasses = resolveSlotClasses(
      "base",
      baseSlotClass,
      mergedVariants,
      { ...variantProps, ...slotProps },
      mergedDefaultVariants,
      mergedCompoundVariants,
      compoundSlotClasses?.base ?? [],
    );

    const allClasses = [...baseClasses, slotProps.className].filter(Boolean);

    if (allClasses.length === 0) return;

    const classString = cx(...allClasses);

    return shouldMerge ? tailwindMerge(classString) : classString || undefined;
  };

  // Create slot functions
  const slotKeys = Object.keys(mergedSlots) as (keyof S)[];

  for (const slotKey of slotKeys) {
    if (slotKey !== "base") {
      // Type assertion for dynamic slot assignment
      (slotFunctions as Record<keyof S, SlotFunction<T>>)[slotKey] = (
        slotProps: SlotFunctionProps<T> = {},
      ) => {
        const slotClasses = resolveSlotClasses(
          slotKey,
          mergedSlots[slotKey],
          mergedVariants,
          { ...variantProps, ...slotProps },
          mergedDefaultVariants,
          mergedCompoundVariants,
          compoundSlotClasses?.[slotKey] ?? [],
        );

        const allClasses = [...slotClasses, slotProps.className].filter(Boolean);

        if (allClasses.length === 0) return;

        const classString = cx(...allClasses);

        return shouldMerge ? tailwindMerge(classString) : classString || undefined;
      };
    }
  }

  return slotFunctions;
};

/**
 * Handles regular variants without slots
 */
const handleRegularVariants = <T extends ConfigSchema>(
  mergedBase: ClassValue | undefined,
  mergedVariants: T,
  mergedDefaultVariants: ConfigVariants<T>,
  mergedCompoundVariants: readonly CompoundVariant<T>[] | undefined,
  variantProps: ConfigVariants<T>,
  className: ClassValue | undefined,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
): string | undefined => {
  const classes: ClassValue[] = [];

  // Add base classes
  if (mergedBase) {
    classes.push(mergedBase);
  }

  // Add variant classes with optimized iteration
  const variantKeys = Object.keys(mergedVariants) as (keyof T)[];

  for (const variantKey of variantKeys) {
    const variantGroup = mergedVariants[variantKey];
    const variantValue = variantProps[variantKey];

    // Enhanced value resolution with proper boolean handling
    let valueToUse: string | undefined;

    if (variantValue !== undefined) {
      valueToUse = isBooleanValue(variantValue) ? String(variantValue) : String(variantValue);
    } else if (mergedDefaultVariants[variantKey] !== undefined) {
      const defaultValue = mergedDefaultVariants[variantKey];

      valueToUse = isBooleanValue(defaultValue) ? String(defaultValue) : String(defaultValue);
    } else if (isBooleanVariant(variantGroup)) {
      // For boolean variants without explicit default, use false
      valueToUse = "false";
    }

    if (valueToUse !== undefined && valueToUse in variantGroup) {
      classes.push(variantGroup[valueToUse]);
    }
  }

  // Add compound variant classes
  if (mergedCompoundVariants) {
    const compoundClasses = applyCompoundVariants(
      mergedCompoundVariants,
      variantProps,
      mergedDefaultVariants,
    );

    classes.push(...compoundClasses);
  }

  // Add custom className
  if (className) {
    classes.push(className);
  }

  if (classes.length === 0) return;

  const classString = cx(...classes);

  return shouldMerge ? tailwindMerge(classString) : classString || undefined;
};

// =============================================================================
// Main TV Function
// =============================================================================

// Function overloads for type-safe return values
function tv<T extends ConfigSchema>(
  config: Config<T>,
  tvConfig?: TVConfig,
): VariantFunction<T, Record<string, never>>;

function tv<S extends SlotSchema>(
  config: ConfigWithSlots<Record<string, never>, S>,
  tvConfig?: TVConfig,
): VariantFunction<Record<string, never>, S>;

function tv<T extends ConfigSchema, S extends SlotSchema>(
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

function tv<T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
  tvConfig: TVConfig = {},
): VariantFunction<T, S> {
  // Use satisfies operator for type safety
  const configWithType = config satisfies
    | Config<T>
    | ConfigWithSlots<T, S>
    | ExtendedConfig<ConfigSchema, T, SlotSchema, S>;

  const { twMerge: shouldMerge = true, twMergeConfig } = tvConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

  // Merge with extended config if present
  const mergedConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> =
    hasExtend(configWithType) && configWithType.extend
      ? mergeConfigs(
          configWithType.extend.config,
          configWithType as Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
        )
      : (configWithType as Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>);

  const mergedBase = mergedConfig.base;
  const mergedSlots = hasSlots(mergedConfig) ? mergedConfig.slots : undefined;
  const mergedVariants = mergedConfig.variants ?? ({} as T);
  const mergedDefaultVariants = mergedConfig.defaultVariants ?? ({} as ConfigVariants<T>);
  const mergedCompoundVariants = mergedConfig.compoundVariants;

  const tvFunction = (props: ConfigVariants<T> & { className?: ClassValue } = {}) => {
    const { className, ...variantProps } = props;

    // Validate compoundVariants is an array
    if (mergedConfig.compoundVariants && !Array.isArray(mergedConfig.compoundVariants)) {
      throw new Error("compoundVariants must be an array");
    }

    if (mergedSlots) {
      // Handle slots with proper typing
      const compoundSlotClasses = applyCompoundSlots(
        hasSlots(mergedConfig) ? mergedConfig.compoundSlots : undefined,
        variantProps as ConfigVariants<ConfigSchema>,
        mergedDefaultVariants as ConfigVariants<ConfigSchema>,
      );

      return createSlotFunctions(
        mergedSlots,
        mergedBase,
        mergedVariants,
        mergedDefaultVariants as ConfigVariants<ConfigSchema>,
        mergedCompoundVariants as
          | readonly CompoundVariantWithSlots<ConfigSchema, SlotSchema>[]
          | undefined,
        compoundSlotClasses,
        variantProps as ConfigVariants<ConfigSchema>,
        shouldMerge,
        tailwindMerge,
      );
    } else {
      // Handle regular variants with proper typing
      return handleRegularVariants(
        mergedBase,
        mergedVariants,
        mergedDefaultVariants as ConfigVariants<ConfigSchema>,
        mergedCompoundVariants as readonly CompoundVariant<ConfigSchema>[] | undefined,
        variantProps as ConfigVariants<ConfigSchema>,
        className,
        shouldMerge,
        tailwindMerge,
      );
    }
  };

  // Store config for extending with proper typing
  const tvFunctionWithConfig = tvFunction as VariantFunction<T, S>;

  // Use Object.defineProperty for type-safe config assignment
  Object.defineProperty(tvFunctionWithConfig, "config", {
    configurable: false,
    enumerable: false,
    value: mergedConfig,
    writable: false,
  });

  return tvFunctionWithConfig;
}

// =============================================================================
// CreateTV Factory Function
// =============================================================================

function createTV(globalConfig: TVConfig = {}) {
  // Function overloads to ensure proper type inference
  function tvFactory<T extends ConfigSchema>(
    config: Config<T>,
    localConfig?: TVConfig,
  ): VariantFunction<T, Record<string, never>>;

  function tvFactory<S extends SlotSchema>(
    config: ConfigWithSlots<Record<string, never>, S>,
    localConfig?: TVConfig,
  ): VariantFunction<Record<string, never>, S>;

  function tvFactory<T extends ConfigSchema, S extends SlotSchema>(
    config: ConfigWithSlots<T, S>,
    localConfig?: TVConfig,
  ): VariantFunction<T, S>;

  function tvFactory<
    TBase extends ConfigSchema,
    TExtension extends ConfigSchema,
    SBase extends SlotSchema,
    SExtension extends SlotSchema,
  >(
    config: ExtendedConfig<TBase, TExtension, SBase, SExtension>,
    localConfig?: TVConfig,
  ): VariantFunction<MergeSchemas<TBase, TExtension>, MergeSlotSchemas<SBase, SExtension>>;

  function tvFactory<T extends ConfigSchema, S extends SlotSchema>(
    config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
    localConfig?: TVConfig,
  ): VariantFunction<T, S> {
    const mergedConfig = { ...globalConfig, ...localConfig };

    return tv(
      config satisfies
        | Config<T>
        | ConfigWithSlots<T, S>
        | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
      mergedConfig,
    ) as VariantFunction<T, S>;
  }

  return tvFactory;
}

// =============================================================================
// Exports
// =============================================================================

export {
  type Config,
  type ConfigVariants,
  type ConfigWithSlots,
  createTV,
  cx,
  type SlotProps,
  type SlotSchema,
  tv,
  type TVConfig,
  type VariantProps,
};

export { type ClassValue } from "clsx";

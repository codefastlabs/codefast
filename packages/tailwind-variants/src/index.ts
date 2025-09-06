import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

// =============================================================================
// Core Utility Types
// =============================================================================

/**
 * Converts string "true"/"false" to boolean, leaves other types unchanged
 */
type StringToBoolean<T> = T extends "false" | "true" ? boolean : T;

/**
 * Type for class property values
 */
type ClassProperty = ClassValue;

/**
 * Extract variant props from a component function with proper type inference
 */
type VariantProps<
  Component extends (...args: readonly [Record<string, unknown>]) => unknown,
  OmitKeys extends keyof Parameters<Component>[0] = never,
> = Omit<
  {
    readonly [VariantKey in keyof Parameters<Component>[0]]?: StringToBoolean<
      Parameters<Component>[0][VariantKey]
    >;
  },
  OmitKeys
>;

// =============================================================================
// Schema Types
// =============================================================================

/**
 * Base configuration schema for variants
 */
type ConfigSchema = Record<string, Record<string, ClassProperty>>;

/**
 * Base slot schema
 */
type SlotSchema = Record<string, ClassProperty>;

/**
 * Extract variant keys and their possible values with proper type constraints
 */
type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | undefined;
};

/**
 * Extract slot properties with type safety
 */
type SlotProps<S extends SlotSchema> = {
  readonly [Slot in keyof S]?: ClassProperty;
};

// =============================================================================
// Compound Variants Types
// =============================================================================

/**
 * Type-safe compound variant definition
 */
type CompoundVariant<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
} & {
  readonly className: ClassProperty;
};

/**
 * Type-safe compound variant with slot support
 */
type CompoundVariantWithSlots<T extends ConfigSchema, S extends SlotSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
} & {
  readonly className: ClassProperty | SlotProps<S>;
};

/**
 * Type-safe compound slots definition
 */
type CompoundSlot<T extends ConfigSchema, S extends SlotSchema> = {
  readonly [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
} & {
  readonly slots: readonly (keyof S)[];
  readonly className: ClassProperty;
};

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Configuration without slots - type-safe variant definition
 */
interface Config<T extends ConfigSchema> {
  readonly base?: ClassProperty;
  readonly compoundVariants?: readonly CompoundVariant<T>[];
  readonly defaultVariants?: ConfigVariants<T>;
  readonly variants?: T;
}

/**
 * Configuration with slots - extended type-safe definition
 */
interface ConfigWithSlots<T extends ConfigSchema, S extends SlotSchema> {
  readonly base?: ClassProperty;
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
 * Slot function signature - takes optional props and returns className
 */
type SlotFunction<T extends ConfigSchema> = (
  props?: { className?: ClassProperty } & ConfigVariants<T>,
) => string | undefined;

/**
 * Return type for a TV function with proper conditional typing
 */
type TVReturnType<T extends ConfigSchema, S extends SlotSchema, C> =
  // If we have slots, return slot functions
  S extends Record<string, ClassProperty>
    ? {
        readonly [K in keyof S]: SlotFunction<T>;
      } & {
        readonly base: SlotFunction<T>;
      }
    : // If we have a base config, return a single function
      C extends { base: ClassProperty }
      ? SlotFunction<T>
      : // Otherwise return a function that may return undefined
        SlotFunction<T>;

// =============================================================================
// Variant Function Interface
// =============================================================================

/**
 * Core variant function interface with proper generic constraints
 */
interface VariantFunction<T extends ConfigSchema, S extends SlotSchema> {
  readonly config: Config<T> | ConfigWithSlots<T, S>;

  (
    props?: ConfigVariants<T> & { className?: ClassProperty },
  ): TVReturnType<T, S, Config<T> | ConfigWithSlots<T, S>>;
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
  readonly base?: ClassProperty;
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
const createTailwindMerge = (config?: ConfigExtension<string, string>) => {
  return config ? extendTailwindMerge(config) : twMerge;
};

/**
 * Type guard to check if a value is a slot-specific object
 */
const isSlotObject = (value: ClassProperty): value is Record<string, ClassProperty> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

/**
 * Type guard to check if a config has slots
 */
const hasSlots = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S>
): config is ConfigWithSlots<T, S> => {
  return "slots" in config && config.slots !== undefined;
};

/**
 * Type guard to check if a config has extend
 */
const hasExtend = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>
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
): ClassProperty[] => {
  const resolvedProps = { ...defaultVariants, ...variantProps };
  const result: ClassProperty[] = [];

  for (const compound of compoundVariants) {
    let matches = true;
    
    // Cache compound keys to avoid repeated Object.entries calls
    const compoundKeys = Object.keys(compound) as (keyof typeof compound)[];
    
    for (const key of compoundKeys) {
      if (key === "className") {
        continue;
      }

      const propertyValue = resolvedProps[key as keyof T];
      const compoundValue = compound[key];

      // Handle boolean variants with optimized comparison
      if (typeof compoundValue === "boolean") {
        if (propertyValue !== compoundValue && !(propertyValue === undefined && !compoundValue)) {
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
): Record<keyof S, ClassProperty[]> => {
  if (!compoundSlots?.length) {
    return {} as Record<keyof S, ClassProperty[]>;
  }

  const resolvedProps = { ...defaultVariants, ...variantProps };
  const result = {} as Record<keyof S, ClassProperty[]>;

  for (const compound of compoundSlots) {
    let matches = true;
    
    // Cache compound keys to avoid repeated Object.entries calls
    const compoundKeys = Object.keys(compound) as (keyof typeof compound)[];
    
    for (const key of compoundKeys) {
      if (key === "className" || key === "slots") {
        continue;
      }

      if (resolvedProps[key as keyof T] !== compound[key]) {
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
  baseSlotClasses: ClassProperty,
  variants: T | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
  compoundVariants: readonly CompoundVariantWithSlots<T, S>[] | undefined,
  compoundSlotClasses: ClassProperty[],
): ClassProperty[] => {
  const classes: ClassProperty[] = [baseSlotClasses];
  const resolvedProps = { ...defaultVariants, ...variantProps };

  // Apply variant classes with optimized iteration
  if (variants) {
    const variantKeys = Object.keys(variants) as (keyof T)[];
    
    for (const variantKey of variantKeys) {
      const variantGroup = variants[variantKey];
      const variantValue = resolvedProps[variantKey];

      // Determine the value to use with optimized logic
      let valueToUse: string | undefined;

      if (variantValue !== undefined) {
        valueToUse = String(variantValue);
      } else if (defaultVariants[variantKey] !== undefined) {
        valueToUse = String(defaultVariants[variantKey]);
      } else if ("false" in variantGroup) {
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

        if (resolvedProps[key as keyof T] !== compound[key]) {
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
  baseGroup: Record<string, ClassProperty>,
  extensionGroup: Record<string, ClassProperty>,
): Record<string, ClassProperty> => {
  const mergedGroup = { ...baseGroup };
  const extensionKeys = Object.keys(extensionGroup);

  for (const variantValue of extensionKeys) {
    const extensionValue = extensionGroup[variantValue];
    const baseValue = mergedGroup[variantValue];

    if (baseValue !== undefined) {
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
    } else {
      // New variant value
      mergedGroup[variantValue] = extensionValue;
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
  const resolvedBase = hasExtend(baseConfig) && baseConfig.extend
    ? mergeConfigs(baseConfig.extend.config, baseConfig)
    : baseConfig;

  // Merge base classes efficiently
  const mergedBase = extensionConfig.base
    ? (resolvedBase.base ? cx(resolvedBase.base, extensionConfig.base) : extensionConfig.base)
    : resolvedBase.base;

  // Deep merge variants with optimized iteration
  const mergedVariants = { ...resolvedBase.variants } as ConfigSchema;

  if (extensionConfig.variants) {
    const extensionVariantKeys = Object.keys(extensionConfig.variants) as (keyof typeof extensionConfig.variants)[];
    
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
  mergedBase: ClassProperty | undefined,
  mergedVariants: T,
  mergedDefaultVariants: ConfigVariants<T>,
  mergedCompoundVariants: readonly CompoundVariantWithSlots<T, S>[] | undefined,
  compoundSlotClasses: Record<keyof S, ClassProperty[]>,
  variantProps: ConfigVariants<T>,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
): Record<keyof S, SlotFunction<T>> & { base: SlotFunction<T> } => {
  const slotFunctions = {} as Record<keyof S, SlotFunction<T>> & { base: SlotFunction<T> };

  // Create base slot function
  slotFunctions.base = (slotProps: ConfigVariants<T> & { className?: ClassProperty } = {}) => {
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
      (slotFunctions as any)[slotKey] = (slotProps: ConfigVariants<T> & { className?: ClassProperty } = {}) => {
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
  mergedBase: ClassProperty | undefined,
  mergedVariants: T,
  mergedDefaultVariants: ConfigVariants<T>,
  mergedCompoundVariants: readonly CompoundVariant<T>[] | undefined,
  variantProps: ConfigVariants<T>,
  className: ClassProperty | undefined,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
): string | undefined => {
  const classes: ClassProperty[] = [];

  // Add base classes
  if (mergedBase) {
    classes.push(mergedBase);
  }

  // Add variant classes with optimized iteration
  const variantKeys = Object.keys(mergedVariants) as (keyof T)[];
  
  for (const variantKey of variantKeys) {
    const variantGroup = mergedVariants[variantKey];
    const variantValue = variantProps[variantKey];

    // Get the value to use
    let valueToUse: string | undefined;

    if (variantValue !== undefined) {
      valueToUse = String(variantValue);
    } else if (mergedDefaultVariants[variantKey] !== undefined) {
      valueToUse = String(mergedDefaultVariants[variantKey]);
    } else if ("false" in variantGroup) {
      // For boolean variants, default to false if no default is specified
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
  const configWithType = config satisfies Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>;
  
  const { twMerge: shouldMerge = true, twMergeConfig } = tvConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

  // Merge with extended config if present
  let mergedConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>;

  if (hasExtend(configWithType) && configWithType.extend) {
    mergedConfig = mergeConfigs(configWithType.extend.config, configWithType as any);
  } else {
    mergedConfig = configWithType as Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>;
  }

  const mergedBase = mergedConfig.base;
  const mergedSlots = hasSlots(mergedConfig) ? mergedConfig.slots : undefined;
  const mergedVariants = mergedConfig.variants ?? ({} as T);
  const mergedDefaultVariants = mergedConfig.defaultVariants ?? ({} as ConfigVariants<T>);
  const mergedCompoundVariants = mergedConfig.compoundVariants;

  const tvFunction = (props: ConfigVariants<T> & { className?: ClassProperty } = {}) => {
    const { className, ...variantProps } = props;

    // Validate compoundVariants is an array
    if (mergedConfig.compoundVariants && !Array.isArray(mergedConfig.compoundVariants)) {
      throw new Error("compoundVariants must be an array");
    }

    if (mergedSlots) {
      // Handle slots
      const compoundSlotClasses = applyCompoundSlots(
        hasSlots(mergedConfig) ? mergedConfig.compoundSlots : undefined,
        variantProps as any,
        mergedDefaultVariants as any,
      );

      return createSlotFunctions(
        mergedSlots,
        mergedBase,
        mergedVariants,
        mergedDefaultVariants as any,
        mergedCompoundVariants as any,
        compoundSlotClasses,
        variantProps as any,
        shouldMerge,
        tailwindMerge,
      );
    } else {
      // Handle regular variants
      return handleRegularVariants(
        mergedBase,
        mergedVariants,
        mergedDefaultVariants as any,
        mergedCompoundVariants as any,
        variantProps as any,
        className,
        shouldMerge,
        tailwindMerge,
      );
    }
  };

  // Store config for extending with proper typing
  const tvFunctionWithConfig = tvFunction as VariantFunction<T, S>;
  (tvFunctionWithConfig as any).config = mergedConfig;

  return tvFunctionWithConfig;
}

// =============================================================================
// CreateTV Factory Function
// =============================================================================

function createTV(globalConfig: TVConfig = {}) {
  return function <T extends ConfigSchema, S extends SlotSchema = Record<string, never>>(
    config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
    localConfig?: TVConfig,
  ) {
    const mergedConfig = { ...globalConfig, ...localConfig };

    return tv(config satisfies Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>, mergedConfig);
  };
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
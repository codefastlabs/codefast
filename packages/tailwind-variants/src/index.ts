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

const cx = (...classes: ClassValue[]): string => {
  return clsx(classes);
};

const createTailwindMerge = (config?: ConfigExtension<string, string>) => {
  if (config) {
    return extendTailwindMerge(config);
  }

  return twMerge;
};

// =============================================================================
// Compound Variants Logic
// =============================================================================

const applyCompoundVariants = <T extends ConfigSchema>(
  compoundVariants: readonly CompoundVariant<T>[],
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): ClassProperty[] => {
  const resolvedProps = { ...defaultVariants, ...variantProps };

  return compoundVariants
    .filter((compound) => {
      return Object.entries(compound).every(([key, value]) => {
        if (key === "className") return true;

        const propertyValue = resolvedProps[key as keyof T];
        const compoundValue = value;

        // Handle boolean variants
        if (typeof compoundValue === "boolean") {
          return propertyValue === compoundValue || (propertyValue === undefined && !compoundValue);
        }

        return propertyValue === compoundValue;
      });
    })
    .map((compound) => compound.className);
};

const applyCompoundSlots = <T extends ConfigSchema, S extends SlotSchema>(
  compoundSlots: readonly CompoundSlot<T, S>[] | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): Record<keyof S, ClassProperty[]> => {
  if (!compoundSlots) return {} as Record<keyof S, ClassProperty[]>;

  const resolvedProps = { ...defaultVariants, ...variantProps };
  const result = {} as Record<keyof S, ClassProperty[]>;

  for (const compound of compoundSlots) {
    const matches = Object.entries(compound).every(([key, value]) => {
      if (key === "className" || key === "slots") return true;

      const propertyValue = resolvedProps[key as keyof T];

      return propertyValue === value;
    });

    if (matches) {
      for (const slot of compound.slots) {
        if (!result[slot]) result[slot] = [];

        result[slot].push(compound.className);
      }
    }
  }

  return result;
};

// =============================================================================
// Slot Resolution Logic
// =============================================================================

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

  // Apply variant classes
  if (variants) {
    for (const variantKey of Object.keys(variants) as (keyof T)[]) {
      const variantGroup = variants[variantKey];
      const variantValue = variantProps[variantKey];

      // Get the value to use
      let valueToUse: string | undefined;

      if (variantValue !== undefined) {
        valueToUse = String(variantValue);
      } else if (defaultVariants[variantKey] !== undefined) {
        valueToUse = String(defaultVariants[variantKey]);
      } else if ("false" in variantGroup) {
        // For boolean variants, default to false if no default is specified
        valueToUse = "false";
      }

      if (valueToUse !== undefined && valueToUse in variantGroup) {
        const variantConfig = variantGroup[valueToUse];

        if (variantConfig) {
          if (
            typeof variantConfig === "object" &&
            !Array.isArray(variantConfig) &&
            variantConfig !== null
          ) {
            // Handle slot-specific variant
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

  // Apply compound variants
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
          // Slot-specific compound variant
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

// =============================================================================
// Configuration Merging
// =============================================================================

const mergeConfigs = (
  baseConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
  extensionConfig:
    | Config<ConfigSchema>
    | ConfigWithSlots<ConfigSchema, SlotSchema>
    | ExtendedConfig<ConfigSchema, ConfigSchema, SlotSchema, SlotSchema>,
): Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> => {
  const base = baseConfig;
  const extension = extensionConfig;

  // Recursively merge if base has extend
  const resolvedBase =
    "extend" in base && (base as any).extend
      ? mergeConfigs((base as any).extend.config, base)
      : base;

  // Merge base classes properly
  const mergedBase = extension.base
    ? resolvedBase.base
      ? cx(resolvedBase.base, extension.base)
      : extension.base
    : resolvedBase.base;

  // Deep merge variants
  const mergedVariants = { ...resolvedBase.variants } as ConfigSchema;

  if (extension.variants) {
    const extensionVariants = extension.variants;

    for (const variantKey of Object.keys(extensionVariants)) {
      if (variantKey in mergedVariants) {
        // Deep merge variant values
        const baseVariantGroup = mergedVariants[variantKey];
        const extensionVariantGroup = extensionVariants[variantKey];
        const mergedVariantGroup: Record<string, ClassProperty> = { ...baseVariantGroup };

        for (const variantValue of Object.keys(extensionVariantGroup)) {
          if (variantValue in mergedVariantGroup) {
            // Merge individual variant value (e.g., primary: { base: ..., content: ... })
            const baseValue = mergedVariantGroup[variantValue];
            const extensionValue = extensionVariantGroup[variantValue];

            if (
              typeof baseValue === "object" &&
              typeof extensionValue === "object" &&
              baseValue !== null &&
              extensionValue !== null &&
              !Array.isArray(baseValue) &&
              !Array.isArray(extensionValue)
            ) {
              // Both are slot-specific objects, merge them
              mergedVariantGroup[variantValue] = {
                ...(baseValue as Record<string, ClassProperty>),
                ...(extensionValue as Record<string, ClassProperty>),
              };
            } else {
              // One or both are primitive, extension overrides
              mergedVariantGroup[variantValue] = extensionValue;
            }
          } else {
            // New variant value
            mergedVariantGroup[variantValue] = extensionVariantGroup[variantValue];
          }
        }

        mergedVariants[variantKey] = mergedVariantGroup;
      } else {
        // New variant key
        mergedVariants[variantKey] = extensionVariants[variantKey];
      }
    }
  }

  // Merge slots
  const resolvedSlots = "slots" in resolvedBase && resolvedBase.slots ? resolvedBase.slots : {};
  const extensionSlots = "slots" in extension && extension.slots ? extension.slots : {};

  const mergedSlots = {
    ...resolvedSlots,
    ...extensionSlots,
  };

  const hasSlots = Object.keys(mergedSlots).length > 0;

  if (hasSlots) {
    return {
      base: mergedBase,
      compoundSlots: [
        ...("compoundSlots" in resolvedBase && Array.isArray(resolvedBase.compoundSlots)
          ? resolvedBase.compoundSlots
          : []),
        ...("compoundSlots" in extension && Array.isArray(extension.compoundSlots)
          ? extension.compoundSlots
          : []),
      ],
      compoundVariants: [
        ...(resolvedBase.compoundVariants || []),
        ...(extension.compoundVariants || []),
      ],
      defaultVariants: { ...resolvedBase.defaultVariants, ...extension.defaultVariants },
      slots: mergedSlots,
      variants: mergedVariants,
    };
  }

  return {
    base: mergedBase,
    compoundVariants: [
      ...(resolvedBase.compoundVariants || []),
      ...(extension.compoundVariants || []),
    ],
    defaultVariants: { ...resolvedBase.defaultVariants, ...extension.defaultVariants },
    variants: mergedVariants,
  };
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
  const configAny = config as any;
  const { compoundSlots, extend } = configAny;

  const { twMerge: shouldMerge = true, twMergeConfig } = tvConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

  // Merge with extended config if present
  let mergedConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>;

  mergedConfig = extend ? mergeConfigs(extend.config, config as any) : (config as any);

  const mergedBase = mergedConfig.base;
  const mergedSlots = "slots" in mergedConfig ? mergedConfig.slots : undefined;
  const mergedVariants = mergedConfig.variants || {};
  const mergedDefaultVariants = mergedConfig.defaultVariants || {};
  const mergedCompoundVariants = mergedConfig.compoundVariants;

  const tvFunction = (props: any = {}) => {
    const { className, ...variantProps } = props;

    if (mergedSlots) {
      // Handle slots
      const compoundSlotClasses = applyCompoundSlots(
        compoundSlots,
        variantProps,
        mergedDefaultVariants,
      );

      const slotFunctions: Record<string, any> = {};

      // Create base slot function
      slotFunctions.base = (slotProps: any = {}) => {
        const baseSlotClass = mergedSlots?.base || mergedBase;
        const baseClasses = resolveSlotClasses(
          "base",
          baseSlotClass,
          mergedVariants,
          { ...variantProps, ...slotProps },
          mergedDefaultVariants,
          mergedCompoundVariants as any,
          compoundSlotClasses?.base || [],
        );

        const allClasses = [...baseClasses, slotProps.className].filter(Boolean);

        if (allClasses.length === 0) return;

        const classString = cx(...allClasses);

        return shouldMerge ? tailwindMerge(classString) : classString || undefined;
      };

      // Create slot functions
      if (mergedSlots) {
        for (const slotKey of Object.keys(mergedSlots)) {
          if (slotKey !== "base") {
            slotFunctions[slotKey] = (slotProps: any = {}) => {
              const slotClasses = resolveSlotClasses(
                slotKey,
                mergedSlots[slotKey],
                mergedVariants,
                { ...variantProps, ...slotProps },
                mergedDefaultVariants,
                mergedCompoundVariants as any,
                compoundSlotClasses?.[slotKey] || [],
              );

              const allClasses = [...slotClasses, slotProps.className].filter(Boolean);

              if (allClasses.length === 0) return;

              const classString = cx(...allClasses);

              return shouldMerge ? tailwindMerge(classString) : classString || undefined;
            };
          }
        }
      }

      return slotFunctions;
    } else {
      // Handle regular variants
      const classes: ClassProperty[] = [];

      // Add base classes
      if (mergedBase) {
        classes.push(mergedBase);
      }

      // Add variant classes
      if (mergedVariants) {
        for (const variantKey of Object.keys(mergedVariants)) {
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
      }

      // Add compound variant classes
      if (mergedCompoundVariants) {
        const compoundClasses = applyCompoundVariants(
          mergedCompoundVariants as any,
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
    }
  };

  // Store config for extending
  const tvFunctionWithConfig = tvFunction as any;

  tvFunctionWithConfig.config = mergedConfig;

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

    return tv(config as any, mergedConfig);
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

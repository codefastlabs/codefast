import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

// =============================================================================
// Types
// =============================================================================

type ClassProperty = ClassValue;

type StringToBoolean<T> = T extends "false" | "true" ? boolean : T;

type VariantProps<
  Component extends (...args: never[]) => unknown,
  OmitKeys extends keyof Component extends never ? never : keyof Component = never,
> = Omit<
  {
    [VariantKey in keyof Parameters<Component>[0]]?: StringToBoolean<
      Parameters<Component>[0][VariantKey]
    >;
  },
  OmitKeys
>;

type ConfigSchema = Record<string, Record<string, ClassProperty>>;

type ConfigVariants<T = ConfigSchema> = {
  [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | undefined;
};

interface Config<T = ConfigSchema> {
  base?: ClassProperty;
  compoundVariants?: ({
    [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
  } & {
    className: ClassProperty;
  })[];
  defaultVariants?: ConfigVariants<T>;
  variants?: T;
}

interface ConfigWithSlots<T = ConfigSchema, S = SlotSchema> {
  base?: ClassProperty;
  compoundSlots?: ({
    [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
  } & {
    slots: (keyof S)[];
    className: ClassProperty;
  })[];
  compoundVariants?: ({
    [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>;
  } & {
    className: ClassProperty | SlotProps<S>;
  })[];
  defaultVariants?: ConfigVariants<T>;
  slots?: S;
  variants?: T;
}

type SlotSchema = Record<string, ClassProperty>;

type SlotProps<T = SlotSchema> = {
  [Slot in keyof T]?: ClassProperty;
};

interface TVConfig {
  twMerge?: boolean;
  twMergeConfig?: ConfigExtension<string, string>;
}

type TVReturnType<T, S, C> =
  S extends Record<string, ClassProperty>
    ? {
        [K in keyof S]: (
          props?: { className?: ClassProperty } & ConfigVariants<T>,
        ) => string | undefined;
      } & {
        base: (props?: { className?: ClassProperty } & ConfigVariants<T>) => string | undefined;
      }
    : C extends { base: unknown }
      ? (props?: { className?: ClassProperty } & ConfigVariants<T>) => string | undefined
      : (props?: { className?: ClassProperty } & ConfigVariants<T>) => string | undefined;

interface ExtendedConfig<TBase, TExtension, SBase = never, SExtension = never> {
  base?: ClassProperty;
  compoundSlots?: ({
    [Variant in keyof (TBase & TExtension)]?: StringToBoolean<keyof (TBase & TExtension)[Variant]>;
  } & {
    slots: (keyof (SBase & SExtension))[];
    className: ClassProperty;
  })[];
  compoundVariants?: ({
    [Variant in keyof (TBase & TExtension)]?: StringToBoolean<keyof (TBase & TExtension)[Variant]>;
  } & {
    className: SBase extends Record<string, ClassProperty>
      ? ClassProperty | SlotProps<SBase & SExtension>
      : SExtension extends Record<string, ClassProperty>
        ? ClassProperty | SlotProps<SExtension>
        : ClassProperty;
  })[];
  defaultVariants?: ConfigVariants<TBase & TExtension>;
  extend?: VariantFunction<TBase, SBase>;
  slots?: SExtension;
  variants?: TExtension;
}

// Union type for TV functions
interface VariantFunction<T = ConfigSchema, S = never> {
  config: Config<T> | ConfigWithSlots<T, S>;
  extend?: VariantFunction<unknown, unknown>;

  (
    props?: ConfigVariants<T> & { className?: ClassProperty },
  ): S extends Record<string, ClassProperty> ? TVReturnType<T, S, unknown> : string | undefined;
}

// =============================================================================
// Utilities
// =============================================================================

const flattenArray = (classNames: ClassValue[]): string[] => {
  const result: string[] = [];

  const flatten = (item: ClassValue): void => {
    if (Array.isArray(item)) {
      item.forEach(flatten);
    } else if (typeof item === "string" && item) {
      result.push(item);
    } else if (item) {
      const processed = clsx(item);

      if (processed) {
        result.push(processed);
      }
    }
  };

  classNames.forEach(flatten);

  return result;
};

const cx = (...classes: ClassValue[]): string => {
  return clsx(flattenArray(classes).join(" "));
};

// =============================================================================
// Core TV Implementation
// =============================================================================

const createTailwindMerge = (config?: ConfigExtension<string, string>) => {
  if (config) {
    return extendTailwindMerge(config);
  }

  return twMerge;
};

const applyCompoundVariants = <T extends ConfigSchema>(
  compoundVariants: ({
    [K in keyof T]?: StringToBoolean<keyof T[K]>;
  } & { className: ClassProperty })[],
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
  compoundSlots:
    | ({
        [K in keyof T]?: StringToBoolean<keyof T[K]>;
      } & { slots: (keyof S)[]; className: ClassProperty })[]
    | undefined,
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

const resolveSlotClasses = <T extends ConfigSchema, S extends SlotSchema>(
  slotKey: keyof S,
  baseSlotClasses: ClassProperty,
  variants: T | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
  compoundVariants:
    | ({
        [K in keyof T]?: StringToBoolean<keyof T[K]>;
      } & { className: ClassProperty | SlotProps<S> })[]
    | undefined,
  compoundSlotClasses: ClassProperty[],
): ClassProperty[] => {
  const classes: ClassProperty[] = [baseSlotClasses];

  // Apply variant classes
  if (variants) {
    for (const variantKey of Object.keys(variants)) {
      const variantGroup = variants[variantKey as keyof T] as Record<string, unknown>;
      const variantValue = (variantProps as Record<string, unknown>)[variantKey];

      // Get the value to use
      let valueToUse: string | undefined;

      if (variantValue !== undefined) {
        valueToUse = variantValue as string;
      } else if ((defaultVariants as Record<string, unknown>)[variantKey] !== undefined) {
        valueToUse = (defaultVariants as Record<string, unknown>)[variantKey] as string;
      } else if (variantGroup.false !== undefined) {
        // For boolean variants, default to false if no default is specified
        valueToUse = "false";
      }

      if (valueToUse !== undefined && variantGroup[valueToUse] !== undefined) {
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
            classes.push(variantConfig as ClassProperty);
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

        return (resolvedProps as Record<string, unknown>)[key] === value;
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
          classes.push(className as ClassProperty);
        }
      }
    }
  }

  // Add compound slot classes
  classes.push(...compoundSlotClasses);

  return classes;
};

// =============================================================================
// Main TV Function
// =============================================================================

function tv<T extends ConfigSchema, S extends SlotSchema = never>(
  config: ExtendedConfig<unknown, T, never, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;
function tv<T extends ConfigSchema>(config: Config<T>, tvConfig?: TVConfig): VariantFunction<T>;
function tv<T extends ConfigSchema, S extends SlotSchema = never>(
  config: ConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;

function tv(config: unknown, tvConfig: TVConfig = {}): unknown {
  const { compoundSlots, extend, slots } = config as ExtendedConfig<
    unknown,
    unknown,
    unknown,
    unknown
  >;

  const { twMerge: shouldMerge = true, twMergeConfig } = tvConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

  // Merge with extended config if present
  let mergedConfig: Config<unknown> & { slots?: Record<string, ClassProperty> };

  mergedConfig = extend
    ? mergeConfigs(extend.config, config as Config<unknown>)
    : (config as Config<unknown>);

  const mergedBase = mergedConfig.base;
  const mergedSlots = mergedConfig.slots || slots;
  const mergedVariants = mergedConfig.variants;
  const mergedDefaultVariants = mergedConfig.defaultVariants || {};
  const mergedCompoundVariants = mergedConfig.compoundVariants;

  const tvFunction = (props: Record<string, unknown> = {}) => {
    const { className, ...variantProps } = props as ConfigVariants<unknown> & {
      className?: ClassProperty;
    };

    if (mergedSlots) {
      // Handle slots
      const compoundSlotClasses = applyCompoundSlots(
        compoundSlots as
          | (Record<string, string | undefined> & {
              slots: (keyof unknown)[];
              className: ClassProperty;
            })[]
          | undefined,
        variantProps as ConfigVariants<unknown>,
        mergedDefaultVariants,
      );

      const slotFunctions = {} as Record<
        string,
        (slotProps?: { className?: ClassProperty }) => string | undefined
      >;

      // Create base slot function
      slotFunctions.base = (slotProps = {}) => {
        const baseSlotClass = (mergedSlots as Record<string, ClassProperty>).base || mergedBase;
        const baseClasses = resolveSlotClasses(
          "base",
          baseSlotClass,
          mergedVariants as ConfigSchema,
          { ...variantProps, ...slotProps } as ConfigVariants<unknown>,
          mergedDefaultVariants,
          mergedCompoundVariants as
            | (Record<string, string | undefined> & {
                className: ClassProperty | Record<string, ClassProperty>;
              })[]
            | undefined,
          compoundSlotClasses.base || [],
        );

        const allClasses = [...baseClasses, slotProps.className].filter(Boolean);

        if (allClasses.length === 0) return;

        const classString = cx(...allClasses);

        return shouldMerge ? tailwindMerge(classString) : classString || undefined;
      };

      // Create slot functions
      for (const slotKey of Object.keys(mergedSlots as Record<string, ClassProperty>)) {
        slotFunctions[slotKey] = (slotProps = {}) => {
          const slotClasses = resolveSlotClasses(
            slotKey,
            (mergedSlots as Record<string, ClassProperty>)[slotKey],
            mergedVariants as ConfigSchema,
            { ...variantProps, ...slotProps } as ConfigVariants<unknown>,
            mergedDefaultVariants,
            mergedCompoundVariants as
              | (Record<string, string | undefined> & {
                  className: ClassProperty | Record<string, ClassProperty>;
                })[]
              | undefined,
            compoundSlotClasses[slotKey] || [],
          );

          const allClasses = [...slotClasses, slotProps.className].filter(Boolean);

          if (allClasses.length === 0) return;

          const classString = cx(...allClasses);

          return shouldMerge ? tailwindMerge(classString) : classString || undefined;
        };
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
          const variantGroup = mergedVariants[variantKey as keyof typeof mergedVariants] as Record<
            string,
            ClassProperty
          >;
          const variantValue = (variantProps as Record<string, unknown>)[variantKey];

          // Get the value to use
          let valueToUse: string | undefined;

          if (variantValue !== undefined) {
            valueToUse = variantValue as string;
          } else if ((mergedDefaultVariants as Record<string, unknown>)[variantKey] !== undefined) {
            valueToUse = (mergedDefaultVariants as Record<string, unknown>)[variantKey] as string;
          } else if (variantGroup.false !== undefined) {
            // For boolean variants, default to false if no default is specified
            valueToUse = "false";
          }

          if (valueToUse !== undefined && variantGroup[valueToUse] !== undefined) {
            classes.push(variantGroup[valueToUse]);
          }
        }
      }

      // Add compound variant classes
      if (mergedCompoundVariants) {
        const compoundClasses = applyCompoundVariants(
          mergedCompoundVariants as (Record<string, string | undefined> & {
            className: ClassProperty;
          })[],
          variantProps as ConfigVariants<unknown>,
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
  tvFunction.config = config;
  tvFunction.extend = extend;

  return tvFunction as unknown;
}

// =============================================================================
// Config Merging for Extends
// =============================================================================

const mergeConfigs = (
  baseConfig: unknown,
  extensionConfig: unknown,
): Config<unknown> & { slots?: Record<string, ClassProperty> } => {
  const base = baseConfig as Config<unknown> & { slots?: Record<string, ClassProperty> };
  const extension = extensionConfig as (Config<unknown> | ExtendedConfig<unknown, unknown>) & {
    slots?: Record<string, ClassProperty>;
  };

  // Recursively merge if base has extend
  const resolvedBase = (base as unknown as { extend?: unknown }).extend
    ? mergeConfigs((base as unknown as { extend: { config: unknown } }).extend.config, base)
    : base;

  // Merge base classes properly
  const mergedBase = extension.base
    ? resolvedBase.base
      ? `${cx(resolvedBase.base)} ${cx(extension.base)}`
      : extension.base
    : resolvedBase.base;

  // Deep merge variants
  const mergedVariants: Record<string, Record<string, unknown>> = { ...resolvedBase.variants };

  if (extension.variants) {
    const extensionVariants = extension.variants as Record<string, Record<string, unknown>>;

    for (const variantKey of Object.keys(extensionVariants)) {
      if (mergedVariants[variantKey]) {
        // Deep merge variant values
        const baseVariantGroup = mergedVariants[variantKey];
        const extensionVariantGroup = extensionVariants[variantKey];
        const mergedVariantGroup: Record<string, unknown> = { ...baseVariantGroup };

        for (const variantValue of Object.keys(extensionVariantGroup)) {
          if (mergedVariantGroup[variantValue]) {
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
                ...(baseValue as Record<string, unknown>),
                ...(extensionValue as Record<string, unknown>),
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
  const mergedSlots = {
    ...resolvedBase.slots,
    ...extension.slots,
  };

  return {
    base: mergedBase,
    compoundVariants: [
      ...(resolvedBase.compoundVariants || []),
      ...(extension.compoundVariants || []),
    ],
    defaultVariants: { ...resolvedBase.defaultVariants, ...extension.defaultVariants },
    slots: Object.keys(mergedSlots).length > 0 ? mergedSlots : undefined,
    variants: mergedVariants,
  };
};

// =============================================================================
// CreateTV Factory Function
// =============================================================================

function createTV(globalConfig: TVConfig = {}) {
  return function <T extends ConfigSchema, S extends SlotSchema = never>(
    config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<unknown, T, never, S>,
    localConfig?: TVConfig,
  ) {
    const mergedConfig = { ...globalConfig, ...localConfig };

    return tv(config as never, mergedConfig);
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

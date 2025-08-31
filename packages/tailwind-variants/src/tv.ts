/**
 * Core tailwind-variants implementation with advanced TypeScript support
 */

import type {
  ClassValue,
  CompoundSlots,
  CompoundVariant,
  SlotFunction,
  SlotsReturnType,
  SlotsSchema,
  TVComponent,
  TVConfig,
  TVProps,
  TVReturnType,
  VariantSchema,
} from "./types";

import { falsyToString, flat, isEmptyObject, mergeObjects } from "./utils";

// Default configuration
const defaultConfig: TVConfig = {
  twMerge: true,
  twMergeConfig: undefined,
};

// Lazy-loaded tailwind-merge functions
let tailwindMergeModule: typeof import("tailwind-merge") | null = null;

/**
 * Lazily loads tailwind-merge module
 */
const getTailwindMerge = (): typeof import("tailwind-merge") | null => {
  if (tailwindMergeModule) return tailwindMergeModule;

  try {
    tailwindMergeModule = require("tailwind-merge") as typeof import("tailwind-merge");
    return tailwindMergeModule;
  } catch {
    return null;
  }
};

/**
 * Resolves class names using tailwind-merge if available and enabled
 */
const resolveClasses = (classes: string[], config: TVConfig): string | undefined => {
  if (classes.length === 0) return undefined;

  if (!config.twMerge) {
    return classes.join(" ");
  }

  try {
    const tailwindMerge = getTailwindMerge();
    
    if (!tailwindMerge) {
      return classes.join(" ");
    }

    const { extendTailwindMerge, twMerge } = tailwindMerge;

    if (config.twMergeConfig && !isEmptyObject(config.twMergeConfig)) {
      const customTwMerge = extendTailwindMerge(config.twMergeConfig);

      return customTwMerge(classes.join(" "));
    }

    return twMerge(classes.join(" "));
  } catch (error) {
    // Fallback if tailwind-merge is not available or has an error
    console.warn("TailwindMerge error:", error);

    return classes.join(" ");
  }
};

/**
 * Processes class values into a flat array of strings
 */
const flattenClasses = (classValue: ClassValue): string[] => {
  if (!classValue) return [];

  if (typeof classValue === "string") return [classValue];

  if (Array.isArray(classValue)) {
    const result: string[] = [];

    flat(classValue, result);

    return result.filter(Boolean);
  }

  return [];
};

/**
 * Evaluates compound variants based on current props
 */
const evaluateCompoundVariants = <V extends VariantSchema>(
  compoundVariants: CompoundVariant<V>[] | undefined,
  props: TVProps<V>,
  defaultVariants?: Partial<TVProps<V>>,
  allVariants?: V,
): ClassValue[] => {
  if (!compoundVariants) return [];

  return compoundVariants
    .filter((compound) => {
      return Object.entries(compound).every(([key, value]) => {
        if (key === "class") return true;

        let propertyValue = props[key as keyof V];

        // Use default variant if prop is undefined
        if (propertyValue === undefined && defaultVariants) {
          propertyValue = defaultVariants[key as keyof V] as TVProps<V>[keyof V];
        }

        // For boolean variants, default to false if still undefined
        if (propertyValue === undefined && allVariants) {
          const variantOptions = allVariants[key as keyof V];

          if (variantOptions && typeof variantOptions === "object") {
            const hasTrue = "true" in variantOptions;
            const hasFalse = "false" in variantOptions;

            if (hasTrue || hasFalse) {
              propertyValue = false as TVProps<V>[keyof V];
            }
          }
        }

        const normalizedPropertyValue = falsyToString(propertyValue);
        const normalizedCompoundValue = falsyToString(value);

        return normalizedPropertyValue === normalizedCompoundValue;
      });
    })
    .map((compound) => compound.class);
};

/**
 * Evaluates compound slots based on current props
 */
const evaluateCompoundSlots = <V extends VariantSchema, S extends SlotsSchema>(
  compoundSlots: CompoundSlots<V, S>[] | undefined,
  props: TVProps<V>,
  slotName: keyof S,
): ClassValue[] => {
  if (!compoundSlots) return [];

  return compoundSlots
    .filter((compound) => {
      // Check if this compound slot applies to the current slot
      if (!compound.slots.includes(slotName)) return false;

      // Check if variant conditions match
      return Object.entries(compound).every(([key, value]) => {
        if (key === "class" || key === "slots") return true;

        const propertyValue = props[key as keyof V];
        const normalizedPropertyValue = falsyToString(propertyValue);
        const normalizedCompoundValue = falsyToString(value);

        return normalizedPropertyValue === normalizedCompoundValue;
      });
    })
    .map((compound) => {
      const classValue = compound.class;

      if (typeof classValue === "object" && classValue !== null && !Array.isArray(classValue)) {
        return (classValue as Record<string, ClassValue>)[slotName as string];
      }

      return classValue;
    });
};

/**
 * Creates a slot function for component slots
 */
const createSlotFunction = <V extends VariantSchema, S extends SlotsSchema>(
  component: TVComponent<V, S>,
  slotName: keyof S,
  baseProps: TVProps<V>,
  config: TVConfig,
): SlotFunction => {
  return (slotProps?: { class?: ClassValue; className?: ClassValue }) => {
    const mergedProps = { ...baseProps, ...slotProps };
    const classes: string[] = [];

    // For base slot, add component base classes
    if (slotName === "base" && component.base) {
      classes.push(...flattenClasses(component.base));
    }

    // Add slot-specific base classes
    const slotBase = component.slots?.[slotName];

    if (slotBase) {
      classes.push(...flattenClasses(slotBase));
    }

    // Add variant classes for this slot
    if (component.variants) {
      for (const [variantName, variantOptions] of Object.entries(component.variants)) {
        let variantValue = mergedProps[variantName as keyof V];

        // Handle default variants and undefined values
        if (variantValue === undefined && component.defaultVariants) {
          variantValue = component.defaultVariants[variantName as keyof V] as TVProps<V>[keyof V];
        }

        // Handle boolean variants - default to false if not specified
        if (variantValue === undefined) {
          const hasTrue = "true" in variantOptions;
          const hasFalse = "false" in variantOptions;

          if (hasTrue || hasFalse) {
            variantValue = false as TVProps<V>[keyof V];
          }
        }

        if (variantValue != null) {
          const normalizedValue = falsyToString(variantValue);
          const variantClass = variantOptions[normalizedValue as keyof typeof variantOptions];

          if (variantClass) {
            if (
              typeof variantClass === "object" &&
              variantClass !== null &&
              !Array.isArray(variantClass)
            ) {
              const slotVariantClass = (variantClass as Record<string, ClassValue>)[
                slotName as string
              ];

              if (slotVariantClass) {
                classes.push(...flattenClasses(slotVariantClass));
              }
            } else {
              // For base slot, include global variant classes
              if (slotName === "base") {
                classes.push(...flattenClasses(variantClass));
              }
            }
          }
        }
      }
    }

    // Add compound variant classes for this slot
    const compoundClasses = evaluateCompoundVariants(
      component.compoundVariants,
      mergedProps,
      component.defaultVariants,
      component.variants,
    );

    for (const compoundClass of compoundClasses) {
      if (
        typeof compoundClass === "object" &&
        compoundClass !== null &&
        !Array.isArray(compoundClass)
      ) {
        const slotCompoundClass = (compoundClass as unknown as Record<string, ClassValue>)[
          slotName as string
        ];

        if (slotCompoundClass) {
          classes.push(...flattenClasses(slotCompoundClass));
        }
      } else if (slotName === "base") {
        classes.push(...flattenClasses(compoundClass));
      }
    }

    // Add compound slot classes
    const compoundSlotClasses = evaluateCompoundSlots(
      component.compoundSlots,
      mergedProps,
      slotName,
    );

    for (const compoundSlotClass of compoundSlotClasses) {
      classes.push(...flattenClasses(compoundSlotClass));
    }

    // Add custom classes
    const customClass = slotProps?.class ?? slotProps?.className;

    if (customClass) {
      classes.push(...flattenClasses(customClass));
    }

    return resolveClasses(classes, config);
  };
};

/**
 * Creates a TV component with proper typing
 */
export const createTVComponent = <V extends VariantSchema, S extends SlotsSchema>(
  component: TVComponent<V, S>,
  config: TVConfig,
): TVReturnType<V, S> => {
  // Handle extends by merging with parent component
  if (component.extend) {
    const parentFunction = component.extend as TVReturnType<VariantSchema, SlotsSchema> & { __tvConfig?: TVComponent<V, S> };
    const parentComponent = parentFunction.__tvConfig;

    if (parentComponent) {
      // Deep merge the components, with child overriding parent
      const mergedBase = [
        ...(parentComponent.base ? flattenClasses(parentComponent.base) : []),
        ...(component.base ? flattenClasses(component.base) : []),
      ];

      const mergedComponent: TVComponent<V, S> = {
        base: mergedBase.length > 0 ? mergedBase : undefined,
        compoundSlots: [
          ...(parentComponent.compoundSlots ?? []),
          ...(component.compoundSlots ?? []),
        ],
        compoundVariants: [
          ...(parentComponent.compoundVariants ?? []),
          ...(component.compoundVariants ?? []),
        ],
        defaultVariants: {
          ...parentComponent.defaultVariants,
          ...component.defaultVariants,
        } as Partial<TVProps<V>>,
        slots: component.slots
          ? { ...parentComponent.slots, ...component.slots }
          : parentComponent.slots,
        variants: component.variants
          ? mergeObjects(parentComponent.variants ?? {}, component.variants)
          : parentComponent.variants,
      };

      component = mergedComponent;
    }
  }

  const variantKeys = component.variants ? (Object.keys(component.variants) as (keyof V)[]) : [];

  // If component has slots, return slots-based component
  if (component.slots && Object.keys(component.slots).length > 0) {
    const slotsComponent = (
      props: TVProps<V> = {},
    ): SlotsReturnType<S> & { base: SlotFunction } => {
      // Merge with default variants
      const mergedProps = { ...component.defaultVariants, ...props } as TVProps<V>;

      const slots = {} as Record<string, SlotFunction>;

      // Create base slot function
      slots.base = createSlotFunction(component, "base" as keyof S, mergedProps, config);

      // Create slot functions for each defined slot
      for (const slotName of Object.keys(component.slots!)) {
        slots[slotName] = createSlotFunction(component, slotName as keyof S, mergedProps, config);
      }

      return slots as SlotsReturnType<S> & { base: SlotFunction };
    };

    slotsComponent.variantKeys = variantKeys;

    (slotsComponent as TVReturnType<V, S> & { __tvConfig: TVComponent<V, S> }).__tvConfig = component;

    return slotsComponent as TVReturnType<V, S>;
  }

  // Simple component without slots
  const simpleComponent = (props: TVProps<V> = {}): string | undefined => {
    const classes: string[] = [];

    // Add base classes
    if (component.base) {
      classes.push(...flattenClasses(component.base));
    }

    // Add variant classes
    if (component.variants) {
      for (const [variantName, variantOptions] of Object.entries(component.variants)) {
        let variantValue = props[variantName as keyof V];

        // Handle default variants and undefined values
        if (variantValue === undefined && component.defaultVariants) {
          variantValue = component.defaultVariants[variantName as keyof V] as TVProps<V>[keyof V];
        }

        // Handle boolean variants - default to false if not specified
        if (variantValue === undefined) {
          const hasTrue = "true" in variantOptions;
          const hasFalse = "false" in variantOptions;

          if (hasTrue || hasFalse) {
            variantValue = false as TVProps<V>[keyof V];
          }
        }

        if (variantValue != null) {
          const normalizedValue = falsyToString(variantValue);
          const variantClass = variantOptions[normalizedValue as keyof typeof variantOptions];

          if (variantClass) {
            classes.push(...flattenClasses(variantClass));
          }
        }
      }
    }

    // Create merged props for compound evaluation
    const mergedProps = { ...component.defaultVariants, ...props } as TVProps<V>;

    // Add compound variant classes
    const compoundClasses = evaluateCompoundVariants(
      component.compoundVariants,
      mergedProps,
      component.defaultVariants,
      component.variants,
    );

    for (const compoundClass of compoundClasses) {
      classes.push(...flattenClasses(compoundClass));
    }

    // Add custom classes
    const customClass = props.class ?? props.className;

    if (customClass) {
      classes.push(...flattenClasses(customClass));
    }

    return resolveClasses(classes, config);
  };

  simpleComponent.variantKeys = variantKeys;

  (simpleComponent as TVReturnType<V, S> & { __tvConfig: TVComponent<V, S> }).__tvConfig = component;

  return simpleComponent as TVReturnType<V, S>;
};

/**
 * Main TV function for creating tailwind variants
 */
export const tv = <
  V extends VariantSchema = Record<string, never>,
  S extends SlotsSchema = Record<string, never>,
>(
  component: TVComponent<V, S>,
  config: Partial<TVConfig> = {},
): TVReturnType<V, S> => {
  // Validate compound variants
  if (component.compoundVariants && !Array.isArray(component.compoundVariants)) {
    throw new Error("compoundVariants must be an array");
  }

  const mergedConfig = { ...defaultConfig, ...config };

  return createTVComponent(component, mergedConfig);
};

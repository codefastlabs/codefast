import type { ClassNameValue, ConfigExtension, DefaultClassGroupIds, DefaultThemeGroupIds } from "tailwind-merge";

import { extendTailwindMerge, twMerge } from "tailwind-merge";

// Types
export interface TVConfig {
  twMerge?: boolean;
  twMergeConfig?: ConfigExtension<DefaultClassGroupIds, DefaultThemeGroupIds>;
}

export interface TVOptions {
  base?: ClassNameValue;
  compoundSlots?: {
    class?: ClassNameValue;
    className?: ClassNameValue;
    slots: string[];
    [key: string]: any;
  }[];
  compoundVariants?: {
    class?: ClassNameValue;
    className?: ClassNameValue;
    [key: string]: any;
  }[];
  defaultVariants?: Record<string, any>;
  extend?: {
    base?: ClassNameValue;
    variants?: Record<string, Record<string, any>>;
    defaultVariants?: Record<string, any>;
    compoundVariants?: {
      class?: ClassNameValue;
      className?: ClassNameValue;
      [key: string]: any;
    }[];
    compoundSlots?: {
      class?: ClassNameValue;
      className?: ClassNameValue;
      slots: string[];
      [key: string]: any;
    }[];
    slots?: Record<string, ClassNameValue>;
  };
  slots?: Record<string, ClassNameValue>;
  variants?: Record<string, Record<string, any>>;
}

// Utility functions
export const falsyToString = (value: any): string => {
  if (value === false) return "false";

  if (value === true) return "true";

  if (value === 0) return "0";

  return value;
};

export const isEmptyObject = (obj: any): boolean => {
  if (!obj || typeof obj !== "object") return true;

  return Object.keys(obj).length === 0;
};

export const isEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;

  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => obj1[key] === obj2[key]);
};

export const flat = (arr: any[], target: any[]): void => {
  for (const el of arr) {
    if (Array.isArray(el)) {
      flat(el, target);
    } else if (el) {
      target.push(el);
    }
  }
};

export const flatMergeArrays = (...arrays: any[]): any[] => {
  const result: any[] = [];

  flat(arrays, result);

  return result.filter(Boolean);
};

export const mergeObjects = (obj1: any, obj2: any): any => {
  const result: any = {};

  for (const key in obj1) {
    const val1 = obj1[key];

    if (key in obj2) {
      const val2 = obj2[key];

      if (Array.isArray(val1) || Array.isArray(val2)) {
        result[key] = flatMergeArrays(val2, val1);
      } else if (typeof val1 === "object" && typeof val2 === "object" && val1 && val2) {
        result[key] = mergeObjects(val1, val2);
      } else {
        result[key] = `${val2} ${val1}`;
      }
    } else {
      result[key] = val1;
    }
  }

  for (const key in obj2) {
    if (!(key in obj1)) {
      result[key] = obj2[key];
    }
  }

  return result;
};

export const SPACE_REGEX = /\s+/g;

export const removeExtraSpaces = (str: string): string => {
  if (!str || typeof str !== "string") return str;

  return str.replace(SPACE_REGEX, " ").trim();
};

// Default config
export const defaultConfig: TVConfig = {
  twMerge: true,
  twMergeConfig: {},
};

// Simple twMerge factory
export const createTwMerge = (config: ConfigExtension<DefaultClassGroupIds, DefaultThemeGroupIds> = {}) => {
  if (Object.keys(config).length === 0) {
    return twMerge;
  }

  return extendTailwindMerge(config);
};

// Base class name concatenation
export const cnBase = (...classes: ClassNameValue[]): string | undefined => {
  const result: any[] = [];

  flat(classes, result);

  const filtered = result.filter(Boolean);

  return filtered.length > 0 ? filtered.join(" ") : undefined;
};

// Memoized twMerge with config
let memoizedTwMerge: null | ReturnType<typeof createTwMerge> = null;
let lastConfig: ConfigExtension<DefaultClassGroupIds, DefaultThemeGroupIds> = {};

export const cn =
  (...classes: ClassNameValue[]) =>
  (config: TVConfig) => {
    const base = cnBase(classes);

    if (!base || !config.twMerge) return base;

    // Create new twMerge function only when config changes
    if (!memoizedTwMerge || !isEqual(config.twMergeConfig, lastConfig)) {
      memoizedTwMerge = createTwMerge(config.twMergeConfig);
      lastConfig = config.twMergeConfig || {};
    }

    return memoizedTwMerge(base) || undefined;
  };

// Join objects utility
export const joinObjects = (obj1: any, obj2: any): any => {
  for (const key in obj2) {
    obj1[key] = key in obj1 ? cnBase(obj1[key], obj2[key]) : obj2[key];
  }

  return obj1;
};

// Main TV function
export const tv = (options: TVOptions, configProp?: TVConfig) => {
  const {
    compoundSlots = [],
    compoundVariants: compoundVariantsProps = [],
    defaultVariants: defaultVariantsProps = {},
    extend = null,
    slots: slotProps = {},
    variants: variantsProps = {},
  } = options;

  const config = { ...defaultConfig, ...configProp };

  const base = extend?.base ? cnBase(extend.base, options?.base) : options?.base;
  const variants =
    extend?.variants && !isEmptyObject(extend.variants)
      ? mergeObjects(variantsProps, extend.variants)
      : variantsProps;
  const defaultVariants =
    extend?.defaultVariants && !isEmptyObject(extend.defaultVariants)
      ? { ...extend.defaultVariants, ...defaultVariantsProps }
      : defaultVariantsProps;

  const isExtendedSlotsEmpty = isEmptyObject(extend?.slots);
  const componentSlots = isEmptyObject(slotProps)
    ? {}
    : {
        base: cnBase(options?.base, isExtendedSlotsEmpty && extend?.base),
        ...slotProps,
      };

  const slots = isExtendedSlotsEmpty
    ? componentSlots
    : joinObjects(
        { ...extend?.slots },
        isEmptyObject(componentSlots) ? { base: options?.base } : componentSlots,
      );

  const compoundVariants = isEmptyObject(extend?.compoundVariants)
    ? compoundVariantsProps
    : flatMergeArrays(extend?.compoundVariants, compoundVariantsProps);

  const component = (props: any) => {
    if (isEmptyObject(variants) && isEmptyObject(slotProps) && isExtendedSlotsEmpty) {
      return cn(base, props?.class, props?.className)(config);
    }

    if (compoundVariants && !Array.isArray(compoundVariants)) {
      throw new TypeError(
        `The "compoundVariants" prop must be an array. Received: ${typeof compoundVariants}`,
      );
    }

    if (compoundSlots && !Array.isArray(compoundSlots)) {
      throw new TypeError(
        `The "compoundSlots" prop must be an array. Received: ${typeof compoundSlots}`,
      );
    }

    const getVariantValue = (
      variant: string,
      vrs: any = variants,
      slotProps: any = null,
    ) => {
      const variantObj = vrs[variant];

      if (!variantObj || isEmptyObject(variantObj)) {
        return null;
      }

      const variantProp = slotProps?.[variant] ?? props?.[variant];

      if (variantProp === null) return null;

      const variantKey = falsyToString(variantProp);

      const key = variantKey != null ? variantKey : falsyToString(defaultVariants?.[variant]);
      const value = variantObj[key || "false"];

      return value;
    };

    const getVariantClassNames = () => {
      if (!variants) return null;

      const keys = Object.keys(variants);
      const result: any[] = [];

      for (const key of keys) {
        const value = getVariantValue(key, variants);

        if (value) result.push(value);
      }

      return result;
    };

    const getVariantClassNamesBySlotKey = (slotKey: string, slotProps: any) => {
      if (!variants || typeof variants !== "object") return null;

      const result: any[] = [];

      for (const variant in variants) {
        const variantValue = getVariantValue(variant, variants, slotProps);

        const value =
          slotKey === "base" && typeof variantValue === "string"
            ? variantValue
            : variantValue && typeof variantValue === "object" && slotKey in variantValue
              ? variantValue[slotKey]
              : undefined;

        if (value) result.push(value);
      }

      return result;
    };

    const propsWithoutUndefined: any = {};

    for (const prop in props) {
      const value = props[prop];

      if (value !== undefined) propsWithoutUndefined[prop] = value;
    }

    const getCompleteProps = (slotProps: any) => {
      return {
        ...defaultVariants,
        ...propsWithoutUndefined,
        ...slotProps,
      };
    };

    const getCompoundVariantsValue = (cv: any[] = [], slotProps: any) => {
      const result: any[] = [];
      const cvLength = cv.length;

      for (let i = 0; i < cvLength; i++) {
        const { class: tvClass, className: tvClassName, ...compoundVariantOptions } = cv[i];
        let isValid = true;
        const completeProps = getCompleteProps(slotProps);

        for (const key in compoundVariantOptions) {
          const value = compoundVariantOptions[key];
          const completePropsValue = completeProps[key];

          if (Array.isArray(value)) {
            if (!value.includes(completePropsValue)) {
              isValid = false;
              break;
            }
          } else {
            if (
              (value == null || value === false) &&
              (completePropsValue == null || completePropsValue === false)
            )
              continue;

            if (completePropsValue !== value) {
              isValid = false;
              break;
            }
          }
        }

        if (isValid) {
          if (tvClass) result.push(tvClass);

          if (tvClassName) result.push(tvClassName);
        }
      }

      return result;
    };

    const getCompoundVariantClassNamesBySlot = (slotProps: any) => {
      const compoundClassNames = getCompoundVariantsValue(compoundVariants, slotProps);

      if (!Array.isArray(compoundClassNames)) return compoundClassNames;

      const result: any = {};
      const cnFn = cn;

      for (const className of compoundClassNames) {
        if (typeof className === "string") {
          result.base = cnFn(result.base, className)(config);
        } else if (typeof className === "object") {
          for (const slot in className) {
            result[slot] = cnFn(result[slot], className[slot])(config);
          }
        }
      }

      return result;
    };

    const getCompoundSlotClassNameBySlot = (slotProps: any) => {
      if (compoundSlots.length === 0) return null;

      const result: any = {};
      const completeProps = getCompleteProps(slotProps);

      for (const {
        class: slotClass,
        className: slotClassName,
        slots = [],
        ...slotVariants
      } of compoundSlots) {
        if (!isEmptyObject(slotVariants)) {
          let isValid = true;

          for (const key in slotVariants) {
            const completePropsValue = completeProps[key];
            const slotVariantValue = slotVariants[key];

            if (
              completePropsValue === undefined ||
              (Array.isArray(slotVariantValue)
                ? !slotVariantValue.includes(completePropsValue)
                : slotVariantValue !== completePropsValue)
            ) {
              isValid = false;
              break;
            }
          }

          if (!isValid) continue;
        }

        for (const slotName of slots) {
          if (!result[slotName]) result[slotName] = [];

          result[slotName].push([slotClass, slotClassName]);
        }
      }

      return result;
    };

    if (!isEmptyObject(slotProps) || !isExtendedSlotsEmpty) {
      const slotsFns: any = {};

      if (typeof slots === "object" && !isEmptyObject(slots)) {
        const cnFn = cn;

        for (const slotKey in slots) {
          slotsFns[slotKey] = (slotProps: any) => {
            const compoundVariantClasses = getCompoundVariantClassNamesBySlot(slotProps);
            const compoundSlotClasses = getCompoundSlotClassNameBySlot(slotProps);

            return cnFn(
              slots[slotKey],
              getVariantClassNamesBySlotKey(slotKey, slotProps),
              compoundVariantClasses ? compoundVariantClasses[slotKey] : undefined,
              compoundSlotClasses ? compoundSlotClasses[slotKey] : undefined,
              slotProps?.class,
              slotProps?.className,
            )(config);
          };
        }
      }

      return slotsFns;
    }

    return cn(
      base,
      getVariantClassNames(),
      getCompoundVariantsValue(compoundVariants, null),
      props?.class,
      props?.className,
    )(config);
  };

  const getVariantKeys = () => {
    if (!variants || typeof variants !== "object") return;

    return Object.keys(variants);
  };

  component.variantKeys = getVariantKeys();
  component.extend = extend;
  component.base = base;
  component.slots = slots;
  component.variants = variants;
  component.defaultVariants = defaultVariants;
  component.compoundSlots = compoundSlots;
  component.compoundVariants = compoundVariants;

  return component;
};

// Factory function for creating TV with default config
export const createTV = (configProp: TVConfig) => {
  return (options: TVOptions, config?: TVConfig) =>
    tv(options, config ? mergeObjects(configProp, config) : configProp);
};

import { createTwMerge } from "./cn";
import {
  isEqual,
  isEmptyObject,
  falsyToString,
  mergeObjects,
  removeExtraSpaces,
  flatMergeArrays,
} from "./utils";

// Type definitions for the main module
type ClassValue = string | number | boolean | undefined | null | Record<string, any>;
type ClassArray = ClassValue[];
type ClassProp = ClassValue | ClassArray;

type TVConfig = {
  responsiveVariants?: boolean | string[];
  twMerge?: boolean;
  twMergeConfig?: Record<string, any>;
};

type VariantConfig = Record<string, Record<string, ClassProp>>;
type SlotConfig = Record<string, ClassProp>;
type CompoundVariant = Record<string, any> & {
  class?: ClassProp;
  className?: ClassProp;
};
type CompoundSlot = Record<string, any> & {
  slots?: string[];
  class?: ClassProp;
  className?: ClassProp;
};

export const defaultConfig = {
  responsiveVariants: false,
  twMerge: true,
  twMergeConfig: {},
};

export const cnBase = (...classes: ClassProp[]): string | undefined => {
  const result: ClassValue[] = [];

  flat(classes, result);
  let string_ = "";

  for (const element of result) {
    if (element) {
      if (string_) string_ += " ";

      string_ += element;
    }
  }

  return string_ || undefined;
};

function flat(array: ClassProp[], target: ClassValue[]): void {
  for (const element of array) {
    if (Array.isArray(element)) flat(element, target);
    else if (element) target.push(element);
  }
}

let cachedTwMerge: ((classes: string) => string) | null = null;
let cachedTwMergeConfig: Record<string, any> = {};
let didTwMergeConfigChange = false;

export const cn =
  (...classes: ClassProp[]) =>
  (config: TVConfig): string | undefined => {
    const base = cnBase(...classes);

    if (!base || !config.twMerge) return base;

    if (!cachedTwMerge || didTwMergeConfigChange) {
      didTwMergeConfigChange = false;
      cachedTwMerge = createTwMerge(cachedTwMergeConfig);
    }

    return cachedTwMerge(base) || undefined;
  };

const joinObjects = (object1: Record<string, ClassProp>, object2: Record<string, ClassProp>): Record<string, ClassProp> => {
  for (const key in object2) {
    object1[key] = key in object1 ? cnBase(object1[key], object2[key]) : object2[key];
  }

  return object1;
};

type TVOptions = {
  base?: ClassProp;
  slots?: SlotConfig;
  variants?: VariantConfig;
  compoundVariants?: CompoundVariant[];
  compoundSlots?: CompoundSlot[];
  defaultVariants?: Record<string, any>;
  extend?: any;
};

export const tv = (options: TVOptions, configProperty?: TVConfig) => {
  const {
    compoundSlots = [],
    compoundVariants: compoundVariantsProps = [],
    defaultVariants: defaultVariantsProps = {},
    extend = null,
    slots: slotProps = {},
    variants: variantsProps = {},
  } = options;

  const config = { ...defaultConfig, ...configProperty };

  const base = extend?.base ? cnBase(extend.base, options?.base) : options?.base;
  const variants =
    extend?.variants && !isEmptyObject(extend.variants)
      ? mergeObjects(variantsProps, extend.variants) as VariantConfig
      : variantsProps;
  const defaultVariants =
    extend?.defaultVariants && !isEmptyObject(extend.defaultVariants)
      ? { ...extend.defaultVariants, ...defaultVariantsProps }
      : defaultVariantsProps;

  // save twMergeConfig to the cache
  if (!isEmptyObject(config.twMergeConfig) && !isEqual(config.twMergeConfig, cachedTwMergeConfig)) {
    didTwMergeConfigChange = true;
    cachedTwMergeConfig = config.twMergeConfig;
  }

  const isExtendedSlotsEmpty = isEmptyObject(extend?.slots);
  const componentSlots = isEmptyObject(slotProps)
    ? {}
    : {
        // add "base" to the slots object
        base: cnBase(options?.base, isExtendedSlotsEmpty && extend?.base),
        ...slotProps,
      };

  // merge slots with the "extended" slots
  const slots = isExtendedSlotsEmpty
    ? componentSlots
    : joinObjects(
        { ...extend?.slots },
        isEmptyObject(componentSlots) ? { base: options?.base } : componentSlots,
      );

  // merge compoundVariants with the "extended" compoundVariants
  const compoundVariants = isEmptyObject(extend?.compoundVariants)
    ? compoundVariantsProps
    : flatMergeArrays(extend?.compoundVariants, compoundVariantsProps);

  const component = (props?: Record<string, any> & { class?: ClassProp; className?: ClassProp }) => {
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

    const getScreenVariantValues = (
      screen: string,
      screenVariantValue: ClassProp,
      accumulator: string[] | Record<string, string[]> = [],
      slotKey?: string
    ): string[] | Record<string, string[]> => {
      const result = accumulator;

      if (typeof screenVariantValue === "string") {
        const cleaned = removeExtraSpaces(screenVariantValue);
        if (cleaned && Array.isArray(result)) {
          const parts = cleaned.split(" ");
          for (const part of parts) {
            result.push(`${screen}:${part}`);
          }
        }
      } else if (Array.isArray(screenVariantValue)) {
        if (Array.isArray(result)) {
          for (const element of screenVariantValue) {
            result.push(`${screen}:${element}`);
          }
        }
      } else if (
        typeof screenVariantValue === "object" &&
        screenVariantValue !== null &&
        typeof slotKey === "string" &&
        slotKey in screenVariantValue &&
        !Array.isArray(result)
      ) {
        const value = (screenVariantValue as Record<string, ClassProp>)[slotKey];

        if (value && typeof value === "string") {
          const fixedValue = removeExtraSpaces(value);
          if (fixedValue) {
            const parts = fixedValue.split(" ");
            const array: string[] = [];

            for (const part of parts) {
              array.push(`${screen}:${part}`);
            }

            result[slotKey] = result[slotKey] ? [...result[slotKey], ...array] : array;
          }
        } else if (Array.isArray(value) && value.length > 0) {
          const array: string[] = [];

          for (const element of value) {
            array.push(`${screen}:${element}`);
          }

          result[slotKey] = array;
        }
      }

      return result;
    };

    const getVariantValue = (
      variant: string,
      vrs: VariantConfig = variants,
      slotKey: string | null = null,
      slotProps: Record<string, any> | null = null
    ): ClassProp | Record<string, ClassProp> | null => {
      const variantObject = vrs[variant];

      if (!variantObject || isEmptyObject(variantObject)) {
        return null;
      }

      const variantProperty = slotProps?.[variant] ?? props?.[variant];

      if (variantProperty === null) return null;

      const variantKey = falsyToString(variantProperty);

      // responsive variants
      const responsiveVariablesEnabled =
        (Array.isArray(config.responsiveVariants) && config.responsiveVariants.length > 0) ||
        config.responsiveVariants === true;

      let defaultVariantProperty = defaultVariants?.[variant];
      let screenValues: string[] | Record<string, string[]> = [];

      if (typeof variantKey === "object" && responsiveVariablesEnabled) {
        for (const [screen, screenVariantKey] of Object.entries(variantKey)) {
          const screenVariantValue = typeof screenVariantKey === "string" ? variantObject[screenVariantKey] : undefined;

          if (screen === "initial") {
            defaultVariantProperty = screenVariantKey;
            continue;
          }

          // if the screen is not in the responsiveVariants array, skip it
          if (
            Array.isArray(config.responsiveVariants) &&
            !config.responsiveVariants.includes(screen)
          ) {
            continue;
          }

          screenValues = getScreenVariantValues(screen, screenVariantValue, screenValues, slotKey || undefined);
        }
      }

      // If there is a variant key and it's not an object (screen variants),
      // we use the variant key and ignore the default variant.
      const key =
        variantKey != null && typeof variantKey != "object"
          ? variantKey
          : falsyToString(defaultVariantProperty);

      const value = variantObject[key || "false"];

      if (
        typeof screenValues === "object" &&
        !Array.isArray(screenValues) &&
        typeof slotKey === "string" &&
        screenValues[slotKey] &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return joinObjects(screenValues, value as Record<string, ClassProp>);
      }

      if (Array.isArray(screenValues) && screenValues.length > 0) {
        if (value !== undefined && value !== null) {
          screenValues.push(String(value));
        }

        if (slotKey === "base") {
          return screenValues.join(" ");
        }

        return screenValues;
      }

      return value;
    };

    const getVariantClassNames = (): ClassProp[] | null => {
      if (!variants) return null;

      const keys = Object.keys(variants);
      const result: ClassProp[] = [];

      for (const key of keys) {
        const value = getVariantValue(key, variants, null, null);

        if (value) result.push(value);
      }

      return result;
    };

    const getVariantClassNamesBySlotKey = (
      slotKey: string,
      slotProps: Record<string, any> | null
    ): ClassProp[] | null => {
      if (!variants || typeof variants !== "object") return null;

      const result: ClassProp[] = [];

      for (const variant in variants) {
        const variantValue = getVariantValue(variant, variants, slotKey, slotProps);

        const value =
          slotKey === "base" && typeof variantValue === "string"
            ? variantValue
            : (typeof variantValue === "object" && variantValue !== null && !Array.isArray(variantValue) && slotKey in variantValue)
              ? (variantValue as Record<string, ClassProp>)[slotKey]
              : undefined;

        if (value) result.push(value);
      }

      return result;
    };

    const propsWithoutUndefined: Record<string, any> = {};

    for (const property in props) {
      const value = props?.[property];

      if (value !== undefined) propsWithoutUndefined[property] = value;
    }

    const getCompleteProps = (
      key: string | null,
      slotProps: Record<string, any> | null
    ): Record<string, any> => {
      const initialProperty =
        key && typeof props?.[key] === "object"
          ? {
              [key]: props[key]?.initial,
            }
          : {};

      return {
        ...defaultVariants,
        ...propsWithoutUndefined,
        ...initialProperty,
        ...slotProps,
      };
    };

    const getCompoundVariantsValue = (
      cv: CompoundVariant[] = [],
      slotProps: Record<string, any> | null
    ): ClassProp[] => {
      const result: ClassProp[] = [];
      const cvLength = cv.length;

      for (let index = 0; index < cvLength; index++) {
        const { class: tvClass, className: tvClassName, ...compoundVariantOptions } = cv[index];
        let isValid = true;
        const completeProps = getCompleteProps(null, slotProps);

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

    const getCompoundVariantClassNamesBySlot = (
      slotProps: Record<string, any> | null
    ): Record<string, string> | ClassProp[] => {
      const compoundClassNames = getCompoundVariantsValue(compoundVariants, slotProps);

      if (!Array.isArray(compoundClassNames)) return compoundClassNames;

      const result: Record<string, string> = {};
      const cnFunction = cn;

      for (const className of compoundClassNames) {
        if (typeof className === "string") {
          result.base = cnFunction(result.base, className)(config) || "";
        } else if (typeof className === "object" && className !== null) {
          for (const slot in className) {
            result[slot] = cnFunction(result[slot], (className as Record<string, ClassProp>)[slot])(config) || "";
          }
        }
      }

      return result;
    };

    const getCompoundSlotClassNameBySlot = (
      slotProps: Record<string, any> | null
    ): Record<string, ClassProp[][]> | null => {
      if (compoundSlots.length === 0) return null;

      const result: Record<string, ClassProp[][]> = {};
      const completeProps = getCompleteProps(null, slotProps);

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

    // with slots
    if (!isEmptyObject(slotProps) || !isExtendedSlotsEmpty) {
      const slotsFns: Record<string, (slotProps?: Record<string, any>) => string> = {};

      if (typeof slots === "object" && !isEmptyObject(slots)) {
        const cnFunction = cn;

        for (const slotKey in slots) {
          slotsFns[slotKey] = (slotProps?: Record<string, any>) => {
            const compoundVariantClasses = getCompoundVariantClassNamesBySlot(slotProps || null);
            const compoundSlotClasses = getCompoundSlotClassNameBySlot(slotProps || null);

            return cnFunction(
              (slots as Record<string, ClassProp>)[slotKey],
              getVariantClassNamesBySlotKey(slotKey, slotProps || null),
              compoundVariantClasses && typeof compoundVariantClasses === "object" && !Array.isArray(compoundVariantClasses)
                ? (compoundVariantClasses as Record<string, string>)[slotKey]
                : undefined,
              compoundSlotClasses ? compoundSlotClasses[slotKey] : undefined,
              slotProps?.class,
              slotProps?.className,
            )(config) || "";
          };
        }
      }

      return slotsFns;
    }

    // normal variants
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

export const createTV = (configProperty: TVConfig) => {
  return (options: TVOptions, config?: TVConfig) =>
    tv(options, config ? mergeObjects(configProperty as any, config as any) as TVConfig : configProperty);
};

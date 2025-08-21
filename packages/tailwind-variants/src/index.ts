import { ClassNameValue, Config, TV, TWMergeConfig } from "@/types";
import {
  isEqual,
  isEmptyObject,
  falsyToString,
  mergeObjects,
  removeExtraSpaces,
  flatMergeArrays,
  flat,
} from "@/utils";
import { createTwMerge } from "@/cn";

export const defaultConfig: Config = {
  twMerge: true,
  twMergeConfig: {},
  responsiveVariants: false,
};

export const cnBase = (...classes: ClassNameValue[]): string | undefined => {
  const result: string[] = [];

  flat(classes, result);
  let str = "";

  for (let i = 0; i < result.length; i++) {
    if (result[i]) {
      if (str) str += " ";
      str += result[i];
    }
  }

  return str || undefined;
};

let cachedTwMerge: ((...classes: ClassNameValue[]) => string) | null = null;
let cachedTwMergeConfig: TWMergeConfig = {};
let didTwMergeConfigChange = false;

export const cn =
  (...classes: ClassNameValue[]) =>
  (config?: Config): string | undefined => {
    const base = cnBase(classes);

    if (!base || !config?.twMerge) {
      return base;
    }

    if (!cachedTwMerge || didTwMergeConfigChange) {
      didTwMergeConfigChange = false;
      cachedTwMerge = createTwMerge(cachedTwMergeConfig || {});
    }

    return cachedTwMerge(base) || undefined;
  };

const joinObjects = (obj1: any, obj2: any): any => {
  for (const key in obj2) {
    if (key in obj1) {
      obj1[key] = cnBase(obj1[key], obj2[key]);
    } else {
      obj1[key] = obj2[key];
    }
  }

  return obj1;
};

export const tv: TV = (options, configProp) => {
  const {
    extend = null,
    slots: slotProps = {},
    variants: variantsProps = {},
    compoundVariants: compoundVariantsProps = [],
    compoundSlots = [],
    defaultVariants: defaultVariantsProps = {},
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

  // save twMergeConfig to the cache
  if (!isEmptyObject(config.twMergeConfig) && !isEqual(config.twMergeConfig, cachedTwMergeConfig)) {
    didTwMergeConfigChange = true;
    cachedTwMergeConfig = config.twMergeConfig || {};
  }

  const isExtendedSlotsEmpty = isEmptyObject(extend?.slots);
  const componentSlots = !isEmptyObject(slotProps)
    ? {
        // add "base" to the "slots" object
        base: cnBase(options?.base, isExtendedSlotsEmpty && extend?.base),
        ...slotProps,
      }
    : {};

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

  const component = (props: any = {}) => {
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
      screenVariantValue: any,
      acc: any = [],
      slotKey?: string,
    ) => {
      let result = acc;

      if (typeof screenVariantValue === "string") {
        const cleaned = removeExtraSpaces(screenVariantValue) as string;
        const parts = cleaned.split(" ");

        for (let i = 0; i < parts.length; i++) {
          result.push(`${screen}:${parts[i]}`);
        }
      } else if (Array.isArray(screenVariantValue)) {
        for (let i = 0; i < screenVariantValue.length; i++) {
          result.push(`${screen}:${screenVariantValue[i]}`);
        }
      } else if (typeof screenVariantValue === "object" && typeof slotKey === "string") {
        if (slotKey in screenVariantValue) {
          const value = screenVariantValue[slotKey];

          if (value && typeof value === "string") {
            const fixedValue = removeExtraSpaces(value) as string;
            const parts = fixedValue.split(" ");
            const arr: string[] = [];

            for (let i = 0; i < parts.length; i++) {
              arr.push(`${screen}:${parts[i]}`);
            }
            if (typeof result === "object" && result !== null) {
              result[slotKey] = result[slotKey] ? result[slotKey].concat(arr) : arr;
            }
          } else if (Array.isArray(value) && value.length > 0) {
            const arr: string[] = [];

            for (let i = 0; i < value.length; i++) {
              arr.push(`${screen}:${value[i]}`);
            }
            if (typeof result === "object" && result !== null) {
              result[slotKey] = arr;
            }
          }
        }
      }

      return result;
    };

    const getVariantValue = (
      variant: string,
      vrs: any = variants,
      slotKey?: string,
      slotProps?: any,
    ) => {
      const variantObj = vrs[variant];

      if (!variantObj || isEmptyObject(variantObj)) {
        return null;
      }

      const variantProp = slotProps?.[variant] ?? props?.[variant];

      if (variantProp === null) return null;

      const variantKey = falsyToString(variantProp);

      // responsive variants
      const responsiveVarsEnabled =
        (Array.isArray(config.responsiveVariants) && config.responsiveVariants.length > 0) ||
        config.responsiveVariants === true;

      let defaultVariantProp = defaultVariants?.[variant];
      let screenValues: any = [];

      if (typeof variantKey === "object" && responsiveVarsEnabled) {
        for (const [screen, screenVariantKey] of Object.entries(variantKey)) {
          const screenVariantValue = variantObj[screenVariantKey as string];

          if (screen === "initial") {
            defaultVariantProp = screenVariantKey;
            continue;
          }

          // if the screen is not in the responsiveVariants array, skip it
          if (
            Array.isArray(config.responsiveVariants) &&
            !config.responsiveVariants.includes(screen)
          ) {
            continue;
          }

          screenValues = getScreenVariantValues(screen, screenVariantValue, screenValues, slotKey);
        }
      }

      // If there is a variant key and it's not an object (screen variants),
      // we use the variant key and ignore the default variant.
      const key =
        variantKey != null && typeof variantKey != "object"
          ? variantKey
          : falsyToString(defaultVariantProp);

      const value = variantObj[String(key || "false")];

      if (
        typeof screenValues === "object" &&
        typeof slotKey === "string" &&
        screenValues[slotKey]
      ) {
        return joinObjects(screenValues, value);
      }

      if (screenValues.length > 0) {
        screenValues.push(value);

        if (slotKey === "base") {
          return screenValues.join(" ");
        }

        return screenValues;
      }

      return value;
    };

    const getVariantClassNames = () => {
      if (!variants) return [];

      const keys = Object.keys(variants);
      const result: any[] = [];

      for (let i = 0; i < keys.length; i++) {
        const value = getVariantValue(keys[i], variants);

        if (value) result.push(value);
      }

      return result;
    };

    const getVariantClassNamesBySlotKey = (slotKey: string, slotProps: any) => {
      if (!variants || typeof variants !== "object") return [];

      const result: any[] = [];

      for (const variant in variants) {
        const variantValue = getVariantValue(variant, variants, slotKey, slotProps);

        const value =
          slotKey === "base" && typeof variantValue === "string"
            ? variantValue
            : variantValue && variantValue[slotKey];

        if (value) result.push(value);
      }

      return result;
    };

    const propsWithoutUndefined: any = {};

    for (const prop in props) {
      const value = props[prop];

      if (value !== undefined) propsWithoutUndefined[prop] = value;
    }

    const getCompleteProps = (key: string | null, slotProps: any) => {
      const initialProp =
        typeof props?.[key as string] === "object"
          ? {
              [key as string]: props[key as string]?.initial,
            }
          : {};

      return {
        ...defaultVariants,
        ...propsWithoutUndefined,
        ...initialProp,
        ...slotProps,
      };
    };

    const getCompoundVariantsValue = (cv: any[] = [], slotProps: any) => {
      const result: any[] = [];
      const cvLength = cv.length;

      for (let i = 0; i < cvLength; i++) {
        const cvItem = cv[i];
        const { class: tvClass, className: tvClassName, ...compoundVariantOptions } = cvItem;
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

    const getCompoundVariantClassNamesBySlot = (slotProps: any) => {
      const compoundClassNames = getCompoundVariantsValue(compoundVariants, slotProps);

      if (!Array.isArray(compoundClassNames)) return compoundClassNames;

      const result: any = {};
      const cnFn = cn;

      for (let i = 0; i < compoundClassNames.length; i++) {
        const className = compoundClassNames[i];

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
      if (compoundSlots.length < 1) return null;

      const result: any = {};
      const completeProps = getCompleteProps(null, slotProps);

      for (let i = 0; i < compoundSlots.length; i++) {
        const compoundSlot = compoundSlots[i];
        const {
          slots = [],
          class: slotClass,
          className: slotClassName,
          ...slotVariants
        } = compoundSlot;

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

        for (let j = 0; j < slots.length; j++) {
          const slotName = slots[j];

          if (!result[slotName]) result[slotName] = [];
          result[slotName].push([slotClass, slotClassName]);
        }
      }

      return result;
    };

    // with slots
    if (!isEmptyObject(slotProps) || !isExtendedSlotsEmpty) {
      const slotsFns: any = {};

      if (typeof slots === "object" && !isEmptyObject(slots)) {
        const cnFn = cn;

        for (const slotKey in slots) {
          slotsFns[slotKey] = (slotProps: any = {}) => {
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

    // normal variants
    return cn(
      base,
      getVariantClassNames(),
      getCompoundVariantsValue(compoundVariants, {}),
      props?.class,
      props?.className,
    )(config);
  };

  const getVariantKeys = () => {
    if (!variants || typeof variants !== "object") return undefined;

    return Object.keys(variants);
  };

  (component as any).extend = extend;
  (component as any).base = base;
  (component as any).slots = slots;
  (component as any).variants = variants;
  (component as any).defaultVariants = defaultVariants;
  (component as any).compoundVariants = compoundVariants;
  (component as any).compoundSlots = compoundSlots;
  (component as any).variantKeys = getVariantKeys();

  return component as any;
};

export const createTV = (configProp: Config): TV => {
  return (options, config) => tv(options, config ? mergeObjects(configProp, config) : configProp);
};

// Export types
export type {
  ClassNameValue,
  ClassNameProp,
  OmitUndefined,
  StringToBoolean,
  isTrueOrArray,
  WithInitialScreen,
  Variants,
  CompoundVariants,
  CompoundSlots,
  DefaultVariants,
  ScreenPropsValue,
  Props,
  VariantKeys,
  ReturnProps,
  ReturnType,
  TV,
  Config,
  VariantProps,
} from "@/types";

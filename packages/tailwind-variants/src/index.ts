import { createTwMerge } from "./cn";
import {
  isEqual,
  isEmptyObject,
  falsyToString,
  mergeObjects,
  removeExtraSpaces,
  flatMergeArrays,
} from "./utils";

export const defaultConfig = {
  responsiveVariants: false,
  twMerge: true,
  twMergeConfig: {},
};

export const cnBase = (...classes) => {
  const result = [];

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

function flat(array, target) {
  for (const element of array) {
    if (Array.isArray(element)) flat(element, target);
    else if (element) target.push(element);
  }
}

let cachedTwMerge = null;
let cachedTwMergeConfig = {};
let didTwMergeConfigChange = false;

export const cn =
  (...classes) =>
  (config) => {
    const base = cnBase(classes);

    if (!base || !config.twMerge) return base;

    if (!cachedTwMerge || didTwMergeConfigChange) {
      didTwMergeConfigChange = false;
      cachedTwMerge = createTwMerge(cachedTwMergeConfig);
    }

    return cachedTwMerge(base) || undefined;
  };

const joinObjects = (object1, object2) => {
  for (const key in object2) {
    object1[key] = key in object1 ? cnBase(object1[key], object2[key]) : object2[key];
  }

  return object1;
};

export const tv = (options, configProperty) => {
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
      ? mergeObjects(variantsProps, extend.variants)
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

  const component = (props) => {
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

    const getScreenVariantValues = (screen, screenVariantValue, accumulator = [], slotKey) => {
      const result = accumulator;

      if (typeof screenVariantValue === "string") {
        const cleaned = removeExtraSpaces(screenVariantValue);
        const parts = cleaned.split(" ");

        for (const part of parts) {
          result.push(`${screen}:${part}`);
        }
      } else if (Array.isArray(screenVariantValue)) {
        for (const element of screenVariantValue) {
          result.push(`${screen}:${element}`);
        }
      } else if (
        typeof screenVariantValue === "object" &&
        typeof slotKey === "string" &&
        slotKey in screenVariantValue
      ) {
        const value = screenVariantValue[slotKey];

        if (value && typeof value === "string") {
          const fixedValue = removeExtraSpaces(value);
          const parts = fixedValue.split(" ");
          const array = [];

          for (const part of parts) {
            array.push(`${screen}:${part}`);
          }

          result[slotKey] = result[slotKey] ? [...result[slotKey], ...array] : array;
        } else if (Array.isArray(value) && value.length > 0) {
          const array = [];

          for (const element of value) {
            array.push(`${screen}:${element}`);
          }

          result[slotKey] = array;
        }
      }

      return result;
    };

    const getVariantValue = (variant, vrs = variants, slotKey = null, slotProps = null) => {
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
      let screenValues = [];

      if (typeof variantKey === "object" && responsiveVariablesEnabled) {
        for (const [screen, screenVariantKey] of Object.entries(variantKey)) {
          const screenVariantValue = variantObject[screenVariantKey];

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

          screenValues = getScreenVariantValues(screen, screenVariantValue, screenValues, slotKey);
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
      if (!variants) return null;

      const keys = Object.keys(variants);
      const result = [];

      for (const key of keys) {
        const value = getVariantValue(key, variants);

        if (value) result.push(value);
      }

      return result;
    };

    const getVariantClassNamesBySlotKey = (slotKey, slotProps) => {
      if (!variants || typeof variants !== "object") return null;

      const result = [];

      for (const variant in variants) {
        const variantValue = getVariantValue(variant, variants, slotKey, slotProps);

        const value =
          slotKey === "base" && typeof variantValue === "string"
            ? variantValue
            : variantValue?.[slotKey];

        if (value) result.push(value);
      }

      return result;
    };

    const propsWithoutUndefined = {};

    for (const property in props) {
      const value = props[property];

      if (value !== undefined) propsWithoutUndefined[property] = value;
    }

    const getCompleteProps = (key, slotProps) => {
      const initialProperty =
        typeof props?.[key] === "object"
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

    const getCompoundVariantsValue = (cv = [], slotProps) => {
      const result = [];
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

    const getCompoundVariantClassNamesBySlot = (slotProps) => {
      const compoundClassNames = getCompoundVariantsValue(compoundVariants, slotProps);

      if (!Array.isArray(compoundClassNames)) return compoundClassNames;

      const result = {};
      const cnFunction = cn;

      for (const className of compoundClassNames) {
        if (typeof className === "string") {
          result.base = cnFunction(result.base, className)(config);
        } else if (typeof className === "object") {
          for (const slot in className) {
            result[slot] = cnFunction(result[slot], className[slot])(config);
          }
        }
      }

      return result;
    };

    const getCompoundSlotClassNameBySlot = (slotProps) => {
      if (compoundSlots.length === 0) return null;

      const result = {};
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
      const slotsFns = {};

      if (typeof slots === "object" && !isEmptyObject(slots)) {
        const cnFunction = cn;

        for (const slotKey in slots) {
          slotsFns[slotKey] = (slotProps) => {
            const compoundVariantClasses = getCompoundVariantClassNamesBySlot(slotProps);
            const compoundSlotClasses = getCompoundSlotClassNameBySlot(slotProps);

            return cnFunction(
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
      getCompoundVariantsValue(compoundVariants),
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

export const createTV = (configProperty) => {
  return (options, config) =>
    tv(options, config ? mergeObjects(configProperty, config) : configProperty);
};

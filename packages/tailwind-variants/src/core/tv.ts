import type { TV } from "@/types";
import { defaultConfig } from "@/core/config";
import { cn, cnBase } from "@/cn";
import { falsyToString, isEmptyObject, flatMergeArrays, mergeObjects } from "@/utils";
import { joinObjects } from "@/cn";

export const tv: TV = (options, configProp) => {
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
        // add "base" to the "slots" object
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

    const getVariantValue = (variant: string, vrs: any = variants, slotProps?: any) => {
      const variantObj = vrs[variant];

      if (!variantObj || isEmptyObject(variantObj)) {
        return null;
      }

      const variantProp = slotProps?.[variant] ?? props?.[variant];

      if (variantProp === null) return null;

      const variantKey = falsyToString(variantProp);
      const defaultVariantProp = defaultVariants?.[variant];

      if (typeof variantKey === "object") {
        // Use default variant if object is provided
        const key = falsyToString(defaultVariantProp);

        return variantObj[String(key || "false")];
      }

      const key = variantKey == null ? falsyToString(defaultVariantProp) : variantKey;

      return variantObj[String(key || "false")];
    };

    const getVariantClassNames = () => {
      if (!variants) return [];

      const keys = Object.keys(variants);
      const result: any[] = [];

      for (const key of keys) {
        const value = getVariantValue(key, variants);

        if (value) result.push(value);
      }

      return result;
    };

    const getVariantClassNamesBySlotKey = (slotKey: string, slotProps: any) => {
      if (!variants || typeof variants !== "object") return [];

      const result: any[] = [];

      for (const variant in variants) {
        const variantValue = getVariantValue(variant, variants, slotProps);

        const value =
          slotKey === "base" && typeof variantValue === "string"
            ? variantValue
            : variantValue?.[slotKey];

        if (value) result.push(value);
      }

      return result;
    };

    const propsWithoutUndefined: any = {};

    for (const prop in props) {
      const value = props[prop];

      if (value !== undefined) propsWithoutUndefined[prop] = value;
    }

    const getCompleteProps = (key: null | string, slotProps: any) => {
      const initialProp =
        typeof props?.[key!] === "object"
          ? {
              [key!]: props[key!]?.initial,
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
      const completeProps = getCompleteProps(null, slotProps);

      for (const compoundSlot of compoundSlots) {
        const {
          class: slotClass,
          className: slotClassName,
          slots = [],
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

        for (const slotName of slots) {
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
    if (!variants || typeof variants !== "object") return;

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

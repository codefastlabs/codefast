import clsx from "clsx";

import type { TV } from "@/types";

import { cn, joinObjects } from "@/cn";
import { defaultConfig } from "@/core/config";
import { falsyToString, flatMergeArrays, isEmptyObject, mergeObjects } from "@/utils";

export const tv: TV = (options, configProp) => {
  const {
    compoundSlots = [],
    compoundVariants: compoundVariantsProps = [],
    defaultVariants: defaultVariantsProps = {},
    extend = null,
    slots: slotProps = {},
    variants: variantsProps = {},
  } = options;

  const mergedConfig = { ...defaultConfig, ...configProp };

  const baseClasses = extend?.base ? clsx(extend.base, options?.base) : options?.base;
  const mergedVariants =
    extend?.variants && !isEmptyObject(extend.variants)
      ? mergeObjects(variantsProps, extend.variants)
      : variantsProps;
  const mergedDefaultVariants =
    extend?.defaultVariants && !isEmptyObject(extend.defaultVariants)
      ? { ...extend.defaultVariants, ...defaultVariantsProps }
      : defaultVariantsProps;

  const hasExtendedSlots = !isEmptyObject(extend?.slots);
  const componentSlots = isEmptyObject(slotProps)
    ? {}
    : {
        // add "base" to the "slots" object
        base: clsx(options?.base, !hasExtendedSlots && extend?.base),
        ...slotProps,
      };

  // merge slots with the "extended" slots
  const mergedSlots = hasExtendedSlots
    ? joinObjects(
        { ...extend?.slots },
        isEmptyObject(componentSlots) ? { base: options?.base } : componentSlots,
      )
    : componentSlots;

  // merge compoundVariants with the "extended" compoundVariants
  const mergedCompoundVariants = isEmptyObject(extend?.compoundVariants)
    ? compoundVariantsProps
    : flatMergeArrays(extend?.compoundVariants, compoundVariantsProps);

  const component = (props: any = {}) => {
    if (isEmptyObject(mergedVariants) && isEmptyObject(slotProps) && !hasExtendedSlots) {
      const simpleClasses = clsx(baseClasses, props?.class, props?.className);

      return cn(simpleClasses)(mergedConfig);
    }

    if (mergedCompoundVariants && !Array.isArray(mergedCompoundVariants)) {
      throw new TypeError(
        `The "compoundVariants" prop must be an array. Received: ${typeof mergedCompoundVariants}`,
      );
    }

    if (compoundSlots && !Array.isArray(compoundSlots)) {
      throw new TypeError(
        `The "compoundSlots" prop must be an array. Received: ${typeof compoundSlots}`,
      );
    }

    const getVariantValue = (
      variantKey: string,
      variantDefinitions: any = mergedVariants,
      slotProps?: any,
    ) => {
      const variantDefinition = variantDefinitions[variantKey];

      if (!variantDefinition || isEmptyObject(variantDefinition)) {
        return null;
      }

      const variantPropValue = slotProps?.[variantKey] ?? props?.[variantKey];

      if (variantPropValue === null) return null;

      const variantStringValue = falsyToString(variantPropValue);
      const defaultVariantValue = mergedDefaultVariants?.[variantKey];

      if (typeof variantStringValue === "object") {
        // Use default variant if object is provided
        const defaultKey = falsyToString(defaultVariantValue);

        return variantDefinition[String(defaultKey || "false")];
      }

      const finalVariantKey =
        variantStringValue == null ? falsyToString(defaultVariantValue) : variantStringValue;

      return variantDefinition[String(finalVariantKey || "false")];
    };

    const getVariantClassNames = () => {
      if (!mergedVariants) return [];

      const variantKeys = Object.keys(mergedVariants);
      const variantClassNames: any[] = [];

      for (const variantKey of variantKeys) {
        const variantValue = getVariantValue(variantKey, mergedVariants);

        if (variantValue) variantClassNames.push(variantValue);
      }

      return variantClassNames;
    };

    const getVariantClassNamesBySlotKey = (slotKey: string, slotProps: any) => {
      if (!mergedVariants || typeof mergedVariants !== "object") return [];

      const slotVariantClassNames: any[] = [];

      for (const variantKey in mergedVariants) {
        const variantValue = getVariantValue(variantKey, mergedVariants, slotProps);

        const slotVariantValue =
          slotKey === "base" && typeof variantValue === "string"
            ? variantValue
            : variantValue?.[slotKey];

        if (slotVariantValue) slotVariantClassNames.push(slotVariantValue);
      }

      return slotVariantClassNames;
    };

    const propsWithoutUndefined: any = {};

    for (const propKey in props) {
      const propValue = props[propKey];

      if (propValue !== undefined) propsWithoutUndefined[propKey] = propValue;
    }

    const getCompleteProps = (key: null | string, slotProps: any) => {
      const initialPropValue =
        typeof props?.[key!] === "object"
          ? {
              [key!]: props[key!]?.initial,
            }
          : {};

      return {
        ...mergedDefaultVariants,
        ...propsWithoutUndefined,
        ...initialPropValue,
        ...slotProps,
      };
    };

    const getCompoundVariantsValue = (compoundVariantsArray: any[] = [], slotProps: any) => {
      const compoundVariantClassNames: any[] = [];
      const compoundVariantsCount = compoundVariantsArray.length;

      for (let i = 0; i < compoundVariantsCount; i++) {
        const compoundVariantItem = compoundVariantsArray[i];
        const {
          class: tvClass,
          className: tvClassName,
          ...compoundVariantOptions
        } = compoundVariantItem;
        let isCompoundVariantValid = true;
        const completeProps = getCompleteProps(null, slotProps);

        for (const optionKey in compoundVariantOptions) {
          const optionValue = compoundVariantOptions[optionKey];
          const completePropsValue = completeProps[optionKey];

          if (Array.isArray(optionValue)) {
            if (!optionValue.includes(completePropsValue)) {
              isCompoundVariantValid = false;
              break;
            }
          } else {
            if (
              (optionValue == null || optionValue === false) &&
              (completePropsValue == null || completePropsValue === false)
            )
              continue;

            if (completePropsValue !== optionValue) {
              isCompoundVariantValid = false;
              break;
            }
          }
        }

        if (isCompoundVariantValid) {
          if (tvClass) compoundVariantClassNames.push(tvClass);

          if (tvClassName) compoundVariantClassNames.push(tvClassName);
        }
      }

      return compoundVariantClassNames;
    };

    const getCompoundVariantClassNamesBySlot = (slotProps: any) => {
      const compoundVariantClassNames = getCompoundVariantsValue(mergedCompoundVariants, slotProps);

      if (!Array.isArray(compoundVariantClassNames)) return compoundVariantClassNames;

      const slotCompoundResult: any = {};
      const cnFunction = cn;

      for (const className of compoundVariantClassNames) {
        if (typeof className === "string") {
          slotCompoundResult.base = cnFunction(slotCompoundResult.base, className)(mergedConfig);
        } else if (typeof className === "object") {
          for (const slotKey in className) {
            slotCompoundResult[slotKey] = cnFunction(
              slotCompoundResult[slotKey],
              className[slotKey],
            )(mergedConfig);
          }
        }
      }

      return slotCompoundResult;
    };

    const getCompoundSlotClassNameBySlot = (slotProps: any) => {
      if (compoundSlots.length === 0) return null;

      const compoundSlotResult: any = {};
      const completeProps = getCompleteProps(null, slotProps);

      for (const compoundSlotItem of compoundSlots) {
        const {
          class: slotClass,
          className: slotClassName,
          slots = [],
          ...slotVariants
        } = compoundSlotItem;

        if (!isEmptyObject(slotVariants)) {
          let isSlotVariantValid = true;

          for (const variantKey in slotVariants) {
            const completePropsValue = completeProps[variantKey];
            const slotVariantValue = slotVariants[variantKey];

            if (
              completePropsValue === undefined ||
              (Array.isArray(slotVariantValue)
                ? !slotVariantValue.includes(completePropsValue)
                : slotVariantValue !== completePropsValue)
            ) {
              isSlotVariantValid = false;
              break;
            }
          }

          if (!isSlotVariantValid) continue;
        }

        for (const slotName of slots) {
          if (!compoundSlotResult[slotName]) compoundSlotResult[slotName] = [];

          // Use clsx to handle class and className arrays efficiently
          const slotClasses = clsx(slotClass, slotClassName);

          if (slotClasses) {
            compoundSlotResult[slotName].push(slotClasses);
          }
        }
      }

      return compoundSlotResult;
    };

    // with slots
    if (!isEmptyObject(slotProps) || hasExtendedSlots) {
      const slotFunctions: any = {};

      if (typeof mergedSlots === "object" && !isEmptyObject(mergedSlots)) {
        const cnFunction = cn;

        for (const slotKey in mergedSlots) {
          slotFunctions[slotKey] = (slotProps: any = {}) => {
            const compoundVariantClasses = getCompoundVariantClassNamesBySlot(slotProps);
            const compoundSlotClasses = getCompoundSlotClassNameBySlot(slotProps);

            // Use clsx to efficiently combine all class sources
            const allSlotClasses = clsx(
              mergedSlots[slotKey],
              getVariantClassNamesBySlotKey(slotKey, slotProps),
              compoundVariantClasses ? compoundVariantClasses[slotKey] : undefined,
              compoundSlotClasses ? compoundSlotClasses[slotKey] : undefined,
              slotProps?.class,
              slotProps?.className,
            );

            return cnFunction(allSlotClasses)(mergedConfig);
          };
        }
      }

      return slotFunctions;
    }

    // normal variants
    const allVariantClasses = clsx(
      baseClasses,
      getVariantClassNames(),
      getCompoundVariantsValue(mergedCompoundVariants, {}),
      props?.class,
      props?.className,
    );

    return cn(allVariantClasses)(mergedConfig);
  };

  const getVariantKeys = () => {
    if (!mergedVariants || typeof mergedVariants !== "object") return;

    return Object.keys(mergedVariants);
  };

  (component as any).extend = extend;
  (component as any).base = baseClasses;
  (component as any).slots = mergedSlots;
  (component as any).variants = mergedVariants;
  (component as any).defaultVariants = mergedDefaultVariants;
  (component as any).compoundVariants = mergedCompoundVariants;
  (component as any).compoundSlots = compoundSlots;
  (component as any).variantKeys = getVariantKeys();

  return component as any;
};

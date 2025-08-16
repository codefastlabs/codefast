import type { ClassNameValue as ClassValue } from "tailwind-merge";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import { falsyToString, flatMergeArrays, isEmptyObject, isEqual, mergeObjects } from "@/utils";

/**
 * ----------------------------------------
 * Utility Functions
 * ----------------------------------------
 */

export const createTwMerge = (cachedTwMergeConfig: MergeConfig) => {
  return (classes: string): string => {
    const twMergeFn = isEmptyObject(cachedTwMergeConfig)
      ? twMerge
      : extendTailwindMerge(cachedTwMergeConfig);

    return twMergeFn(classes);
  };
};

/**
 * ----------------------------------------
 * Config Types
 * ----------------------------------------
 */

import type { ConfigExtension } from "tailwind-merge";

export type MergeConfig = ConfigExtension<string, string>;

export interface TWMConfig {
  /**
   * Whether to merge the class names with `tailwind-merge` library.
   * It's avoid to have duplicate tailwind classes. (Recommended)
   * @see https://github.com/dcastil/tailwind-merge/blob/v2.2.0/README.md
   * @default true
   */
  twMerge?: boolean;
  /**
   * The config object for `tailwind-merge` library.
   * @see https://github.com/dcastil/tailwind-merge/blob/v2.2.0/docs/configuration.md
   */
  twMergeConfig?: MergeConfig;
}

export type TVConfig = TWMConfig;

/**
 * ----------------------------------------
 * Base Types
 * ----------------------------------------
 */

export type ClassProp<V extends unknown = ClassValue> =
  | { class?: never; className?: V }
  | { class?: V; className?: never };

type TVBaseName = "base";

type TVSlots = Record<string, ClassValue> | undefined;

/**
 * ----------------------------------------------------------------------
 * Utils
 * ----------------------------------------------------------------------
 */

export type OmitUndefined<T> = T extends undefined ? never : T;

export type StringToBoolean<T> = T extends "false" | "true" ? boolean : T;

export type CnOptions = ClassValue[];

export type CnReturn = string | undefined;

// compare if the value is true or array of values
export type isTrueOrArray<T> = T extends true | unknown[] ? true : false;

/**
 * ----------------------------------------------------------------------
 * TV Types
 * ----------------------------------------------------------------------
 */

type TVSlotsWithBase<S extends TVSlots, B extends ClassValue> = B extends undefined
  ? keyof S
  : keyof S | TVBaseName;

type SlotsClassValue<S extends TVSlots, B extends ClassValue> = Partial<
  Record<TVSlotsWithBase<S, B>, ClassValue>
>;

type TVVariantsDefault<S extends TVSlots, B extends ClassValue> = S extends undefined
  ? {}
  : Record<
      string,
      Record<string, S extends TVSlots ? ClassValue | SlotsClassValue<S, B> : ClassValue>
    >;

export type TVVariants<
  S extends TVSlots | undefined,
  B extends ClassValue | undefined = undefined,
  EV extends TVVariants<ES> | undefined = undefined,
  ES extends TVSlots | undefined = undefined,
> = EV extends undefined
  ? TVVariantsDefault<S, B>
  :
      | {
          [K in keyof EV]: {
            [K2 in keyof EV[K]]: S extends TVSlots
              ? ClassValue | SlotsClassValue<S, B>
              : ClassValue;
          };
        }
      | TVVariantsDefault<S, B>;

export type TVCompoundVariants<
  V extends TVVariants<S>,
  S extends TVSlots,
  B extends ClassValue,
  EV extends TVVariants<ES>,
  ES extends TVSlots,
> = ({
  [K in keyof EV | keyof V]?:
    | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
    | (K extends keyof V ? StringToBoolean<keyof V[K]> : never)
    | (K extends keyof V ? StringToBoolean<keyof V[K]>[] : never);
} & ClassProp<ClassValue | SlotsClassValue<S, B>>)[];

export type TVCompoundSlots<
  V extends TVVariants<S>,
  S extends TVSlots,
  B extends ClassValue,
> = (V extends undefined
  ? {
      slots: TVSlotsWithBase<S, B>[];
    } & ClassProp
  : {
      slots: TVSlotsWithBase<S, B>[];
    } & {
      [K in keyof V]?: StringToBoolean<keyof V[K]> | StringToBoolean<keyof V[K]>[];
    } & ClassProp)[];

export type TVDefaultVariants<
  V extends TVVariants<S>,
  S extends TVSlots,
  EV extends TVVariants<ES>,
  ES extends TVSlots,
> = {
  [K in keyof EV | keyof V]?:
    | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
    | (K extends keyof V ? StringToBoolean<keyof V[K]> : never);
};

export type TVProps<
  V extends TVVariants<S>,
  S extends TVSlots,
  EV extends TVVariants<ES>,
  ES extends TVSlots,
> = EV extends undefined
  ? V extends undefined
    ? ClassProp
    : {
        [K in keyof V]?: StringToBoolean<keyof V[K]> | undefined;
      } & ClassProp
  : V extends undefined
    ? {
        [K in keyof EV]?: StringToBoolean<keyof EV[K]> | undefined;
      } & ClassProp
    : {
        [K in keyof EV | keyof V]?:
          | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
          | (K extends keyof V ? StringToBoolean<keyof V[K]> : never)
          | undefined;
      } & ClassProp;

export type TVVariantKeys<V extends TVVariants<S>, S extends TVSlots> = V extends object
  ? (keyof V)[]
  : undefined;

export interface TVReturnProps<
  V extends TVVariants<S>,
  S extends TVSlots,
  B extends ClassValue,
  EV extends TVVariants<ES>,
  ES extends TVSlots,
  // @ts-expect-error
  E extends TVReturnType = undefined,
> {
  base: B;
  compoundSlots: TVCompoundSlots<V, S, B>;
  compoundVariants: TVCompoundVariants<V, S, B, EV, ES>;
  defaultVariants: TVDefaultVariants<V, S, EV, ES>;
  extend: E;
  slots: S;
  variantKeys: TVVariantKeys<V, S>;
  variants: V;
}

type HasSlots<S extends TVSlots, ES extends TVSlots> = S extends undefined
  ? ES extends undefined
    ? false
    : true
  : true;

export type TVReturnType<
  V extends TVVariants<S>,
  S extends TVSlots,
  B extends ClassValue,
  EV extends TVVariants<ES>,
  ES extends TVSlots,
  // @ts-expect-error
  E extends TVReturnType = undefined,
> = ((props?: TVProps<V, S, EV, ES>) => HasSlots<S, ES> extends true
  ? {
      [K in keyof (ES extends undefined ? {} : ES)]: (slotProps?: TVProps<V, S, EV, ES>) => string;
    } & {
      [K in keyof (S extends undefined ? {} : S)]: (slotProps?: TVProps<V, S, EV, ES>) => string;
    } & Record<TVSlotsWithBase<{}, B>, (slotProps?: TVProps<V, S, EV, ES>) => string>
  : string) &
  TVReturnProps<V, S, B, EV, ES, E>;

export type TV = <
  V extends TVVariants<S, B, EV>,
  CV extends TVCompoundVariants<V, S, B, EV, ES>,
  DV extends TVDefaultVariants<V, S, EV, ES>,
  B extends ClassValue = undefined,
  S extends TVSlots = undefined,
  // @ts-expect-error
  E extends TVReturnType = TVReturnType<
    V,
    S,
    B,
    // @ts-expect-error
    EV extends undefined ? {} : EV,
    // @ts-expect-error
    ES extends undefined ? {} : ES
  >,
  EV extends TVVariants<ES, B, E["variants"], ES> = E["variants"],
  ES extends TVSlots = E["slots"] extends TVSlots ? E["slots"] : undefined,
>(
  options: {
    /**
     * Extend allows for easy composition of components.
     * @see https://www.tailwind-variants.org/docs/composing-components
     */
    extend?: E;
    /**
     * Base allows you to set a base class for a component.
     */
    base?: B;
    /**
     * Slots allow you to separate a component into multiple parts.
     * @see https://www.tailwind-variants.org/docs/slots
     */
    slots?: S;
    /**
     * Variants allow you to create multiple versions of the same component.
     * @see https://www.tailwind-variants.org/docs/variants#adding-variants
     */
    variants?: V;
    /**
     * Compound variants allow you to apply classes to multiple variants at once.
     * @see https://www.tailwind-variants.org/docs/variants#compound-variants
     */
    compoundVariants?: CV;
    /**
     * Compound slots allow you to apply classes to multiple slots at once.
     */
    compoundSlots?: TVCompoundSlots<V, S, B>;
    /**
     * Default variants allow you to set default variants for a component.
     * @see https://www.tailwind-variants.org/docs/variants#default-variants
     */
    defaultVariants?: DV;
  },
  /**
   * The config object allows you to modify the default configuration.
   * @see https://www.tailwind-variants.org/docs/api-reference#config-optional
   */
  config?: TVConfig,
) => TVReturnType<V, S, B, EV, ES, E>;

export type CreateTV = <
  V extends TVVariants<S, B, EV>,
  CV extends TVCompoundVariants<V, S, B, EV, ES>,
  DV extends TVDefaultVariants<V, S, EV, ES>,
  B extends ClassValue = undefined,
  S extends TVSlots = undefined,
  // @ts-expect-error
  E extends TVReturnType = TVReturnType<
    V,
    S,
    B,
    // @ts-expect-error
    EV extends undefined ? {} : EV,
    // @ts-expect-error
    ES extends undefined ? {} : ES
  >,
  EV extends TVVariants<ES, B, E["variants"], ES> = E["variants"],
  ES extends TVSlots = E["slots"] extends TVSlots ? E["slots"] : undefined,
>(
  options: {
    /**
     * Extend allows for easy composition of components.
     * @see https://www.tailwind-variants.org/docs/composing-components
     */
    extend?: E;
    /**
     * Base allows you to set a base class for a component.
     */
    base?: B;
    /**
     * Slots allow you to separate a component into multiple parts.
     * @see https://www.tailwind-variants.org/docs/slots
     */
    slots?: S;
    /**
     * Variants allow you to create multiple versions of the same component.
     * @see https://www.tailwind-variants.org/docs/variants#adding-variants
     */
    variants?: V;
    /**
     * Compound variants allow you to apply classes to multiple variants at once.
     * @see https://www.tailwind-variants.org/docs/variants#compound-variants
     */
    compoundVariants?: CV;
    /**
     * Compound slots allow you to apply classes to multiple slots at once.
     */
    compoundSlots?: TVCompoundSlots<V, S, B>;
    /**
     * Default variants allow you to set default variants for a component.
     * @see https://www.tailwind-variants.org/docs/variants#default-variants
     */
    defaultVariants?: DV;
  },
  /**
   * The config object allows you to modify the default configuration.
   * @see https://www.tailwind-variants.org/docs/api-reference#config-optional
   */
  config?: TVConfig,
) => TVReturnType<V, S, B, EV, ES, E>;

export const defaultConfig: TVConfig = {
  twMerge: true,
  twMergeConfig: {},
};

export const cnBase = <T extends CnOptions>(...classes: T): CnReturn => {
  const result: (string | undefined)[] = [];

  flat(classes, result);
  let str = "";

  for (const element of result) {
    if (element) {
      if (str) str += " ";

      str += element;
    }
  }

  return str || undefined;
};

function flat(arr: any[], target: any[]): void {
  for (const el of arr) {
    if (Array.isArray(el)) flat(el, target);
    else if (el) target.push(el);
  }
}

let cachedTwMerge: ((classes: string) => string) | null = null;
let cachedTwMergeConfig: any = {};
let didTwMergeConfigChange = false;

export const cn =
  <T extends CnOptions>(...classes: T) =>
  (config?: TWMConfig): CnReturn => {
    const base = cnBase(...classes);

    if (!base || !config?.twMerge) return base;

    if (!cachedTwMerge || didTwMergeConfigChange) {
      didTwMergeConfigChange = false;
      cachedTwMerge = createTwMerge(cachedTwMergeConfig);
    }

    return cachedTwMerge(base) || undefined;
  };

const joinObjects = (obj1: any, obj2: any): any => {
  for (const key in obj2) {
    obj1[key] = key in obj1 ? cnBase(obj1[key], obj2[key]) : obj2[key];
  }

  return obj1;
};

export const tv: TV = (options: any, configProp?: TVConfig): any => {
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

  // save twMergeConfig to the cache
  if (
    !isEmptyObject(config.twMergeConfig) &&
    config.twMergeConfig &&
    cachedTwMergeConfig &&
    !isEqual(config.twMergeConfig as object, cachedTwMergeConfig as object)
  ) {
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

  const component = (props?: any): any => {
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

    const getVariantValue = (variant: string, vrs = variants, slotProps: any = null): any => {
      const variantObj = vrs[variant];

      if (!variantObj || isEmptyObject(variantObj)) {
        return null;
      }

      const variantProp = slotProps?.[variant] ?? props?.[variant];

      if (variantProp === null) return null;

      const variantKey = falsyToString(variantProp);

      const defaultVariantProp = defaultVariants?.[variant];

      // Use the variant key, or fall back to the default variant
      const key = variantKey == null ? falsyToString(defaultVariantProp) : variantKey;

      return variantObj[key || "false"];
    };

    const getVariantClassNames = (): any[] => {
      if (!variants) return [];

      const keys = Object.keys(variants);
      const result: any[] = [];

      for (const key of keys) {
        const value = getVariantValue(key, variants);

        if (value) result.push(value);
      }

      return result;
    };

    const getVariantClassNamesBySlotKey = (slotKey: string, slotProps: any): any[] => {
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

    const getCompleteProps = (key: null | string, slotProps: any): any => {
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

    const getCompoundVariantsValue = (cv: any[] = [], slotProps: any): any[] => {
      const result: any[] = [];
      const cvLength = cv.length;

      for (let i = 0; i < cvLength; i++) {
        const { class: tvClass, className: tvClassName, ...compoundVariantOptions } = cv[i];
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

    const getCompoundVariantClassNamesBySlot = (slotProps: any): any => {
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

    const getCompoundSlotClassNameBySlot = (slotProps: any): any => {
      if (compoundSlots.length === 0) return null;

      const result: any = {};
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

    // normal variants
    return cn(
      base,
      getVariantClassNames(),
      getCompoundVariantsValue(compoundVariants, props),
      props?.class,
      props?.className,
    )(config);
  };

  const getVariantKeys = (): string[] | undefined => {
    if (!variants || typeof variants !== "object") return;

    return Object.keys(variants);
  };

  (component as any).variantKeys = getVariantKeys();
  (component as any).extend = extend;
  (component as any).base = base;
  (component as any).slots = slots;
  (component as any).variants = variants;
  (component as any).defaultVariants = defaultVariants;
  (component as any).compoundSlots = compoundSlots;
  (component as any).compoundVariants = compoundVariants;

  return component;
};

export function createTV(configProp: TVConfig): CreateTV {
  return (options: any, config?: TVConfig) =>
    tv(options, config ? (mergeObjects(configProp, config) as TVConfig) : configProp);
}

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;

export { type ClassNameValue as ClassValue } from "tailwind-merge";

// Re-export utility functions for testing
export {
  falsyToString,
  flatArray,
  flatMergeArrays,
  isBoolean,
  isEmptyObject,
  isEqual,
  mergeObjects,
  removeExtraSpaces,
} from "@/utils";

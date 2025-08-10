import type { ClassNameValue as ClassValue } from "tailwind-merge";

import type { TVConfig, TWMConfig } from "./config";

/**
 * ----------------------------------------
 * Base Types
 * ----------------------------------------
 */

export type ClassProp<V extends unknown = ClassValue> =
  | { class?: never; className?: V }
  | { class?: V; className?: never };

type TVBaseName = "base";

type TVScreens = "initial";

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

export declare const cnBase: <T extends CnOptions>(...classes: T) => CnReturn;

export declare const cn: <T extends CnOptions>(...classes: T) => (config?: TWMConfig) => CnReturn;

// compare if the value is true or array of values
export type isTrueOrArray<T> = T extends true | unknown[] ? true : false;

export type WithInitialScreen<T extends string[]> = ["initial", ...T];

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

export type TVScreenPropsValue<
  V extends TVVariants<S>,
  S extends TVSlots,
  K extends keyof V,
> = Partial<Record<TVScreens, StringToBoolean<keyof V[K]>>>;

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

// main function
export declare const tv: TV;

export declare function createTV(config: TVConfig): CreateTV;

export declare const defaultConfig: TVConfig;

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;

export { type ClassNameValue as ClassValue } from "tailwind-merge";

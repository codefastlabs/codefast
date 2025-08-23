import type { ClassNameValue } from "tailwind-merge";
import type { ConfigExtension, DefaultClassGroupIds, DefaultThemeGroupIds } from "tailwind-merge";

/**
 * ----------------------------------------
 * Base Types
 * ----------------------------------------
 */

export type { ClassNameValue };

export type ClassNameProp<V extends unknown = ClassNameValue> =
  | { class?: V; className?: never }
  | { class?: never; className?: V };

type BaseName = "base";

type Screens = "initial";

type Slots = Record<string, ClassNameValue> | undefined;

/**
 * ----------------------------------------------------------------------
 * Utils
 * ----------------------------------------------------------------------
 */

export type OmitUndefined<T> = T extends undefined ? never : T;

export type StringToBoolean<T> = T extends "true" | "false" ? boolean : T;

export type isTrueOrArray<T> = T extends true | unknown[] ? true : false;

export type WithInitialScreen<T extends Array<string>> = ["initial", ...T];

/**
 * ----------------------------------------------------------------------
 * TV Types
 * ----------------------------------------------------------------------
 */

type SlotsWithBase<S extends Slots, B extends ClassNameValue> = B extends undefined
  ? keyof S
  : keyof S | BaseName;

type SlotsClassValue<S extends Slots, B extends ClassNameValue> = {
  [K in SlotsWithBase<S, B>]?: ClassNameValue;
};

type VariantsDefault<S extends Slots, B extends ClassNameValue> = S extends undefined
  ? {}
  : {
      [key: string]: {
        [key: string]: S extends Slots ? SlotsClassValue<S, B> | ClassNameValue : ClassNameValue;
      };
    };

export type Variants<
  S extends Slots | undefined,
  B extends ClassNameValue | undefined = undefined,
  EV extends Variants<ES> | undefined = undefined,
  ES extends Slots | undefined = undefined,
> = EV extends undefined
  ? VariantsDefault<S, B>
  :
      | {
          [K in keyof EV]: {
            [K2 in keyof EV[K]]: S extends Slots
              ? SlotsClassValue<S, B> | ClassNameValue
              : ClassNameValue;
          };
        }
      | VariantsDefault<S, B>;

export type CompoundVariants<
  V extends Variants<S>,
  S extends Slots,
  B extends ClassNameValue,
  EV extends Variants<ES>,
  ES extends Slots,
> = Array<
  {
    [K in keyof V | keyof EV]?:
      | (K extends keyof V ? StringToBoolean<keyof V[K]> : never)
      | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
      | (K extends keyof V ? StringToBoolean<keyof V[K]>[] : never);
  } & ClassNameProp<SlotsClassValue<S, B> | ClassNameValue>
>;

export type CompoundSlots<V extends Variants<S>, S extends Slots, B extends ClassNameValue> = Array<
  V extends undefined
    ? {
        slots: Array<SlotsWithBase<S, B>>;
      } & ClassNameProp
    : {
        slots: Array<SlotsWithBase<S, B>>;
      } & {
        [K in keyof V]?: StringToBoolean<keyof V[K]> | StringToBoolean<keyof V[K]>[];
      } & ClassNameProp
>;

export type DefaultVariants<
  V extends Variants<S>,
  S extends Slots,
  EV extends Variants<ES>,
  ES extends Slots,
> = {
  [K in keyof V | keyof EV]?:
    | (K extends keyof V ? StringToBoolean<keyof V[K]> : never)
    | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never);
};

export type ScreenPropsValue<V extends Variants<S>, S extends Slots, K extends keyof V> = {
  [Screen in Screens]?: StringToBoolean<keyof V[K]>;
};

export type Props<
  V extends Variants<S>,
  S extends Slots,
  EV extends Variants<ES>,
  ES extends Slots,
> = EV extends undefined
  ? V extends undefined
    ? ClassNameProp
    : {
        [K in keyof V]?: StringToBoolean<keyof V[K]> | undefined;
      } & ClassNameProp
  : V extends undefined
    ? {
        [K in keyof EV]?: StringToBoolean<keyof EV[K]> | undefined;
      } & ClassNameProp
    : {
        [K in keyof V | keyof EV]?:
          | (K extends keyof V ? StringToBoolean<keyof V[K]> : never)
          | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
          | undefined;
      } & ClassNameProp;

export type VariantKeys<V extends Variants<S>, S extends Slots> = V extends Object
  ? Array<keyof V>
  : undefined;

export type ReturnProps<
  V extends Variants<S>,
  S extends Slots,
  B extends ClassNameValue,
  EV extends Variants<ES>,
  ES extends Slots,
  // @ts-expect-error
  E extends ReturnType = undefined,
> = {
  extend: E;
  base: B;
  slots: S;
  variants: V;
  defaultVariants: DefaultVariants<V, S, EV, ES>;
  compoundVariants: CompoundVariants<V, S, B, EV, ES>;
  compoundSlots: CompoundSlots<V, S, B>;
  variantKeys: VariantKeys<V, S>;
};

type HasSlots<S extends Slots, ES extends Slots> = S extends undefined
  ? ES extends undefined
    ? false
    : true
  : true;

export type ReturnType<
  V extends Variants<S>,
  S extends Slots,
  B extends ClassNameValue,
  EV extends Variants<ES>,
  ES extends Slots,
  // @ts-expect-error
  E extends ReturnType = undefined,
> = {
  (props?: Props<V, S, EV, ES>): HasSlots<S, ES> extends true
    ? {
        [K in keyof (ES extends undefined ? {} : ES)]: (slotProps?: Props<V, S, EV, ES>) => string;
      } & {
        [K in keyof (S extends undefined ? {} : S)]: (slotProps?: Props<V, S, EV, ES>) => string;
      } & {
        [K in SlotsWithBase<{}, B>]: (slotProps?: Props<V, S, EV, ES>) => string;
      }
    : string;
} & ReturnProps<V, S, B, EV, ES, E>;

export type TV = {
  <
    V extends Variants<S, B, EV>,
    CV extends CompoundVariants<V, S, B, EV, ES>,
    DV extends DefaultVariants<V, S, EV, ES>,
    B extends ClassNameValue = undefined,
    S extends Slots = undefined,
    // @ts-expect-error
    E extends ReturnType = ReturnType<
      V,
      S,
      B,
      // @ts-expect-error
      EV extends undefined ? {} : EV,
      // @ts-expect-error
      ES extends undefined ? {} : ES
    >,
    EV extends Variants<ES, B, E["variants"], ES> = E["variants"],
    ES extends Slots = E["slots"] extends Slots ? E["slots"] : undefined,
  >(
    options: {
      /**
       * Extend allows for easy composition of components.
       */
      extend?: E;
      /**
       * Base allows you to set a base class for a component.
       */
      base?: B;
      /**
       * Slots allow you to separate a component into multiple parts.
       */
      slots?: S;
      /**
       * Variants allow you to create multiple versions of the same component.
       */
      variants?: V;
      /**
       * Compound variants allow you to apply classes to multiple variants at once.
       */
      compoundVariants?: CV;
      /**
       * Compound slots allow you to apply classes to multiple slots at once.
       */
      compoundSlots?: CompoundSlots<V, S, B>;
      /**
       * Default variants allow you to set default variants for a component.
       */
      defaultVariants?: DV;
    },
    /**
     * The config object allows you to modify the default configuration.
     */
    config?: Config,
  ): ReturnType<V, S, B, EV, ES, E>;
};

export type TWMergeConfig<
  AdditionalClassGroupIds extends string = string,
  AdditionalThemeGroupIds extends string = string,
> = ConfigExtension<
  AdditionalClassGroupIds | DefaultClassGroupIds,
  AdditionalThemeGroupIds | DefaultThemeGroupIds
>;

/**
 * Represents the configuration options for a utility that merges Tailwind CSS classes
 * and optionally extends its functionality with additional groups or themes.
 *
 * @typeParam AdditionalClassGroupIds - Custom class group identifiers that extend the default class groups.
 * @typeParam AdditionalThemeGroupIds - Custom theme group identifiers that extend the default theme groups.
 */
export type Config<
  AdditionalClassGroupIds extends string = string,
  AdditionalThemeGroupIds extends string = string,
> = {
  twMerge?: boolean;
  twMergeConfig?: TWMergeConfig<AdditionalClassGroupIds, AdditionalThemeGroupIds>;
  responsiveVariants?: boolean | string[];
};

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;

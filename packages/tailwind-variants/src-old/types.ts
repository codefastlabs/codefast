import type {
  ClassNameValue,
  ConfigExtension,
  DefaultClassGroupIds,
  DefaultThemeGroupIds,
} from "tailwind-merge";

/**
 * ----------------------------------------
 * Base Types
 * ----------------------------------------
 */

export type ClassNameProp<V extends unknown = ClassNameValue> =
  | { class?: never; className?: V }
  | { class?: V; className?: never };

type BaseName = "base";

type Slots = Record<string, ClassNameValue> | undefined;

/**
 * ----------------------------------------------------------------------
 * Utils
 * ----------------------------------------------------------------------
 */

export type OmitUndefined<T> = T extends undefined ? never : T;

export type StringToBoolean<T> = T extends "false" | "true" ? boolean : T;

export type IsTrueOrArray<T> = T extends true | unknown[] ? true : false;

/**
 * ----------------------------------------------------------------------
 * TV Types
 * ----------------------------------------------------------------------
 */

type SlotsWithBase<S extends Slots, B extends ClassNameValue> = B extends undefined
  ? keyof S
  : BaseName | keyof S;

type SlotsClassValue<S extends Slots, B extends ClassNameValue> = Partial<
  Record<SlotsWithBase<S, B>, ClassNameValue>
>;

type VariantsDefault<S extends Slots, B extends ClassNameValue> = S extends undefined
  ? {}
  : Record<
      string,
      Record<string, S extends Slots ? ClassNameValue | SlotsClassValue<S, B> : ClassNameValue>
    >;

export type Variants<
  S extends Slots | undefined,
  B extends ClassNameValue | undefined = undefined,
  EV extends undefined | Variants<ES> = undefined,
  ES extends Slots | undefined = undefined,
> = EV extends undefined
  ? VariantsDefault<S, B>
  :
      | {
          [K in keyof EV]: {
            [K2 in keyof EV[K]]: S extends Slots
              ? ClassNameValue | SlotsClassValue<S, B>
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
> = ({
  [K in keyof EV | keyof V]?:
    | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
    | (K extends keyof V ? StringToBoolean<keyof V[K]> : never)
    | (K extends keyof V ? StringToBoolean<keyof V[K]>[] : never);
} & ClassNameProp<ClassNameValue | SlotsClassValue<S, B>>)[];

export type CompoundSlots<
  V extends Variants<S>,
  S extends Slots,
  B extends ClassNameValue,
> = (V extends undefined
  ? {
      slots: SlotsWithBase<S, B>[];
    } & ClassNameProp
  : {
      slots: SlotsWithBase<S, B>[];
    } & {
      [K in keyof V]?: StringToBoolean<keyof V[K]> | StringToBoolean<keyof V[K]>[];
    } & ClassNameProp)[];

export type DefaultVariants<
  V extends Variants<S>,
  S extends Slots,
  EV extends Variants<ES>,
  ES extends Slots,
> = {
  [K in keyof EV | keyof V]?:
    | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
    | (K extends keyof V ? StringToBoolean<keyof V[K]> : never);
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
        [K in keyof EV | keyof V]?:
          | (K extends keyof EV ? StringToBoolean<keyof EV[K]> : never)
          | (K extends keyof V ? StringToBoolean<keyof V[K]> : never)
          | undefined;
      } & ClassNameProp;

export type VariantKeys<V extends Variants<S>, S extends Slots> = V extends object
  ? (keyof V)[]
  : undefined;

export interface ReturnProps<
  V extends Variants<S>,
  S extends Slots,
  B extends ClassNameValue,
  EV extends Variants<ES>,
  ES extends Slots,
  // @ts-expect-error
  E extends ReturnType = undefined,
> {
  base: B;
  compoundSlots: CompoundSlots<V, S, B>;
  compoundVariants: CompoundVariants<V, S, B, EV, ES>;
  defaultVariants: DefaultVariants<V, S, EV, ES>;
  extend: E;
  slots: S;
  variantKeys: VariantKeys<V, S>;
  variants: V;
}

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
> = ((props?: Props<V, S, EV, ES>) => HasSlots<S, ES> extends true
  ? {
      [K in keyof (ES extends undefined ? {} : ES)]: (slotProps?: Props<V, S, EV, ES>) => string;
    } & {
      [K in keyof (S extends undefined ? {} : S)]: (slotProps?: Props<V, S, EV, ES>) => string;
    } & Record<SlotsWithBase<{}, B>, (slotProps?: Props<V, S, EV, ES>) => string>
  : string) &
  ReturnProps<V, S, B, EV, ES, E>;

export type TV = <
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
) => ReturnType<V, S, B, EV, ES, E>;

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
export interface Config<
  AdditionalClassGroupIds extends string = string,
  AdditionalThemeGroupIds extends string = string,
> {
  twMerge?: boolean;
  twMergeConfig?: TWMergeConfig<AdditionalClassGroupIds, AdditionalThemeGroupIds>;
}

export type VariantProps<Component extends (...args: unknown[]) => unknown> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;

export { type ClassNameValue } from "tailwind-merge";

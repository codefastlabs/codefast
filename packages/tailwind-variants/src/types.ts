import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

export type StringToBooleanType<T> = T extends "false" | "true"
  ? boolean
  : T extends boolean
    ? T
    : T;

export type ConditionalType<T, Then, Else> = [T] extends [never] ? Then : Else;

export type BooleanVariantChecker<T extends Record<string, unknown>> = "true" extends keyof T
  ? true
  : "false" extends keyof T
    ? true
    : false;

export type VariantProps<Component, OmitKeys extends string = never> = Component extends (
  props?: infer P,
) => unknown
  ? P extends ConfigurationVariants<infer T>
    ? Omit<ConfigurationVariants<ConditionalType<T, Record<string, never>, T>>, OmitKeys> & {
        className?: ClassValue;
        class?: ClassValue;
      }
    : P extends Record<string, unknown>
      ? Omit<P & { className?: ClassValue; class?: ClassValue }, OmitKeys> & {
          className?: ClassValue;
          class?: ClassValue;
        }
      : { className?: ClassValue; class?: ClassValue }
  : Component extends VariantFunctionType<infer T>
    ? Omit<ConfigurationVariants<ConditionalType<T, Record<string, never>, T>>, OmitKeys> & {
        className?: ClassValue;
        class?: ClassValue;
      }
    : never;

export type ConfigurationSchema = Record<string, Record<string, ClassValue>>;

export type SlotConfigurationSchema = Record<string, ClassValue>;

export type ConfigurationVariants<T extends ConfigurationSchema> = {
  readonly [Variant in keyof T]?: BooleanVariantChecker<T[Variant]> extends true
    ? boolean | StringToBooleanType<keyof T[Variant]>
    : StringToBooleanType<keyof T[Variant]>;
} & {
  className?: ClassValue;
  class?: ClassValue;
};

export type SlotProperties<S extends SlotConfigurationSchema> = {
  readonly [Slot in keyof S]?: ClassValue;
};

export type CompoundVariantType<T extends ConfigurationSchema> = Partial<{
  readonly [Variant in keyof T]: BooleanVariantChecker<T[Variant]> extends true
    ? boolean | StringToBooleanType<keyof T[Variant]>
    : StringToBooleanType<keyof T[Variant]>;
}> & {
  className?: ClassValue;
  class?: ClassValue;
};

export type CompoundVariantWithSlotsType<
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
> = Partial<{
  readonly [Variant in keyof T]: BooleanVariantChecker<T[Variant]> extends true
    ? boolean | StringToBooleanType<keyof T[Variant]>
    : StringToBooleanType<keyof T[Variant]>;
}> & {
  className?: ClassValue | SlotProperties<S>;
  class?: ClassValue | SlotProperties<S>;
};

export type CompoundSlotType<T extends ConfigurationSchema, S extends SlotConfigurationSchema> =
  T extends Record<string, never>
    ? {
        readonly slots: readonly (keyof S)[];
        className?: ClassValue;
        class?: ClassValue;
      }
    : {
        readonly slots: readonly (keyof S)[];
        className?: ClassValue;
        class?: ClassValue;
      } & {
        readonly [K in keyof T]?: BooleanVariantChecker<T[K]> extends true
          ? boolean | StringToBooleanType<keyof T[K]>
          : StringToBooleanType<keyof T[K]>;
      };

export interface Configuration<T extends ConfigurationSchema> {
  readonly base?: ClassValue;
  readonly compoundVariants?: readonly CompoundVariantType<T>[];
  readonly defaultVariants?: ConfigurationVariants<T>;
  readonly variants?: T;
}

export interface ConfigurationWithSlots<
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
> {
  readonly base?: ClassValue;
  readonly compoundSlots?: readonly CompoundSlotType<T, S>[];
  readonly compoundVariants?: readonly CompoundVariantWithSlotsType<T, S>[];
  readonly defaultVariants?: ConfigurationVariants<T>;
  readonly slots?: S;
  readonly variants?: T;
}

export interface TailwindVariantsConfiguration {
  readonly twMerge?: boolean;
  readonly twMergeConfig?: ConfigExtension<string, string>;
}

export type SlotFunctionType<T extends ConfigurationSchema> = (
  props?: ConfigurationVariants<T>,
) => string | undefined;

export type SlotFunctionProperties<T extends ConfigurationSchema> = {
  readonly [K in keyof ConfigurationVariants<T>]?: ConfigurationVariants<T>[K];
} & {
  className?: ClassValue;
  class?: ClassValue;
};

export type TailwindVariantsReturnType<
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
> = keyof S extends never
  ? SlotFunctionType<T>
  : {
      readonly [K in keyof S]: SlotFunctionType<T>;
    } & {
      readonly base: SlotFunctionType<T>;
    };

export interface VariantFunctionType<
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema = SlotConfigurationSchema,
> {
  config: Configuration<T> | ConfigurationWithSlots<T, S>;

  (
    props?: ConfigurationVariants<T>,
  ): S extends Record<string, never> ? string | undefined : TailwindVariantsReturnType<T, S>;
}

export interface TailwindVariantsFactory {
  <T extends ConfigurationSchema>(
    config: Configuration<T>,
    localConfig?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, Record<string, never>>;

  <S extends SlotConfigurationSchema>(
    config: ConfigurationWithSlots<Record<string, never>, S>,
    localConfig?: TailwindVariantsConfiguration,
  ): VariantFunctionType<Record<string, never>, S>;

  <T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
    config: ConfigurationWithSlots<T, S>,
    localConfig?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, S>;

  <
    TBase extends ConfigurationSchema,
    TExtension extends ConfigurationSchema,
    SBase extends SlotConfigurationSchema,
    SExtension extends SlotConfigurationSchema,
  >(
    config: ExtendedConfiguration<TBase, TExtension, SBase, SExtension>,
    localConfig?: TailwindVariantsConfiguration,
  ): VariantFunctionType<MergedSchemas<TBase, TExtension>, MergedSlotSchemas<SBase, SExtension>>;
}

export interface TailwindVariantsFactoryResult {
  cn: (...classes: ClassValue[]) => string;
  tv: TailwindVariantsFactory;
}

export type MergedSchemas<
  TBase extends ConfigurationSchema,
  TExtension extends ConfigurationSchema,
> = TBase & TExtension;

export type MergedSlotSchemas<
  SBase extends SlotConfigurationSchema,
  SExtension extends SlotConfigurationSchema,
> = SBase & SExtension;

export interface ExtendedConfiguration<
  TBase extends ConfigurationSchema,
  TExtension extends ConfigurationSchema,
  SBase extends SlotConfigurationSchema,
  SExtension extends SlotConfigurationSchema,
> {
  readonly base?: ClassValue;
  readonly compoundSlots?: readonly CompoundSlotType<
    MergedSchemas<TBase, TExtension>,
    MergedSlotSchemas<SBase, SExtension>
  >[];
  readonly compoundVariants?: readonly CompoundVariantWithSlotsType<
    MergedSchemas<TBase, TExtension>,
    MergedSlotSchemas<SBase, SExtension>
  >[];
  readonly defaultVariants?: ConfigurationVariants<MergedSchemas<TBase, TExtension>>;
  readonly extend?: VariantFunctionType<TBase, SBase>;
  readonly slots?: SExtension;
  readonly variants?: TExtension;
}

export type { ClassValue } from "clsx";

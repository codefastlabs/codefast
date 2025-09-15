import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

export type StringToBoolean<T> = T extends "false" | "true" ? boolean : T extends boolean ? T : T;

export type IfNever<T, Then, Else> = [T] extends [never] ? Then : Else;

export type IsBooleanVariant<T extends Record<string, unknown>> = "true" extends keyof T
  ? true
  : "false" extends keyof T
    ? true
    : false;

export type VariantProps<Component, OmitKeys extends string = never> = Component extends (
  props?: infer P,
) => unknown
  ? P extends ConfigVariants<infer T>
    ? Omit<ConfigVariants<IfNever<T, Record<string, never>, T>>, OmitKeys> & {
        className?: ClassValue;
        class?: ClassValue;
      }
    : P extends Record<string, unknown>
      ? Omit<P & { className?: ClassValue; class?: ClassValue }, OmitKeys> & {
          className?: ClassValue;
          class?: ClassValue;
        }
      : { className?: ClassValue; class?: ClassValue }
  : Component extends VariantFunction<infer T>
    ? Omit<ConfigVariants<IfNever<T, Record<string, never>, T>>, OmitKeys> & {
        className?: ClassValue;
        class?: ClassValue;
      }
    : never;

export type ConfigSchema = Record<string, Record<string, ClassValue>>;

export type SlotSchema = Record<string, ClassValue>;

export type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
} & {
  className?: ClassValue;
  class?: ClassValue;
};

export type SlotProps<S extends SlotSchema> = {
  readonly [Slot in keyof S]?: ClassValue;
};

export type CompoundVariant<T extends ConfigSchema> = Partial<{
  readonly [Variant in keyof T]: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
}> & {
  className?: ClassValue;
  class?: ClassValue;
};

export type CompoundVariantWithSlots<T extends ConfigSchema, S extends SlotSchema> = Partial<{
  readonly [Variant in keyof T]: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
}> & {
  className?: ClassValue | SlotProps<S>;
  class?: ClassValue | SlotProps<S>;
};

export type CompoundSlot<T extends ConfigSchema, S extends SlotSchema> =
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
        readonly [K in keyof T]?: IsBooleanVariant<T[K]> extends true
          ? boolean | StringToBoolean<keyof T[K]>
          : StringToBoolean<keyof T[K]>;
      };

export interface Config<T extends ConfigSchema> {
  readonly base?: ClassValue;
  readonly compoundVariants?: readonly CompoundVariant<T>[];
  readonly defaultVariants?: ConfigVariants<T>;
  readonly variants?: T;
}

export interface ConfigWithSlots<T extends ConfigSchema, S extends SlotSchema> {
  readonly base?: ClassValue;
  readonly compoundSlots?: readonly CompoundSlot<T, S>[];
  readonly compoundVariants?: readonly CompoundVariantWithSlots<T, S>[];
  readonly defaultVariants?: ConfigVariants<T>;
  readonly slots?: S;
  readonly variants?: T;
}

export interface TVConfig {
  readonly twMerge?: boolean;
  readonly twMergeConfig?: ConfigExtension<string, string>;
}

export type SlotFunction<T extends ConfigSchema> = (
  props?: ConfigVariants<T>,
) => string | undefined;

export type SlotFunctionProps<T extends ConfigSchema> = {
  readonly [K in keyof ConfigVariants<T>]?: ConfigVariants<T>[K];
} & {
  className?: ClassValue;
  class?: ClassValue;
};

export type TVReturnType<T extends ConfigSchema, S extends SlotSchema> = keyof S extends never
  ? SlotFunction<T>
  : {
      readonly [K in keyof S]: SlotFunction<T>;
    } & {
      readonly base: SlotFunction<T>;
    };

export interface VariantFunction<T extends ConfigSchema, S extends SlotSchema = SlotSchema> {
  config: Config<T> | ConfigWithSlots<T, S>;

  (
    props?: ConfigVariants<T>,
  ): S extends Record<string, never> ? string | undefined : TVReturnType<T, S>;
}

export interface TVFactory {
  <T extends ConfigSchema>(
    config: Config<T>,
    localConfig?: TVConfig,
  ): VariantFunction<T, Record<string, never>>;

  <S extends SlotSchema>(
    config: ConfigWithSlots<Record<string, never>, S>,
    localConfig?: TVConfig,
  ): VariantFunction<Record<string, never>, S>;

  <T extends ConfigSchema, S extends SlotSchema>(
    config: ConfigWithSlots<T, S>,
    localConfig?: TVConfig,
  ): VariantFunction<T, S>;

  <
    TBase extends ConfigSchema,
    TExtension extends ConfigSchema,
    SBase extends SlotSchema,
    SExtension extends SlotSchema,
  >(
    config: ExtendedConfig<TBase, TExtension, SBase, SExtension>,
    localConfig?: TVConfig,
  ): VariantFunction<MergeSchemas<TBase, TExtension>, MergeSlotSchemas<SBase, SExtension>>;
}

export interface TVFactoryResult {
  cn: (...classes: ClassValue[]) => string;
  tv: TVFactory;
}

export type MergeSchemas<TBase extends ConfigSchema, TExtension extends ConfigSchema> = TBase &
  TExtension;

export type MergeSlotSchemas<SBase extends SlotSchema, SExtension extends SlotSchema> = SBase &
  SExtension;

export interface ExtendedConfig<
  TBase extends ConfigSchema,
  TExtension extends ConfigSchema,
  SBase extends SlotSchema,
  SExtension extends SlotSchema,
> {
  readonly base?: ClassValue;
  readonly compoundSlots?: readonly CompoundSlot<
    MergeSchemas<TBase, TExtension>,
    MergeSlotSchemas<SBase, SExtension>
  >[];
  readonly compoundVariants?: readonly CompoundVariantWithSlots<
    MergeSchemas<TBase, TExtension>,
    MergeSlotSchemas<SBase, SExtension>
  >[];
  readonly defaultVariants?: ConfigVariants<MergeSchemas<TBase, TExtension>>;
  readonly extend?: VariantFunction<TBase, SBase>;
  readonly slots?: SExtension;
  readonly variants?: TExtension;
}

export type { ClassValue } from "clsx";

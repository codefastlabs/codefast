/**
 * Type Definitions
 *
 * This module contains all TypeScript type definitions for the Tailwind Variants
 * library. It includes utility types, configuration types, and function signatures
 * that provide type safety throughout the library.
 *
 */

import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

/**
 * Converts string "true"/"false" to boolean, leaves other types unchanged.
 *
 * This utility type is used to handle boolean variants that can be passed
 * as either boolean values or string representations.
 *
 * @example
 * ```typescript
 * type Result = StringToBoolean<"true">; // boolean
 * type Result2 = StringToBoolean<"false">; // boolean
 * type Result3 = StringToBoolean<"sm">; // "sm"
 * ```
 */
export type StringToBoolean<T> = T extends "false" | "true" ? boolean : T extends boolean ? T : T;

/**
 * Utility to normalize inferred never types to an empty object.
 *
 * This type helps handle cases where TypeScript infers `never` types
 * and we want to provide a fallback empty object type instead.
 *
 * @example
 * ```typescript
 * type Result = IfNever<never, {}, string>; // {}
 * type Result2 = IfNever<string, {}, number>; // string
 * ```
 */
export type IfNever<T, Then, Else> = [T] extends [never] ? Then : Else;

/**
 * Helper types to determine if a variant key accepts boolean values.
 *
 * This type checks if a variant group is designed to work with boolean
 * values by looking for "true" or "false" keys in the variant definition.
 *
 * @example
 * ```typescript
 * type BooleanVariant = { true: 'block', false: 'hidden' };
 * type StringVariant = { sm: 'text-sm', lg: 'text-lg' };
 *
 * type IsBoolean1 = IsBooleanVariant<BooleanVariant>; // true
 * type IsBoolean2 = IsBooleanVariant<StringVariant>; // false
 * ```
 */
export type IsBooleanVariant<T extends Record<string, unknown>> = "true" extends keyof T
  ? true
  : "false" extends keyof T
    ? true
    : false;

/**
 * Enhanced VariantProps with better type inference and boolean handling.
 *
 * This type extracts variant properties from a component, providing strict
 * typing for variant component props extraction. It uses overloaded types
 * to handle different function signatures precisely.
 *
 * @example
 * ```typescript
 * const Button = tv({ variants: { size: { sm: 'text-sm', lg: 'text-lg' } } });
 * type ButtonProps = VariantProps<typeof Button>; // { size?: 'sm' | 'lg', className?: ClassValue }
 * ```
 */
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

/**
 * Base configuration schema for variants.
 *
 * This type defines the structure of variant definitions, where each
 * variant key maps to a group of variant values and their corresponding classes.
 *
 * @example
 * ```typescript
 * const variants: ConfigSchema = {
 *   size: { sm: 'text-sm', lg: 'text-lg' },
 *   color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' }
 * };
 * ```
 */
export type ConfigSchema = Record<string, Record<string, ClassValue>>;

/**
 * Base slot schema.
 *
 * This type defines the structure of slot definitions, where each
 * slot name maps to its default class value.
 *
 * @example
 * ```typescript
 * const slots: SlotSchema = {
 *   base: 'px-4 py-2',
 *   header: 'font-bold',
 *   content: 'text-gray-600'
 * };
 * ```
 */
export type SlotSchema = Record<string, ClassValue>;

/**
 * Enhanced ConfigVariants with better boolean handling and strict typing.
 *
 * This type represents the variant properties that can be passed to a
 * variant function, with proper boolean variant support and type safety.
 *
 * @example
 * ```typescript
 * type ButtonVariants = ConfigVariants<{
 *   size: { sm: 'text-sm', lg: 'text-lg' },
 *   disabled: { true: 'opacity-50', false: 'opacity-100' }
 * }>;
 * // Result: { size?: 'sm' | 'lg', disabled?: boolean, className?: ClassValue }
 * ```
 */
export type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
} & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Extract slot properties with type safety.
 *
 * This type represents the properties that can be passed to slot functions,
 * allowing users to override default slot classes.
 *
 * @example
 * ```typescript
 * type CardSlotProps = SlotProps<{ header: 'font-bold', content: 'text-gray-600' }>;
 * // Result: { header?: ClassValue, content?: ClassValue }
 * ```
 */
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

/**
 * Merge two schemas recursively with type safety.
 *
 * This type combines two configuration schemas, ensuring that all
 * variant definitions are properly merged and type-safe.
 *
 * @example
 * ```typescript
 * type BaseSchema = { size: { sm: 'text-sm' } };
 * type ExtensionSchema = { color: { primary: 'bg-blue-500' } };
 * type MergedSchema = MergeSchemas<BaseSchema, ExtensionSchema>;
 * // Result: { size: { sm: 'text-sm' }, color: { primary: 'bg-blue-500' } }
 * ```
 */
export type MergeSchemas<TBase extends ConfigSchema, TExtension extends ConfigSchema> = TBase &
  TExtension;

/**
 * Merge slot schemas with type safety.
 *
 * This type combines two slot schemas, ensuring that all slot
 * definitions are properly merged and type-safe.
 *
 * @example
 * ```typescript
 * type BaseSlots = { base: 'px-4' };
 * type ExtensionSlots = { header: 'font-bold' };
 * type MergedSlots = MergeSlotSchemas<BaseSlots, ExtensionSlots>;
 * // Result: { base: 'px-4', header: 'font-bold' }
 * ```
 */
export type MergeSlotSchemas<SBase extends SlotSchema, SExtension extends SlotSchema> = SBase &
  SExtension;

/**
 * Extended configuration for inheritance with proper type merging.
 *
 * This interface defines the structure for configurations that extend
 * other configurations, providing inheritance capabilities with proper
 * type merging and validation.
 *
 * @example
 * ```typescript
 * const baseConfig = tv({ variants: { size: { sm: 'text-sm' } } });
 * const extendedConfig: ExtendedConfig<BaseSchema, ExtensionSchema, BaseSlots, ExtensionSlots> = {
 *   extend: baseConfig,
 *   variants: { color: { primary: 'bg-blue-500' } },
 *   slots: { header: 'font-bold' }
 * };
 * ```
 */
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

// Re-export external types
export type { ClassValue } from "clsx";

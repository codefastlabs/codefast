/**
 * Tailwind Variants Type Definitions
 *
 * This module contains all TypeScript type definitions for the Tailwind Variants system.
 * It provides comprehensive type safety for variant configurations, component props,
 * and class value handling throughout the package.
 */

import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

/**
 * Convert string boolean values to actual boolean types.
 *
 * This utility type converts string representations of booleans ("true", "false")
 * to actual boolean types, while preserving existing boolean types.
 */
export type StringToBooleanType<T> = T extends "false" | "true"
  ? boolean
  : T extends boolean
    ? T
    : T;

/**
 * Conditional type utility for type-level branching.
 *
 * This utility type provides conditional logic at the type level,
 * allowing for complex type transformations based on type conditions.
 */
export type ConditionalType<T, Then, Else> = [T] extends [never] ? Then : Else;

/**
 * Check if a variant group supports boolean values.
 *
 * This utility type determines whether a variant group has boolean keys
 * ("true" or "false"), indicating it supports boolean variant values.
 */
export type BooleanVariantChecker<T extends Record<string, unknown>> = "true" extends keyof T
  ? true
  : "false" extends keyof T
    ? true
    : false;

/**
 * Extract variant props from a component or variant function.
 *
 * This utility type extracts the variant properties from a component or
 * variant function, including className and class properties, while
 * allowing for specific keys to be omitted.
 */
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

/**
 * Base configuration schema for variant groups.
 *
 * This type defines the structure of variant configurations where each
 * variant group maps variant values to CSS class values.
 */
export type ConfigurationSchema = Record<string, Record<string, ClassValue>>;

/**
 * Configuration schema for component slots.
 *
 * This type defines the structure of slot configurations where each
 * slot name maps to CSS class values.
 */
export type SlotConfigurationSchema = Record<string, ClassValue>;

/**
 * Variant properties for a configuration schema.
 *
 * This type defines the properties that can be passed to variant functions,
 * including variant values and optional className/class properties.
 */
export type ConfigurationVariants<T extends ConfigurationSchema> = {
  readonly [Variant in keyof T]?: BooleanVariantChecker<T[Variant]> extends true
    ? boolean | StringToBooleanType<keyof T[Variant]>
    : StringToBooleanType<keyof T[Variant]>;
} & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Properties for slot-based components.
 *
 * This type defines the properties that can be passed to slot functions,
 * allowing each slot to receive custom CSS classes.
 */
export type SlotProperties<S extends SlotConfigurationSchema> = {
  readonly [Slot in keyof S]?: ClassValue;
};

/**
 * Type for compound variant definitions.
 *
 * This type defines the structure of compound variants, which apply
 * additional classes when multiple variant conditions are met.
 */
export type CompoundVariantType<T extends ConfigurationSchema> = Partial<{
  readonly [Variant in keyof T]: BooleanVariantChecker<T[Variant]> extends true
    ? boolean | StringToBooleanType<keyof T[Variant]>
    : StringToBooleanType<keyof T[Variant]>;
}> & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Type for compound variants that support slots.
 *
 * This type extends compound variants to support slot-based class definitions,
 * allowing different classes to be applied to different slots.
 */
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

/**
 * Type for compound slot definitions.
 *
 * This type defines compound slots that apply classes to specific slots
 * when certain variant conditions are met.
 */
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

/**
 * Base configuration interface for variant functions.
 *
 * This interface defines the structure of variant configurations,
 * including base classes, variants, default values, and compound variants.
 */
export interface Configuration<T extends ConfigurationSchema> {
  readonly base?: ClassValue;
  readonly compoundVariants?: readonly CompoundVariantType<T>[];
  readonly defaultVariants?: ConfigurationVariants<T>;
  readonly variants?: T;
}

/**
 * Configuration interface for slot-based components.
 *
 * This interface extends the base configuration to include slot definitions
 * and slot-specific compound variants.
 */
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

/**
 * Configuration options for Tailwind Variants.
 *
 * This interface defines global configuration options that affect
 * how Tailwind Variants processes and merges CSS classes.
 */
export interface TailwindVariantsConfiguration {
  readonly twMerge?: boolean;
  readonly twMergeConfig?: ConfigExtension<string, string>;
}

/**
 * Type for individual slot functions.
 *
 * This type defines the signature of functions that generate CSS classes
 * for individual component slots.
 */
export type SlotFunctionType<T extends ConfigurationSchema> = (
  props?: ConfigurationVariants<T>,
) => string | undefined;

/**
 * Properties that can be passed to slot functions.
 *
 * This type defines the properties that can be passed to individual
 * slot functions, including variant props and class properties.
 */
export type SlotFunctionProperties<T extends ConfigurationSchema> = {
  readonly [K in keyof ConfigurationVariants<T>]?: ConfigurationVariants<T>[K];
} & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Return type for variant functions.
 *
 * This type defines the return type of variant functions, which can be
 * either a single function (for non-slot components) or an object with
 * slot functions (for slot-based components).
 */
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

/**
 * Main variant function type.
 *
 * This interface defines the structure of variant functions created by the tv function.
 * It includes the configuration and the function signature for generating CSS classes.
 */
export interface VariantFunctionType<
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema = SlotConfigurationSchema,
> {
  config: Configuration<T> | ConfigurationWithSlots<T, S>;

  (
    props?: ConfigurationVariants<T>,
  ): S extends Record<string, never> ? string | undefined : TailwindVariantsReturnType<T, S>;
}

/**
 * Factory function interface for creating variant functions.
 *
 * This interface defines the overloaded factory function that can create
 * variant functions with different configuration types and options.
 */
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

/**
 * Result interface for the createTV factory function.
 *
 * This interface defines the object returned by createTV, which includes
 * both the tv factory function and the cn utility function.
 */
export interface TailwindVariantsFactoryResult {
  cn: (...classes: ClassValue[]) => string;
  tv: TailwindVariantsFactory;
}

/**
 * Type for merged configuration schemas.
 *
 * This utility type merges two configuration schemas into a single type,
 * combining all variant groups from both schemas.
 */
export type MergedSchemas<
  TBase extends ConfigurationSchema,
  TExtension extends ConfigurationSchema,
> = TBase & TExtension;

/**
 * Type for merged slot configuration schemas.
 *
 * This utility type merges two slot configuration schemas into a single type,
 * combining all slot definitions from both schemas.
 */
export type MergedSlotSchemas<
  SBase extends SlotConfigurationSchema,
  SExtension extends SlotConfigurationSchema,
> = SBase & SExtension;

/**
 * Configuration interface for extending existing configurations.
 *
 * This interface allows extending an existing variant configuration with
 * additional variants and slots, while maintaining type safety.
 */
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

/**
 * Re-export ClassValue type from clsx for convenience.
 *
 * This type represents any value that can be converted to a CSS class string.
 */
export type { ClassValue } from "clsx";

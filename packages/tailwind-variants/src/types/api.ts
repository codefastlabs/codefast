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
 *
 * @since 0.3.16-canary.0
 */
export type VariantValue<T> = T extends "false" | "true" ? boolean : T extends boolean ? T : T;

/**
 * Check if a variant group supports boolean values.
 *
 * This utility type determines whether a variant group has boolean keys
 * ("true" or "false"), indicating it supports boolean variant values.
 *
 * @since 0.3.16-canary.0
 */
export type HasBooleanVariant<T extends Record<string, unknown>> = "true" extends keyof T
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
 *
 * @since 0.3.16-canary.0
 */
export type VariantProps<Component> =
  Component extends VariantResolver<infer T>
    ? T extends Record<string, never>
      ? object
      : Omit<VariantSelection<T>, "class" | "className">
    : never;

/**
 * Base configuration schema for variant groups.
 *
 * This type defines the structure of variant configurations where each
 * variant group maps variant values to CSS class values.
 *
 * @since 0.3.16-canary.0
 */
export type VariantSchema = Record<string, Record<string, ClassValue>>;

/**
 * Configuration schema for component slots.
 *
 * This type defines the structure of slot configurations where each
 * slot name maps to CSS class values.
 *
 * @since 0.3.16-canary.0
 */
export type SlotSchema = Record<string, ClassValue>;

/**
 * Variant properties for a configuration schema.
 *
 * This type defines the properties that can be passed to variant functions,
 * including variant values and optional className/class properties.
 *
 * @since 0.3.16-canary.0
 */
export type VariantSelection<T extends VariantSchema> = {
  readonly [Variant in keyof T]?: HasBooleanVariant<T[Variant]> extends true
    ? boolean | VariantValue<keyof T[Variant]>
    : VariantValue<keyof T[Variant]>;
} & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Properties for slot-based components.
 *
 * This type defines the properties that can be passed to slot functions,
 * allowing each slot to receive custom CSS classes.
 *
 * @since 0.3.16-canary.0
 */
export type SlotClassMap<S extends SlotSchema> = {
  readonly [Slot in keyof S]?: ClassValue;
};

/**
 * Type for compound variant definitions.
 *
 * This type defines the structure of compound variants, which apply
 * additional classes when multiple variant conditions are met.
 *
 * @since 0.3.16-canary.0
 */
export type CompoundVariant<T extends VariantSchema> = Partial<{
  readonly [Variant in keyof T]: HasBooleanVariant<T[Variant]> extends true
    ?
        | boolean
        | ReadonlyArray<boolean | VariantValue<keyof T[Variant]>>
        | VariantValue<keyof T[Variant]>
    : ReadonlyArray<VariantValue<keyof T[Variant]>> | VariantValue<keyof T[Variant]>;
}> & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Type for compound variants that support slots.
 *
 * This type extends compound variants to support slot-based class definitions,
 * allowing different classes to be applied to different slots.
 *
 * @since 0.3.16-canary.0
 */
export type SlotCompoundVariant<T extends VariantSchema, S extends SlotSchema> = Partial<{
  readonly [Variant in keyof T]: HasBooleanVariant<T[Variant]> extends true
    ?
        | boolean
        | ReadonlyArray<boolean | VariantValue<keyof T[Variant]>>
        | VariantValue<keyof T[Variant]>
    : ReadonlyArray<VariantValue<keyof T[Variant]>> | VariantValue<keyof T[Variant]>;
}> & {
  className?: ClassValue | SlotClassMap<S>;
  class?: ClassValue | SlotClassMap<S>;
};

/**
 * Type for compound slot definitions.
 *
 * This type defines compound slots that apply classes to specific slots
 * when certain variant conditions are met.
 *
 * @since 0.3.16-canary.0
 */
export type CompoundSlot<T extends VariantSchema, S extends SlotSchema> =
  T extends Record<string, never>
    ? {
        readonly slots: ReadonlyArray<keyof S>;
        className?: ClassValue;
        class?: ClassValue;
      }
    : {
        readonly slots: ReadonlyArray<keyof S>;
        className?: ClassValue;
        class?: ClassValue;
      } & {
        readonly [K in keyof T]?: HasBooleanVariant<T[K]> extends true
          ? boolean | VariantValue<keyof T[K]>
          : VariantValue<keyof T[K]>;
      };

/**
 * Base configuration interface for variant functions.
 *
 * This interface defines the structure of variant configurations,
 * including base classes, variants, default values, and compound variants.
 *
 * @since 0.3.16-canary.0
 */
export interface VariantConfig<T extends VariantSchema> {
  readonly base?: ClassValue;
  readonly compoundVariants?: ReadonlyArray<CompoundVariant<T>>;
  readonly defaultVariants?: VariantSelection<T>;
  readonly variants?: T;
}

/**
 * Configuration interface for slot-based components.
 *
 * This interface extends the base configuration to include slot definitions
 * and slot-specific compound variants.
 *
 * @since 0.3.16-canary.0
 */
export interface SlotVariantConfig<T extends VariantSchema, S extends SlotSchema> {
  readonly base?: ClassValue;
  readonly compoundSlots?: ReadonlyArray<CompoundSlot<T, S>>;
  readonly compoundVariants?: ReadonlyArray<SlotCompoundVariant<T, S>>;
  readonly defaultVariants?: VariantSelection<T>;
  readonly slots?: S;
  readonly variants?: T;
}

/**
 * Runtime options for Tailwind Variants.
 *
 * This interface defines global configuration options that affect
 * how Tailwind Variants processes and merges CSS classes.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsOptions {
  readonly twMerge?: boolean;
  readonly twMergeConfig?: ConfigExtension<string, string>;
}

/**
 * Type for individual slot functions.
 *
 * This type defines the signature of functions that generate CSS classes
 * for individual component slots.
 *
 * @since 0.3.16-canary.0
 */
export type SlotClassResolver<T extends VariantSchema> = (
  props?: SlotResolverProps<T>,
) => string | undefined;

/**
 * Properties that can be passed to slot functions.
 *
 * This type defines the properties that can be passed to individual
 * slot functions, including variant props and class properties.
 *
 * @since 0.3.16-canary.0
 */
export type SlotResolverProps<T extends VariantSchema> =
  T extends Record<string, never>
    ? {
        className?: ClassValue;
        class?: ClassValue;
      }
    : {
        readonly [K in keyof VariantSelection<T>]?: VariantSelection<T>[K];
      };

/**
 * Return type for variant functions.
 *
 * This type defines the return type of variant functions, which can be
 * either a single function (for non-slot components) or an object with
 * slot functions (for slot-based components).
 *
 * @since 0.3.16-canary.0
 */
export type VariantResolverResult<
  T extends VariantSchema,
  S extends SlotSchema,
> = keyof S extends never
  ? SlotClassResolver<T>
  : {
      readonly [K in keyof S]: SlotClassResolver<T>;
    } & {
      readonly base: SlotClassResolver<T>;
    };

/**
 * Main variant function type.
 *
 * This interface defines the structure of variant functions created by the tv function.
 * It includes the configuration and the function signature for generating CSS classes.
 *
 * @since 0.3.16-canary.0
 */
export interface VariantResolver<T extends VariantSchema, S extends SlotSchema = SlotSchema> {
  config: VariantConfig<T> | SlotVariantConfig<T, S>;

  (
    props?: VariantSelection<T>,
  ): S extends Record<string, never> ? string | undefined : VariantResolverResult<T, S>;
}

/**
 * Factory function interface for creating variant functions.
 *
 * This interface defines the overloaded factory function that can create
 * variant functions with different configuration types and options.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsFactory {
  <T extends VariantSchema>(
    config: VariantConfig<T>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<T, Record<string, never>>;

  <S extends SlotSchema>(
    config: SlotVariantConfig<Record<string, never>, S>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<Record<string, never>, S>;

  <T extends VariantSchema, S extends SlotSchema>(
    config: SlotVariantConfig<T, S>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<T, S>;

  <
    TBase extends VariantSchema,
    TExtension extends VariantSchema,
    SBase extends SlotSchema,
    SExtension extends SlotSchema,
  >(
    config: ExtendedVariantConfig<TBase, TExtension, SBase, SExtension>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<MergedVariantSchema<TBase, TExtension>, MergedSlotSchema<SBase, SExtension>>;
}

/**
 * Result interface for the createTV factory function.
 *
 * This interface defines the object returned by createTV, which includes
 * both the tv factory function and the cn utility function.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsApi {
  cn: (...classes: Array<ClassValue>) => string;
  tv: TailwindVariantsFactory;
}

/**
 * Type for merged configuration schemas.
 *
 * This utility type merges two configuration schemas into a single type,
 * combining all variant groups from both schemas.
 *
 * @since 0.3.16-canary.0
 */
export type MergedVariantSchema<
  TBase extends VariantSchema,
  TExtension extends VariantSchema,
> = TBase & TExtension;

/**
 * Type for merged slot configuration schemas.
 *
 * This utility type merges two slot configuration schemas into a single type,
 * combining all slot definitions from both schemas.
 *
 * @since 0.3.16-canary.0
 */
export type MergedSlotSchema<SBase extends SlotSchema, SExtension extends SlotSchema> = SBase &
  SExtension;

/**
 * Configuration interface for extending existing variant resolvers.
 *
 * This interface allows extending an existing variant configuration with
 * additional variants and slots, while maintaining type safety.
 *
 * @since 0.3.16-canary.0
 */
export interface ExtendedVariantConfig<
  TBase extends VariantSchema,
  TExtension extends VariantSchema,
  SBase extends SlotSchema,
  SExtension extends SlotSchema,
> {
  readonly base?: ClassValue;
  readonly compoundSlots?: ReadonlyArray<
    CompoundSlot<MergedVariantSchema<TBase, TExtension>, MergedSlotSchema<SBase, SExtension>>
  >;
  readonly compoundVariants?: ReadonlyArray<
    SlotCompoundVariant<MergedVariantSchema<TBase, TExtension>, MergedSlotSchema<SBase, SExtension>>
  >;
  readonly defaultVariants?: VariantSelection<MergedVariantSchema<TBase, TExtension>>;
  readonly extend?: VariantResolver<TBase, SBase>;
  readonly slots?: SExtension;
  readonly variants?: TExtension;
}

/**
 * Re-export ClassValue type from clsx for convenience.
 *
 * This type represents any value that can be converted to a CSS class string.
 */
export type { ClassValue } from "clsx";

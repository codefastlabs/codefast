import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

// =============================================================================
// Core Utility Types
// =============================================================================

/**
 * Converts string "true"/"false" to boolean, leaves other types unchanged
 * Enhanced to handle actual booleans and provide better type inference
 */
export type StringToBoolean<T> = T extends "false" | "true" ? boolean : T extends boolean ? T : T;

/**
 * Utility to normalize inferred never types to an empty object
 */
export type IfNever<T, Then, Else> = [T] extends [never] ? Then : Else;

/**
 * Helper types to determine if a variant key accepts boolean values
 */
export type IsBooleanVariant<T extends Record<string, unknown>> = "true" extends keyof T
  ? true
  : "false" extends keyof T
    ? true
    : false;

/**
 * Enhanced VariantProps with better type inference and boolean handling
 * Provides strict typing for variant component props extraction
 * Uses overloaded types to handle different function signatures precisely
 */
export type VariantProps<Component, OmitKeys extends string = never> = Component extends (
  props?: infer P,
) => unknown
  ? P extends ConfigVariants<infer T>
    ? Omit<ConfigVariants<IfNever<T, Record<string, never>, T>>, OmitKeys> & {
        readonly className?: ClassValue;
        readonly class?: ClassValue;
      }
    : P extends Record<string, unknown>
      ? Omit<P & { className?: ClassValue; class?: ClassValue }, OmitKeys> & {
          readonly className?: ClassValue;
          readonly class?: ClassValue;
        }
      : { readonly className?: ClassValue; readonly class?: ClassValue }
  : Component extends VariantFunction<infer T>
    ? Omit<ConfigVariants<IfNever<T, Record<string, never>, T>>, OmitKeys> & {
        readonly className?: ClassValue;
        readonly class?: ClassValue;
      }
    : never;

// =============================================================================
// Schema Types
// =============================================================================

/**
 * Base configuration schema for variants
 */
export type ConfigSchema = Record<string, Record<string, ClassValue>>;

/**
 * Base slot schema
 */
export type SlotSchema = Record<string, ClassValue>;

/**
 * Enhanced ConfigVariants with better boolean handling and strict typing
 */
export type ConfigVariants<T extends ConfigSchema> = {
  readonly [Variant in keyof T]?: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
} & {
  readonly className?: ClassValue;
  readonly class?: ClassValue;
};

/**
 * Extract slot properties with type safety
 */
export type SlotProps<S extends SlotSchema> = {
  readonly [Slot in keyof S]?: ClassValue;
};

// =============================================================================
// Compound Variants Types
// =============================================================================

/**
 * Enhanced compound variant with strict type checking and boolean support
 */
export type CompoundVariant<T extends ConfigSchema> = Partial<{
  readonly [Variant in keyof T]: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
}> & {
  readonly className?: ClassValue;
  readonly class?: ClassValue;
};

/**
 * Enhanced compound variant with slots and strict type checking
 */
export type CompoundVariantWithSlots<T extends ConfigSchema, S extends SlotSchema> = Partial<{
  readonly [Variant in keyof T]: IsBooleanVariant<T[Variant]> extends true
    ? boolean | StringToBoolean<keyof T[Variant]>
    : StringToBoolean<keyof T[Variant]>;
}> & {
  readonly className?: ClassValue | SlotProps<S>;
  readonly class?: ClassValue | SlotProps<S>;
};

/**
 * Enhanced compound slots with strict type checking
 */
export type CompoundSlot<T extends ConfigSchema, S extends SlotSchema> =
  T extends Record<string, never>
    ? {
        readonly slots: readonly (keyof S)[];
        readonly className?: ClassValue;
        readonly class?: ClassValue;
      }
    : {
        readonly slots: readonly (keyof S)[];
        readonly className?: ClassValue;
        readonly class?: ClassValue;
      } & {
        readonly [K in keyof T]?: IsBooleanVariant<T[K]> extends true
          ? boolean | StringToBoolean<keyof T[K]>
          : StringToBoolean<keyof T[K]>;
      };

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Configuration without slots - type-safe variant definition
 */
export interface Config<T extends ConfigSchema> {
  readonly base?: ClassValue;
  readonly compoundVariants?: readonly CompoundVariant<T>[];
  readonly defaultVariants?: ConfigVariants<T>;
  readonly variants?: T;
}

/**
 * Configuration with slots - extended type-safe definition
 */
export interface ConfigWithSlots<T extends ConfigSchema, S extends SlotSchema> {
  readonly base?: ClassValue;
  readonly compoundSlots?: readonly CompoundSlot<T, S>[];
  readonly compoundVariants?: readonly CompoundVariantWithSlots<T, S>[];
  readonly defaultVariants?: ConfigVariants<T>;
  readonly slots?: S;
  readonly variants?: T;
}

/**
 * TV configuration options
 */
export interface TVConfig {
  readonly twMerge?: boolean;
  readonly twMergeConfig?: ConfigExtension<string, string>;
}

// =============================================================================
// Return Types
// =============================================================================

/**
 * Enhanced slot function with strict typing and optional props
 */
export type SlotFunction<T extends ConfigSchema> = (
  props?: ConfigVariants<T>,
) => string | undefined;

/**
 * Utility type to ensure proper prop passing to slot functions
 */
export type SlotFunctionProps<T extends ConfigSchema> = {
  readonly [K in keyof ConfigVariants<T>]?: ConfigVariants<T>[K];
} & {
  readonly className?: ClassValue;
  readonly class?: ClassValue;
};

/**
 * Enhanced TVReturnType with better conditional typing and slot handling
 */
export type TVReturnType<T extends ConfigSchema, S extends SlotSchema> =
  // Check if we have slots (non-empty slot schema)
  keyof S extends never
    ? SlotFunction<T> // No slots - return single function
    : {
        readonly [K in keyof S]: SlotFunction<T>;
      } & {
        readonly base: SlotFunction<T>;
      };

// =============================================================================
// Variant Function Interface
// =============================================================================

/**
 * Enhanced VariantFunction with stricter typing and better inference
 */
export interface VariantFunction<T extends ConfigSchema, S extends SlotSchema = SlotSchema> {
  config: Config<T> | ConfigWithSlots<T, S>;

  // Function can be called with or without parameters
  (
    props?: ConfigVariants<T>,
  ): S extends Record<string, never> ? string | undefined : TVReturnType<T, S>;
}

// =============================================================================
// Extended Configuration Types
// =============================================================================

/**
 * Merge two schemas recursively with type safety
 */
export type MergeSchemas<TBase extends ConfigSchema, TExtension extends ConfigSchema> = TBase &
  TExtension;

/**
 * Merge slot schemas with type safety
 */
export type MergeSlotSchemas<SBase extends SlotSchema, SExtension extends SlotSchema> = SBase &
  SExtension;

/**
 * Extended configuration for inheritance with proper type merging
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

// =============================================================================
// Re-export external types
// =============================================================================

export type { ClassValue } from "clsx";

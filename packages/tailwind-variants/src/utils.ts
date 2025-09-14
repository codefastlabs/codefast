/**
 * Utility Functions and Type Guards
 *
 * This module provides utility functions for class manipulation, type checking,
 * and configuration validation. These functions support the core functionality
 * of the Tailwind Variants library.
 *
 */

import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type { Config, ConfigSchema, ConfigWithSlots, ExtendedConfig, SlotSchema } from "@/types";

/**
 * Optimized class concatenation using clsx.
 *
 * This function provides a simple wrapper around clsx for concatenating
 * class names with conditional logic support.
 *
 * @param classes - Variable number of class values to concatenate
 * @returns Concatenated class string
 *
 * @example
 * ```typescript
 * const classes = cx('base-class', { 'conditional-class': isActive }, ['array-class']);
 * // Returns: 'base-class conditional-class array-class' (if isActive is true)
 * ```
 */
export const cx = (...classes: ClassValue[]): string => {
  return clsx(classes);
};

/**
 * Class name utility that combines clsx and tailwind-merge.
 *
 * This function concatenates classes using clsx and then merges conflicting
 * Tailwind CSS classes using tailwind-merge, ensuring only the last conflicting
 * class is applied.
 *
 * @param classes - Variable number of class values to merge
 * @returns Merged and optimized class string
 *
 * @example
 * ```typescript
 * const classes = cn('text-sm text-lg', 'text-red-500 text-blue-500');
 * // Returns: 'text-lg text-blue-500' (conflicting classes resolved)
 * ```
 */
export const cn = (...classes: ClassValue[]): string => {
  return twMerge(clsx(classes));
};

/**
 * Creates a tailwind merge function with optional configuration.
 *
 * This function creates a configured tailwind-merge instance that can be used
 * throughout the application for consistent class merging behavior.
 *
 * @param config - Optional configuration for tailwind-merge
 * @returns Configured tailwind merge function
 *
 * @example
 * ```typescript
 * const customMerge = createTailwindMerge({
 *   extend: {
 *     classGroups: {
 *       'font-size': ['text-custom']
 *     }
 *   }
 * });
 * ```
 */
export const createTailwindMerge = (
  config?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  return config ? extendTailwindMerge(config) : twMerge;
};

/**
 * Enhanced type guard for slot-specific objects with better type inference.
 *
 * This function checks if a value is a slot object (an object with string keys
 * and ClassValue values) rather than a simple string or array.
 *
 * @param value - Value to check
 * @returns True if the value is a slot object
 *
 * @example
 * ```typescript
 * const slotConfig = { base: 'px-4', header: 'font-bold' };
 * if (isSlotObject(slotConfig)) {
 *   // TypeScript knows slotConfig is Record<string, ClassValue>
 *   console.log(slotConfig.base); // 'px-4'
 * }
 * ```
 */
export const isSlotObject = (value: ClassValue): value is Record<string, ClassValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Type guard to check if a variant group accepts boolean values.
 *
 * This function determines if a variant group is designed to work with boolean
 * values by checking for the presence of "true" or "false" keys.
 *
 * @param variantGroup - Variant group to check
 * @returns True if the variant group accepts boolean values
 *
 * @example
 * ```typescript
 * const booleanVariant = { true: 'block', false: 'hidden' };
 * const stringVariant = { sm: 'text-sm', lg: 'text-lg' };
 *
 * isBooleanVariant(booleanVariant); // true
 * isBooleanVariant(stringVariant); // false
 * ```
 */
export const isBooleanVariant = <T extends Record<string, unknown>>(
  variantGroup: T,
): variantGroup is T & (Record<"false", unknown> | Record<"true", unknown>) => {
  return "true" in variantGroup || "false" in variantGroup;
};

/**
 * Enhanced type guard for boolean values with proper type narrowing.
 *
 * This function provides a simple type guard to check if a value is a boolean,
 * useful for handling boolean variants in the variant system.
 *
 * @param value - Value to check
 * @returns True if the value is a boolean
 *
 * @example
 * ```typescript
 * const value: unknown = true;
 * if (isBooleanValue(value)) {
 *   // TypeScript knows value is boolean
 *   console.log(value); // true
 * }
 * ```
 */
export const isBooleanValue = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

/**
 * Type guard to check if a config has slots.
 *
 * This function determines if a configuration object includes slot definitions,
 * which affects how the variant system processes the configuration.
 *
 * @param config - Configuration object to check
 * @returns True if the config has slots
 *
 * @example
 * ```typescript
 * const configWithSlots = { slots: { base: 'px-4', header: 'font-bold' } };
 * const configWithoutSlots = { variants: { size: { sm: 'text-sm' } } };
 *
 * hasSlots(configWithSlots); // true
 * hasSlots(configWithoutSlots); // false
 * ```
 */
export const hasSlots = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S>,
): config is ConfigWithSlots<T, S> => {
  return "slots" in config && config.slots !== undefined;
};

/**
 * Type guard to check if a config has extended configuration.
 *
 * This function determines if a configuration object extends another configuration,
 * which affects the merging process and inheritance chain.
 *
 * @param config - Configuration object to check
 * @returns True if the config has extended configuration
 *
 * @example
 * ```typescript
 * const extendedConfig = { extend: baseTV, variants: { size: { xl: 'text-xl' } } };
 * const baseConfig = { variants: { size: { sm: 'text-sm' } } };
 *
 * hasExtend(extendedConfig); // true
 * hasExtend(baseConfig); // false
 * ```
 */
export const hasExtend = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
): config is ExtendedConfig<ConfigSchema, T, SlotSchema, S> => {
  return "extend" in config && config.extend !== undefined;
};

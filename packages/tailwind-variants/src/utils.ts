import type { ClassValue } from "clsx";
import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type { Config, ConfigSchema, ConfigWithSlots, ExtendedConfig, SlotSchema } from "./types";

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Optimized class concatenation using clsx
 */
export const cx = (...classes: ClassValue[]): string => {
  return clsx(classes);
};

/**
 * Class name utility that combines clsx and tailwind-merge
 * Similar to cn function but with tailwind-merge integration
 */
export const cn = (...classes: ClassValue[]): string => {
  return twMerge(clsx(classes));
};

/**
 * Creates a tailwind merge function with optional configuration
 */
export const createTailwindMerge = (
  config?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  return config ? extendTailwindMerge(config) : twMerge;
};

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Enhanced type guard for slot-specific objects with better type inference
 */
export const isSlotObject = (value: ClassValue): value is Record<string, ClassValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Type guard to check if a variant value is a boolean variant
 */
export const isBooleanVariant = <T extends Record<string, unknown>>(
  variantGroup: T,
): variantGroup is T & (Record<"false", unknown> | Record<"true", unknown>) => {
  return "true" in variantGroup || "false" in variantGroup;
};

/**
 * Enhanced type guard for boolean values with proper type narrowing
 */
export const isBooleanValue = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

/**
 * Type guard to check if a config has slots
 */
export const hasSlots = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S>,
): config is ConfigWithSlots<T, S> => {
  return "slots" in config && config.slots !== undefined;
};

/**
 * Type guard to check if a config has extended
 */
export const hasExtend = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
): config is ExtendedConfig<ConfigSchema, T, SlotSchema, S> => {
  return "extend" in config && config.extend !== undefined;
};

/**
 * Utility Functions Module
 *
 * This module provides utility functions for class name manipulation,
 * type checking, and Tailwind merge configuration. It serves as the
 * foundation for CSS class processing throughout the package.
 */

import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type {
  ClassValue,
  Configuration,
  ConfigurationSchema,
  ConfigurationWithSlots,
  ExtendedConfiguration,
  SlotConfigurationSchema,
  VariantFunctionType,
} from "#/types/types";

/**
 * Combine CSS classes using clsx.
 *
 * This function provides a simple interface for combining CSS classes
 * using the clsx library, which handles conditional classes and arrays.
 * Optimized with fast paths for common cases.
 *
 * @param classes - CSS classes to combine
 * @returns Combined CSS class string
 *
 * @since 0.3.16-canary.0
 */
export const cx = (...classes: Array<ClassValue>): string => {
  const length = classes.length;

  if (length === 0) {
    return "";
  }

  if (length === 1) {
    const single = classes[0];

    if (typeof single === "string") {
      return single;
    }

    if (!single) {
      return "";
    }

    return clsx(single);
  }

  let result = "";

  for (let index = 0; index < length; index++) {
    const cls = classes[index];

    if (typeof cls === "string") {
      if (cls) {
        result = result ? result + " " + cls : cls;
      }
    } else if (cls) {
      return clsx(classes);
    }
  }

  return result;
};

/**
 * Combine and merge CSS classes using Tailwind merge.
 *
 * This function combines CSS classes and then merges them using
 * tailwind-merge to resolve conflicts and remove duplicates.
 * Optimized with fast paths for common cases.
 *
 * @param classes - CSS classes to combine and merge
 * @returns Merged CSS class string
 *
 * @since 0.3.16-canary.0
 */
export const cn = (...classes: Array<ClassValue>): string => {
  const length = classes.length;

  if (length === 0) {
    return "";
  }

  if (length === 1) {
    const single = classes[0];

    if (typeof single === "string") {
      return twMerge(single);
    }

    if (!single) {
      return "";
    }

    return twMerge(clsx(single));
  }

  let result = "";

  for (let index = 0; index < length; index++) {
    const cls = classes[index];

    if (typeof cls === "string") {
      if (cls) {
        result = result ? result + " " + cls : cls;
      }
    } else if (cls) {
      return twMerge(clsx(classes));
    }
  }

  return twMerge(result);
};

/**
 * Create a Tailwind merge service with optional configuration.
 *
 * This function creates a Tailwind merge service that can be configured
 * with custom extensions for handling additional class patterns.
 *
 * @param configuration - Optional Tailwind merge configuration
 * @returns Configured Tailwind merge function
 *
 * @since 0.3.16-canary.0
 */
export const createTailwindMergeService = (
  configuration?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  return configuration ? extendTailwindMerge(configuration) : twMerge;
};

/**
 * Check if a value is a slot object type.
 *
 * This function determines whether a ClassValue is an object that can
 * contain slot-specific class definitions.
 *
 * @param value - The value to check
 * @returns True if the value is a slot object
 *
 * @since 0.3.16-canary.0
 */
export const isSlotObjectType = (value: ClassValue): value is Record<string, ClassValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Check if a variant group supports boolean values.
 *
 * This function determines whether a variant group has boolean keys
 * ("true" or "false"), indicating it can accept boolean variant values.
 *
 * @param variantGroup - The variant group to check
 * @returns True if the variant group supports boolean values
 *
 * @since 0.3.16-canary.0
 */
export const isBooleanVariantType = <T extends Record<string, unknown>>(
  variantGroup: T,
): variantGroup is T => {
  return "true" in variantGroup || "false" in variantGroup;
};

/**
 * Check if a configuration has slot definitions.
 *
 * This function provides a type guard to determine if a configuration
 * object includes slot definitions, enabling type-safe slot handling.
 *
 * @param configuration - The configuration to check
 * @returns True if the configuration has slots
 *
 * @since 0.3.16-canary.0
 */
export const hasSlotConfiguration = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  configuration: Configuration<T> | ConfigurationWithSlots<T, S>,
): configuration is ConfigurationWithSlots<T, S> => {
  return "slots" in configuration && configuration.slots !== undefined;
};

/**
 * Check if a configuration has extension definitions.
 *
 * This function provides a type guard to determine if a configuration
 * object includes extension definitions, enabling type-safe configuration
 * merging and inheritance.
 *
 * @param configuration - The configuration to check
 * @returns True if the configuration has extensions
 *
 * @since 0.3.16-canary.0
 */
export const hasExtensionConfiguration = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  configuration:
    | Configuration<T>
    | ConfigurationWithSlots<T, S>
    | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
): configuration is ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S> & {
  readonly extend: VariantFunctionType<ConfigurationSchema, SlotConfigurationSchema>;
} => {
  return "extend" in configuration && configuration.extend !== undefined;
};

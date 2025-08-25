import type {
  ClassNameValue,
  ConfigExtension,
  DefaultClassGroupIds,
  DefaultThemeGroupIds,
} from "tailwind-merge";

import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type {
  FunctionReturnType,
} from "@/utils/types";
import { isEmptyObject } from "@/utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Type for the merge function return type
 */
export type MergeFunctionReturnType = FunctionReturnType<typeof twMerge>;

/**
 * Type for the extended merge function
 */
export type ExtendedMergeFunction = (...classes: ClassNameValue[]) => string;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Creates a tailored class name merging function based on the provided configuration.
 *
 * This utility allows you to extend or override the default Tailwind class group and theme group configurations
 * to produce a customized merging function. Depending on whether the configuration is empty, it uses either
 * the default merging logic or an extended one based on the provided configuration.
 *
 * @param config - An object that extends the default class and theme group configurations, determining how class name conflicts are resolved.
 * @returns A function that accepts class name inputs and resolves conflicts based on the extended or default configurations.
 */
export const createTwMerge = (
  config: ConfigExtension<
    DefaultClassGroupIds,
    DefaultThemeGroupIds
  >
): ExtendedMergeFunction => {
  // Determine which merge function to use based on config
  // If config is empty, use default twMerge; otherwise, use extended version
  const mergeFunction = isEmptyObject(config) ? twMerge : extendTailwindMerge(config);

  // Create and return the class name merger function
  return (...classes: ClassNameValue[]): string => {
    return mergeFunction(...classes);
  };
};

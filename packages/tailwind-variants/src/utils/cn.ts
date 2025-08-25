import clsx from "clsx";

import type { ClassNameValue, Config } from "@/types";
import type {
  ConfigExtension,
  DefaultClassGroupIds,
  DefaultThemeGroupIds,
} from "tailwind-merge";

import { createTwMerge } from "@/utils/create-tw-merge";
import { isEqual } from "@/utils";
import type {
  DeepReadonly,
} from "@/utils/types";
import { isObject } from "@/utils/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Type for the cached twMerge function
 */
type CachedTwMergeFunction = (...classes: ClassNameValue[]) => string;

/**
 * Type for the cached twMerge configuration
 */
type CachedTwMergeConfiguration = DeepReadonly<ConfigExtension<
  DefaultClassGroupIds,
  DefaultThemeGroupIds
>>;

/**
 * Type for the configuration processor function
 */
type ConfigurationProcessor = (config?: Config) => string | undefined;

/**
 * Type for the complete cn function
 */
type CompleteCnFunction = (...classNames: ClassNameValue[]) => ConfigurationProcessor;

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Cache for the twMerge function to avoid recreating it on every call
 */
let cachedTwMergeFunction: CachedTwMergeFunction | null = null;

/**
 * Cache for the twMerge configuration to detect changes
 */
let cachedTwMergeConfiguration: CachedTwMergeConfiguration = {} as CachedTwMergeConfiguration;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a configuration has twMerge enabled
 */
const hasTwMergeEnabled = (config: unknown): config is Config & { twMerge: true } => {
  return isObject(config) && Boolean(config.twMerge);
};

/**
 * Checks if the twMerge configuration has changed
 */
const hasConfigurationChanged = (
  currentConfig: ConfigExtension<DefaultClassGroupIds, DefaultThemeGroupIds>,
  cachedConfig: CachedTwMergeConfiguration
): boolean => {
  return !isEqual(currentConfig, cachedConfig);
};

/**
 * Creates or retrieves the appropriate twMerge function
 */
const getOrCreateTwMergeFunction = (config: Config): CachedTwMergeFunction => {
  const currentTwMergeConfig = (config.twMergeConfig || {}) as ConfigExtension<
    DefaultClassGroupIds,
    DefaultThemeGroupIds
  >;
  
  // Check if configuration has changed or if no cached function exists
  if (!cachedTwMergeFunction || hasConfigurationChanged(currentTwMergeConfig, cachedTwMergeConfiguration)) {
    const newFunction = createTwMerge(currentTwMergeConfig);
    cachedTwMergeConfiguration = currentTwMergeConfig as CachedTwMergeConfiguration;
    cachedTwMergeFunction = newFunction;
  }
  
  return cachedTwMergeFunction;
};

// ============================================================================
// MAIN CLASS NAME PROCESSING FUNCTIONS
// ============================================================================

/**
 * Processes class names using clsx for merging
 */
const processClassNamesWithClsx = (...classNames: ClassNameValue[]): string | undefined => {
  const mergedClassNames = clsx(classNames);
  return mergedClassNames || undefined;
};

/**
 * Processes class names with tailwind-merge for conflict resolution
 */
const processClassNamesWithTwMerge = (
  mergedClassNames: string,
  config: Config
): string | undefined => {
  const twMergeFunction = getOrCreateTwMergeFunction(config);
  return twMergeFunction(mergedClassNames) || undefined;
};

// ============================================================================
// MAIN CN FUNCTION
// ============================================================================

/**
 * A class name utility that combines clsx for class merging and tailwind-merge for conflict resolution
 * 
 * This function uses advanced TypeScript techniques including:
 * - Generic types with constraints
 * - Conditional types and mapped types
 * - Branded types for type safety
 * - Type guards and type predicates
 * - Utility types for advanced type manipulation
 *
 * @param classNames - Variable number of class name values to combine
 * @returns A function that accepts a config and returns the processed class names
 */
export const cn: CompleteCnFunction = (...classNames: ClassNameValue[]) => {
  return (config?: Config): string | undefined => {
    // Process class names with clsx first
    const mergedClassNames = processClassNamesWithClsx(...classNames);
    
    // Early return if no classes or twMerge is disabled
    if (!mergedClassNames || !hasTwMergeEnabled(config)) {
      return mergedClassNames;
    }
    
    // Apply tailwind-merge to resolve class conflicts
    return processClassNamesWithTwMerge(mergedClassNames, config!);
  };
};

import type { Config, TV } from "@/types";
import { mergeObjects } from "@/utils";
import { tv } from "@/core/tv";

/**
 * Creates a TV function with a default configuration
 * 
 * @param defaultConfig - The default configuration to use for all TV calls
 * @returns A TV function that uses the default config, with optional override capability
 */
export const createTV = (defaultConfig: Config): TV => {
  /**
   * Returns a TV function that merges the default config with any provided config
   * 
   * @param options - The TV options (base, variants, slots, etc.)
   * @param overrideConfig - Optional config to override the default config
   * @returns The result of calling tv with merged configuration
   */
  return (options, overrideConfig) => {
    // If no override config is provided, use the default config
    if (!overrideConfig) {
      return tv(options, defaultConfig);
    }
    
    // If override config is provided, merge it with the default config
    // The override config takes precedence over the default config
    const mergedConfig = mergeObjects(defaultConfig, overrideConfig);
    return tv(options, mergedConfig);
  };
};

/**
 * createTV function for creating tailwind-variants with custom configuration
 */

import type { SlotsSchema, TVComponent, TVConfig, TVReturnType, VariantSchema } from "./types";

import { tv } from "./tv";

/**
 * Creates a TV function with custom default configuration
 */
export const createTV = (defaultConfig: TVConfig = {}) => {
  return <V extends VariantSchema, S extends SlotsSchema>(
    component: TVComponent<V, S>,
    config: TVConfig = {},
  ): TVReturnType<V, S> => {
    // Merge default config with provided config, with provided config taking precedence
    const mergedConfig = { ...defaultConfig, ...config };

    return tv(component, mergedConfig);
  };
};

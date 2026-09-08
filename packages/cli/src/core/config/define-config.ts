import type { CodefastConfig } from "#/core/config/schema";

/**
 * Types a `codefast.config.*` object for editor autocomplete and type-checking; returns it unchanged.
 */
export function defineConfig(config: CodefastConfig): CodefastConfig {
  return config;
}

import type { CodefastConfig } from "#/core/config/schema";

/**
 * Types a `codefast.config.*` object for editor autocomplete and type-checking; returns it unchanged.
 *
 * @since 0.10.0
 */
export function defineConfig(config: CodefastConfig): CodefastConfig {
  return config;
}

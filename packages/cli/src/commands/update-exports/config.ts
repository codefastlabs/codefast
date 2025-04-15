import { merge } from "lodash-es";
import fs from "node:fs";
import path from "node:path";

import type { PackageConfig, ScriptConfig } from "@/commands/update-exports/types";

import { ScriptConfigSchema } from "@/commands/update-exports/types";

// Cache for storing configuration to avoid repeated file reads
let cachedConfig: null | ScriptConfig = null;

/**
 * Loads and validates configuration from a file
 * @param configPath - Optional path to the config file
 * @returns Partial ScriptConfig or empty object if not found/invalid
 */
function loadConfigFile(configPath?: string): Partial<ScriptConfig> {
  if (!configPath) {
    return {};
  }

  try {
    const fullPath = path.resolve(configPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Configuration file not found at ${fullPath}`);

      return {};
    }

    const configContent = fs.readFileSync(fullPath, "utf8");
    const config = JSON.parse(configContent);

    // Validate against schema
    return ScriptConfigSchema.parse(config);
  } catch (error) {
    console.error("Error reading configuration file:", error);

    return {};
  }
}

/**
 * Retrieves merged configuration, using cache if no path is provided
 * @param configPath - Optional path to override default config
 * @returns Merged ScriptConfig
 */
export function getConfig(configPath?: string): ScriptConfig {
  if (cachedConfig && !configPath) {
    return cachedConfig;
  }

  const userConfig = loadConfigFile(configPath);
  const config = merge({}, defaultConfig, userConfig) as ScriptConfig;

  // Cache config if no path is provided
  if (!configPath) {
    cachedConfig = config;
  }

  return config;
}

/**
 * Retrieves configuration for a specific package
 * @param packageName - Name of the package
 * @param config - Optional ScriptConfig to use
 * @returns PackageConfig combining defaults and custom settings
 */
export function getPackageConfig(packageName: string, config?: ScriptConfig): PackageConfig {
  const configObj = config ?? getConfig();
  const customConfig = configObj.customPackageConfigs[packageName] ?? {};

  return {
    ...configObj.defaultPackageConfig,
    ...customConfig,
  };
}

// Default configuration for the script
export const defaultConfig: ScriptConfig = {
  packagesGlob: "./packages/**/package.json",
  defaultPackageConfig: {
    cjsOutputPattern: "./dist/cjs/{dir}/{name}.cjs",
    esmOutputPattern: "./dist/esm/{dir}/{name}.js",
    packageJsonPath: "package.json",
    srcIndexPath: "src/index.ts",
    typesOutputCjsPattern: "./dist/types/{dir}/{name}.d.ts",
    typesOutputPattern: "./dist/types/{dir}/{name}.d.ts",
  },
  customPackageConfigs: {
    "@codefast/ui": {
      exportPathPrefixesToRemove: ["components"],
    },
    "@codefast/style-guide": {
      exportPathPrefixesToRemove: ["configs"],
    },
  },
};

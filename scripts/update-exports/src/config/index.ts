import fs from "node:fs";
import path from "node:path";

import type { PackageConfig, ScriptConfig } from "@/types/config";

import { defaultConfig } from "@/config/default-config";
import { ScriptConfigSchema } from "@/config/schema";
import { mergeDeep } from "@/utils/path-utils";

let cachedConfig: null | ScriptConfig = null;

/**
 * Đọc file cấu hình từ đường dẫn
 */
function loadConfigFile(configPath?: string): Partial<ScriptConfig> {
  if (!configPath) {
    return {};
  }

  try {
    const fullPath = path.resolve(configPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Không tìm thấy file cấu hình tại ${fullPath}`);

      return {};
    }

    const configContent = fs.readFileSync(fullPath, "utf8");
    const config = JSON.parse(configContent);

    // Validate schema
    return ScriptConfigSchema.parse(config);
  } catch (error) {
    console.error("Lỗi khi đọc file cấu hình:", error);

    return {};
  }
}

/**
 * Lấy cấu hình kết hợp
 */
export function getConfig(configPath?: string): ScriptConfig {
  if (cachedConfig && !configPath) {
    return cachedConfig;
  }

  const userConfig = loadConfigFile(configPath);
  const config = mergeDeep(defaultConfig, userConfig) as ScriptConfig;

  // Cache nếu không truyền configPath
  if (!configPath) {
    cachedConfig = config;
  }

  return config;
}

/**
 * Lấy cấu hình cho một package dựa trên package name
 */
export function getPackageConfig(packageName: string, config?: ScriptConfig): PackageConfig {
  const configObj = config ?? getConfig();
  const customConfig = configObj.customPackageConfigs[packageName] ?? {};

  return {
    ...configObj.defaultPackageConfig,
    ...customConfig,
  };
}

import { glob } from "glob";
import path from "node:path";

import type { ProcessOptions, ScriptConfig } from "@/commands/update-exports/types";
import type { Logger } from "@/lib/logger";

import { analyzeImports } from "@/commands/update-exports/analyze-imports";
import { getConfig, getPackageConfig } from "@/commands/update-exports/config";
import {
  backupPackageJson,
  fileExists,
  readPackageJson,
  saveExportsAnalysis,
  saveExportsPreview,
  savePackageJson,
} from "@/commands/update-exports/file-utils";
import { generateExports } from "@/commands/update-exports/generate-exports";

const DEFAULT_IGNORE_PATTERN = ["**/node_modules/**"];

/**
 * Finds all package.json files in the workspace
 * @param config - Optional ScriptConfig
 * @returns Array of package.json paths
 */
export async function findAllPackages(config?: ScriptConfig): Promise<string[]> {
  const configObj = config ?? getConfig();

  return await glob(configObj.packagesGlob, {
    ignore: DEFAULT_IGNORE_PATTERN,
  });
}

/**
 * Processes a single package
 * @param packageJsonPath - Path to package.json
 * @param options - Processing options
 * @param logger - Logger instance
 * @returns True if processing was successful
 */
export function processPackage(packageJsonPath: string, options: ProcessOptions, logger: Logger): boolean {
  const packageDir = path.dirname(packageJsonPath);
  const packageJson = readPackageJson(packageJsonPath);

  if (!packageJson) {
    logger.error(`Failed to read ${packageJsonPath}`);

    return false;
  }

  const packageName = packageJson.name;

  // Skip if package doesn't match filter
  if (options.packageFilter && packageName !== options.packageFilter) {
    logger.debug(`Skipping ${packageName} (does not match filter)`);

    return false;
  }

  logger.info(`\n📦 Processing package: ${packageName}`);

  const config = getConfig(options.configPath);
  const packageConfig = getPackageConfig(packageName, config);
  const srcIndexPath = path.join(packageDir, packageConfig.srcIndexPath);

  if (!fileExists(srcIndexPath)) {
    logger.error(`Source file not found at ${srcIndexPath}`);

    return false;
  }

  // Analyze imports
  logger.info(`🔍 Analyzing imports from ${srcIndexPath}...`);
  const { imports } = analyzeImports(srcIndexPath, packageConfig);

  if (imports.length === 0) {
    logger.warn(`No imports found to analyze in ${packageName}`);

    return false;
  }

  logger.success(`Analysis complete. Found ${imports.length} subpath exports.`);

  // Save analysis results
  saveExportsAnalysis(packageDir, { imports });

  // Generate new exports
  const newExports = generateExports(packageName, imports, packageJson.exports, config);

  // Compare export counts
  const currentExportsCount = packageJson.exports ? Object.keys(packageJson.exports).length : 0;
  const newExportsCount = Object.keys(newExports).length;

  logger.info(`📊 Exports: ${currentExportsCount} -> ${newExportsCount}`);

  if (options.dryRun) {
    saveExportsPreview(packageDir, newExports);
    logger.warn(`🧪 📄 Saved exports preview to .exports-analysis`);
    logger.warn(`🧪 🚫 Dry run: no changes saved for ${packageName}`);

    return true;
  }

  // Backup package.json
  if (backupPackageJson(packageJsonPath)) {
    logger.success(`Backed up ${packageJsonPath}`);
  }

  // Update package.json
  const updatedPackageJson = { ...packageJson, exports: newExports };

  if (savePackageJson(packageJsonPath, updatedPackageJson)) {
    logger.success(`Updated exports for ${packageName}`);

    return true;
  }

  logger.error(`Failed to update ${packageJsonPath}`);

  return false;
}

/**
 * Processes all packages in the workspace
 * @param options - Processing options
 * @param logger - Logger instance
 */
export async function processAllPackages(options: ProcessOptions, logger: Logger): Promise<void> {
  try {
    logger.info("🔍 Searching for packages...");
    const config = getConfig(options.configPath);
    const packageJsonPaths = await findAllPackages(config);

    if (packageJsonPaths.length === 0) {
      logger.warn("⚠️ No packages found.");

      return;
    }

    logger.success(`✅ Found ${packageJsonPaths.length} packages.`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const packageJsonPath of packageJsonPaths) {
      const result = processPackage(packageJsonPath, options, logger);

      if (result) {
        successCount++;
      } else if (options.packageFilter) {
        skipCount++;
      } else {
        errorCount++;
      }
    }

    logger.success("\n✅ Completed exports update.");
    logger.info(`📊 Stats: ${successCount} succeeded, ${skipCount} skipped, ${errorCount} failed`);
  } catch (error) {
    logger.error("❌ Error processing packages:", error);
    throw error;
  }
}

import * as fs from "node:fs";
import * as path from "node:path";

import { DEV_DEPENDENCIES, MAIN_DEPENDENCIES, PACKAGES_TO_REMOVE } from "@/commands/create-project/constants";
import { runCommand } from "@/commands/create-project/utils";

/**
 * Installs project dependencies and development tools required for the application.
 *
 * This function handles the installation of both runtime and development dependencies
 * using the package manager. It ensures the necessary libraries and tools are added to the project
 * for proper operation and coding standards enforcement.
 *
 * @returns void - Does not return a value.
 */
export function installDependencies(): void {
  console.log(`\n📚 Installing dependencies...`);

  // Install main dependencies
  if (MAIN_DEPENDENCIES.length > 0) {
    runCommand(`pnpm add ${MAIN_DEPENDENCIES.join(" ")}`);
  }

  // Install development dependencies
  const allDevDependencies = Object.values(DEV_DEPENDENCIES).flat().join(" ");

  if (allDevDependencies) {
    runCommand(`pnpm add -D ${allDevDependencies}`);
  }
}

/**
 * Removes unnecessary packages that might conflict with the project configuration
 * or are redundant due to alternative packages being used.
 *
 * @returns void - Does not return a value.
 */
export function cleanupPackages(): void {
  console.log(`\n🧹 Cleaning up unnecessary packages...`);

  // Read package.json to check existing dependencies
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.warn(`⚠️ package.json not found, skipping cleanup.`);

    return;
  }

  let packageJson;

  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    console.warn(`⚠️ Error reading package.json: ${errorMessage}, skipping cleanup.`);

    return;
  }

  // Get existing dependencies and devDependencies
  const dependencies = packageJson.dependencies ?? {};
  const devDependencies = packageJson.devDependencies ?? {};

  // Filter packages to remove only those that exist in package.json
  const packagesToRemove = PACKAGES_TO_REMOVE.filter((pkg) => pkg in dependencies || pkg in devDependencies);

  if (packagesToRemove.length > 0) {
    runCommand(`pnpm remove ${packagesToRemove.join(" ")}`);
  } else {
    console.log(`ℹ️ No unnecessary packages found in package.json to remove.`);
  }
}

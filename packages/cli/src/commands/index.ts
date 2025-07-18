import { glob } from "fast-glob";
import { Project } from "ts-morph";

import { logger } from "@/utils";

/**
 * Find TypeScript files in a directory
 */
export async function findTsFiles(pattern = "**/*.ts"): Promise<string[]> {
  try {
    const files = await glob(pattern, {
      ignore: ["node_modules/**", "dist/**", "**/*.d.ts"],
    });

    return files;
  } catch (error) {
    logger.error(`Error finding TypeScript files: ${String(error)}`);

    return [];
  }
}

/**
 * Analyze TypeScript files using ts-morph
 */
export function analyzeProject(tsConfigPath?: string): Project {
  const project = new Project({
    tsConfigFilePath: tsConfigPath,
  });

  return project;
}

/**
 * Get basic information about TypeScript files
 */
export async function getProjectInfo(pattern = "src/**/*.ts"): Promise<void> {
  logger.info("🔍 Analyzing TypeScript project...");

  const files = await findTsFiles(pattern);

  logger.success(`Found ${String(files.length)} TypeScript files`);

  if (files.length > 0) {
    const project = analyzeProject();

    project.addSourceFilesAtPaths(files);

    const sourceFiles = project.getSourceFiles();

    logger.warning(`Loaded ${String(sourceFiles.length)} source files for analysis`);

    // Basic analysis
    let totalClasses = 0;
    let totalFunctions = 0;
    let totalInterfaces = 0;

    for (const sourceFile of sourceFiles) {
      totalClasses += sourceFile.getClasses().length;
      totalFunctions += sourceFile.getFunctions().length;
      totalInterfaces += sourceFile.getInterfaces().length;
    }

    logger.info(`📊 Project Statistics:`);
    logger.info(`  Classes: ${String(totalClasses)}`);
    logger.info(`  Functions: ${String(totalFunctions)}`);
    logger.info(`  Interfaces: ${String(totalInterfaces)}`);
  }
}

import chalk from "chalk";
import { glob } from "fast-glob";
import { Project } from "ts-morph";

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
    console.error(chalk.red("Error finding TypeScript files:"), error);

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
  console.log(chalk.blue("🔍 Analyzing TypeScript project..."));

  const files = await findTsFiles(pattern);

  console.log(chalk.green(`Found ${files.length} TypeScript files`));

  if (files.length > 0) {
    const project = analyzeProject();

    project.addSourceFilesAtPaths(files);

    const sourceFiles = project.getSourceFiles();

    console.log(chalk.yellow(`Loaded ${sourceFiles.length} source files for analysis`));

    // Basic analysis
    let totalClasses = 0;
    let totalFunctions = 0;
    let totalInterfaces = 0;

    for (const sourceFile of sourceFiles) {
      totalClasses += sourceFile.getClasses().length;
      totalFunctions += sourceFile.getFunctions().length;
      totalInterfaces += sourceFile.getInterfaces().length;
    }

    console.log(chalk.cyan(`📊 Project Statistics:`));
    console.log(chalk.white(`  Classes: ${totalClasses}`));
    console.log(chalk.white(`  Functions: ${totalFunctions}`));
    console.log(chalk.white(`  Interfaces: ${totalInterfaces}`));
  }
}

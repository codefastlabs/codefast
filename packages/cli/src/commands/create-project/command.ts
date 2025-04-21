import type { Command } from "commander";

import { checkExistingProject } from "@/commands/create-project/check-existing-project";
import {
  createConfigFiles,
  updateLayoutFile,
  updateNextConfig,
  updatePackageJson,
  updatePageFile,
  updatePostcssConfig,
} from "@/commands/create-project/config-files";
import { cleanupPackages, installDependencies } from "@/commands/create-project/dependencies";
import { checkEnvironment } from "@/commands/create-project/environment";
import { createNextProject } from "@/commands/create-project/next-project";
import { rl, runCommand } from "@/commands/create-project/utils";

/**
 * Sets up the "create-project" command in the provided CLI program. This command allows users
 * to create a new Next.js project with a recommended configuration.
 *
 * The "create-project" command includes features such as scaffolding a Next.js project, applying
 * TypeScript, TailwindCSS, ESLint, Prettier, Git hooks, and other tools, ensuring a streamlined
 * development experience.
 *
 * @param program - The CLI program instance in which the command will be registered.
 */
export function createProjectCommand(program: Command): void {
  program
    .command("create-project [name]")
    .description("Create a new Next.js project with recommended setup")
    .action(async (projectNameArg) => {
      try {
        // Check environment (PNPM, write permissions)
        checkEnvironment();

        // Check if package.json exists and get the project name
        const { projectName, packageJsonExists } = await checkExistingProject(projectNameArg);

        if (!packageJsonExists) {
          console.log(`\n🚀 Starting project creation for ${projectName}...\n`);
          createNextProject(projectName);
          process.chdir(projectName);
          console.log(`📂 Moved to ${projectName}`);
        }

        // Update layout.tsx to use fontVariables
        updateLayoutFile(process.cwd());

        // Update page.tsx to add JSX.Element return types
        updatePageFile(process.cwd());

        // Edit the postcss.config.mjs file
        updatePostcssConfig(process.cwd());

        // Install dependencies
        installDependencies();

        // Remove unwanted packages
        cleanupPackages();

        // Create configuration files
        createConfigFiles(process.cwd());

        // Update next.config.ts with experimental configuration
        updateNextConfig(process.cwd());

        // Update package.json
        updatePackageJson(process.cwd());

        // Enable git hooks
        console.log(`\n🔄 Activating git hooks...`);
        runCommand("pnpm simple-git-hooks");

        // Run Prettier to format the file
        console.log(`\n📝 Formatting files with Prettier...`);
        runCommand("pnpm format");

        // Run ESLint
        console.log(`\n🔍 Running ESLint to check code style...`);
        runCommand("pnpm lint");

        // Completion notice
        console.log(`\n✅ Project ${packageJsonExists ? "configured" : "created"} successfully!`);
        console.log(`- Project: ${projectName}`);
        console.log("- Next.js with TypeScript");
        console.log("- TailwindCSS and @codefast/ui");
        console.log("- ESLint, Prettier, Commitlint, and Git Hooks");
        console.log("- Lint-staged for pre-commit checks");
        console.log(`\n📁 Project directory: ${process.cwd()}`);
        console.log(`\n🚀 To start development:`);
        console.log(`cd ${projectName} && pnpm dev`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        console.error(`\n❌ An error occurred: ${errorMessage}`);
        process.exit(1);
      } finally {
        // Close readline interface
        rl.close();
      }
    });
}

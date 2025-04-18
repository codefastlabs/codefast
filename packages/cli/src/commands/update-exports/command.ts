import type { Command } from "commander";

import type { ProcessOptions } from "@/commands/update-exports/types";

import { processAllPackages } from "@/commands/update-exports/process-package";

/**
 * Creates a commander command for updating exports
 * @param program - Commander program instance
 */
export function createUpdateExportsCommand(program: Command): void {
  // noinspection RequiredAttributes
  program
    .command("update-exports")
    .description("Updates exports for all packages")
    .option("-p, --package <package>", "Filter by package name")
    .option("-d, --dry-run", "Run without making changes")
    .option("-c, --config <path>", "Path to configuration file")
    .action(async (options) => {
      const processorOptions: ProcessOptions = {
        packageFilter: options.package,
        dryRun: Boolean(options.dryRun),
        configPath: options.config,
      };

      try {
        await processAllPackages(processorOptions);
      } catch (error) {
        console.error("Error processing packages:", error);
        process.exit(1);
      }
    });
}

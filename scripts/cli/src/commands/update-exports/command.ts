import type { Command } from "commander";

import type { ProcessOptions } from "@/commands/update-exports/types";

import { processAllPackages } from "@/commands/update-exports/process-package";
import { Logger } from "@/lib/logger";

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
    .option("-v, --verbose", "Show detailed output")
    .option("-c, --config <path>", "Path to configuration file")
    .action(async (options) => {
      const processorOptions: ProcessOptions = {
        packageFilter: options.package,
        dryRun: Boolean(options.dryRun),
        verbose: Boolean(options.verbose),
        configPath: options.config,
      };

      const logger = new Logger({ verbose: processorOptions.verbose });

      try {
        await processAllPackages(processorOptions, logger);
      } catch (error) {
        logger.error("Error processing packages:", error);
        process.exit(1);
      }
    });
}

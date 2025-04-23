import { Command } from "commander";
import { inject, injectable } from "inversify";
import * as process from "node:process";

import type { UpdateExportsUseCase } from "@/application/use-cases/update-exports.use-case";
import type { ScriptConfig } from "@/domain/entities/package-config";

import { TYPES } from "@/ioc/types";

@injectable()
export class UpdateExportsCommand {
  constructor(@inject(TYPES.UpdateExportsUseCase) private updateExportsUseCase: UpdateExportsUseCase) {}

  /**
   * Returns a Commander.js command for updating package exports.
   * @param config - Script configuration for package export patterns.
   * @returns Configured Commander.js command.
   */
  getCommand(config: ScriptConfig): Command {
    return new Command()
      .name("update-exports")
      .description("Updates exports for all packages")
      .option("-p, --package <package>", "Filter by package name")
      .option("-d, --dry-run", "Run without making changes")
      .option("-c, --config <path>", "Path to configuration file")
      .action(async (options: { config?: string; dryRun?: string; package?: string }) => {
        await this.updateExportsUseCase.execute(
          {
            packageFilter: options.package,
            dryRun: Boolean(options.dryRun),
            configPath: options.config,
          },
          config,
        );

        process.exit(0);
      });
  }
}

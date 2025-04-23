import { Command } from "commander";
import { inject, injectable } from "inversify";

import type { ConfigServiceInterface } from "@/domain/interfaces/config.service";
import type { PackageInfoServiceInterface } from "@/domain/interfaces/package-info.service";

import { CreateProjectCommand } from "@/application/commands/create-project.command";
import { UpdateExportsCommand } from "@/application/commands/update-exports.command";
import { TYPES } from "@/ioc/types";

@injectable()
export class CLIAdapter {
  constructor(
    @inject(TYPES.CreateProjectCommand) private createProjectCommand: CreateProjectCommand,
    @inject(TYPES.UpdateExportsCommand) private updateExportsCommand: UpdateExportsCommand,
    @inject(TYPES.PackageInfoService) private packageInfoService: PackageInfoServiceInterface,
    @inject(TYPES.ConfigService) private configService: ConfigServiceInterface,
  ) {}

  /**
   * Initializes the CLI with commands for project creation and export updates.
   */
  initialize(): void {
    const program = new Command();

    program
      .name("codefast")
      .description("CodeFast CLI - A development toolkit for CodeFast.")
      .version(this.packageInfoService.getPackageVersion(), "-v, --version", "display CLI version")
      .addCommand(this.createProjectCommand.getCommand(this.configService.getConfigGroups()))
      .addCommand(this.updateExportsCommand.getCommand(this.configService.getScriptConfig()))
      .parse(process.argv);
  }
}

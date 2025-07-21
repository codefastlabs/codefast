/**
 * Tree Shaking Command
 *
 * CLI command for analyzing and optimizing tree-shaking in monorepo packages.
 * Following explicit architecture guidelines for command organization.
 */

import type { Command } from "commander";

import { inject, injectable } from "inversify";

import type { CommandInterface } from "@/commands/interfaces/command.interface";
import type { LoggingServicePort } from "@/core/application/ports/services/logging.service.port";
import type { AnalyzeTreeShakingUseCase } from "@/core/application/use-cases/analyze-tree-shaking.use-case";

import { TYPES } from "@/di/types";

@injectable()
export class TreeShakingCommand implements CommandInterface {
  readonly name = "tree-shaking";
  readonly description = "Analyze and optimize tree-shaking for monorepo packages";

  constructor(
    @inject(TYPES.AnalyzeTreeShakingUseCase)
    private readonly analyzeTreeShakingUseCase: AnalyzeTreeShakingUseCase,
    @inject(TYPES.LoggingServicePort)
    private readonly loggingService: LoggingServicePort,
  ) {}

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option("-p, --packages <path>", "path to packages directory", "packages")
      .option("-n, --package-name <name>", "analyze specific package only")
      .option("--fix", "attempt to fix tree-shaking issues automatically", false)
      .option("--json", "output results in JSON format", false)
      .option("--threshold <score>", "minimum tree-shaking score threshold", "80")
      .action(
        async (options: {
          packages?: string;
          packageName?: string;
          fix?: boolean;
          json?: boolean;
          threshold?: string;
        }) => {
          const analyses = await this.analyzeTreeShakingUseCase.execute({
            fix: options.fix,
            packageName: options.packageName,
            packagesPath: options.packages,
          });

          // Handle JSON output
          if (options.json) {
            console.log(JSON.stringify(analyses, null, 2));

            return;
          }

          // Check threshold and exit with the appropriate code
          const threshold = Number.parseInt(options.threshold ?? "80", 10);
          const failingPackages = analyses.filter((a) => a.treeShakingScore < threshold);

          if (failingPackages.length > 0) {
            this.loggingService.spacing();
            this.loggingService.result(
              `${failingPackages.length} package(s) below threshold (${threshold})`,
              "error",
            );
            process.exit(1);
          } else {
            this.loggingService.spacing();
            this.loggingService.result(
              `All packages meet tree-shaking threshold (${threshold})`,
              "success",
            );
          }
        },
      );
  }
}

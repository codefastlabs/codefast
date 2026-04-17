import process from "node:process";
import { injectable } from "@codefast/di";
import { Command } from "commander";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { consumeCliAppError } from "#/lib/core/presentation/cli-executor.presenter";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { parseWithCliSchema } from "#/lib/core/presentation/parse-cli-schema.presenter";
import { tagSyncRunRequestSchema } from "#/lib/tag/presentation/tag-cli-schema.presenter";
import {
  CliLoggerToken,
  type CreateTagProgressListenerPresenter,
  CreateTagProgressListenerPresenterToken,
  type PrepareTagOrchestrator,
  PrepareTagOrchestratorToken,
  type PresentTagSyncResultPresenter,
  PresentTagSyncResultPresenterToken,
  type RunTagSyncUseCase,
  RunTagSyncUseCaseToken,
} from "#/lib/tokens";

@injectable([
  CliLoggerToken,
  PrepareTagOrchestratorToken,
  RunTagSyncUseCaseToken,
  CreateTagProgressListenerPresenterToken,
  PresentTagSyncResultPresenterToken,
] as const)
export class TagCommand implements CliCommand {
  readonly name = "tag";
  readonly description = "Add @since <version> JSDoc tags to exported declarations";

  constructor(
    private readonly logger: CliLogger,
    private readonly prepareTagSync: PrepareTagOrchestrator,
    private readonly runTagSync: RunTagSyncUseCase,
    private readonly createProgressListener: CreateTagProgressListenerPresenter,
    private readonly presentSyncCliResult: PresentTagSyncResultPresenter,
  ) {}

  register(program: Command): void {
    program
      .command(this.name)
      .alias("annotate")
      .description(this.description)
      .argument(
        "[target]",
        "Directory or file to annotate (default: auto-discover workspace packages)",
      )
      .option("--dry-run", "Show summary without writing files", false)
      .action(this.execute.bind(this));
  }

  async execute(
    target: string | undefined,
    options: { dryRun?: boolean },
    command: Command,
  ): Promise<void> {
    const prelude = await this.prepareTagSync.execute({
      currentWorkingDirectory: process.cwd(),
      rawTarget: target,
      globalCliRaw: command.optsWithGlobals(),
    });
    if (!consumeCliAppError(this.logger, prelude)) {
      return;
    }
    const { rootDir, config, resolvedTargetPath } = prelude.value;
    const tagConfig = config.tag ?? {};
    const parsed = parseWithCliSchema(tagSyncRunRequestSchema, {
      rootDir,
      write: !options.dryRun,
      targetPath: resolvedTargetPath,
      skipPackages: tagConfig.skipPackages,
      config: tagConfig,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    const tagOutcome = await this.runTagSync.execute({
      ...parsed.value,
      listener: this.createProgressListener((line) => this.logger.out(line)),
    });
    if (!consumeCliAppError(this.logger, tagOutcome)) {
      return;
    }
    process.exitCode = this.presentSyncCliResult(tagOutcome.value, rootDir);
  }
}

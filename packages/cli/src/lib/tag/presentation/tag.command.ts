import { inject, injectable } from "@codefast/di";
import { Command } from "commander";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliRuntime } from "#/lib/core/application/ports/runtime.port";
import { consumeCliAppError } from "#/lib/core/presentation/cli-executor.presenter";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { parseWithCliSchema } from "#/lib/core/presentation/parse-cli-schema.presenter";
import { formatTagSyncJsonOutput } from "#/lib/tag/application/tag-sync-json.format";
import { exitCodeForTagSyncResult } from "#/lib/tag/application/tag-sync-cli-result";
import {
  PrepareTagOrchestratorToken,
  PresentTagSyncResultPresenterToken,
  RunTagSyncUseCaseToken,
  TagSyncProgressListenerToken,
} from "#/lib/tag/contracts/tokens";
import type {
  PrepareTagOrchestrator,
  PresentTagSyncResultPresenter,
} from "#/lib/tag/contracts/presentation.contract";
import type { TagProgressListener } from "#/lib/tag/domain/types.domain";
import type { RunTagSyncUseCase } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";
import { tagSyncRunRequestSchema } from "#/lib/tag/presentation/tag-cli-schema.presenter";
import { CliLoggerToken, CliRuntimeToken } from "#/lib/core/contracts/tokens";

@injectable([
  inject(CliLoggerToken),
  inject(CliRuntimeToken),
  inject(PrepareTagOrchestratorToken),
  inject(RunTagSyncUseCaseToken),
  inject(TagSyncProgressListenerToken),
  inject(PresentTagSyncResultPresenterToken),
])
export class TagCommand implements CliCommand {
  readonly name = "tag";
  readonly description = "Add @since <version> JSDoc tags to exported declarations";

  constructor(
    private readonly logger: CliLogger,
    private readonly runtime: CliRuntime,
    private readonly prepareTagSync: PrepareTagOrchestrator,
    private readonly runTagSync: RunTagSyncUseCase,
    private readonly tagProgressListener: TagProgressListener,
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
      .option("--json", "Print one JSON summary on stdout (suppresses human progress)", false)
      .action(this.execute.bind(this));
  }

  async execute(
    target: string | undefined,
    options: { dryRun?: boolean; json?: boolean },
    command: Command,
  ): Promise<void> {
    const prelude = await this.prepareTagSync.execute({
      currentWorkingDirectory: this.runtime.cwd(),
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
      json: options.json,
      targetPath: resolvedTargetPath,
      skipPackages: tagConfig.skipPackages,
      config: tagConfig,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    const tagOutcome = await this.runTagSync.execute({
      ...parsed.value,
      listener: parsed.value.json ? undefined : this.tagProgressListener,
    });
    if (!consumeCliAppError(this.logger, tagOutcome)) {
      return;
    }
    if (parsed.value.json) {
      this.logger.out(formatTagSyncJsonOutput(tagOutcome.value, rootDir));
      this.runtime.setExitCode(exitCodeForTagSyncResult(tagOutcome.value));
    } else {
      this.runtime.setExitCode(this.presentSyncCliResult.present(tagOutcome.value, rootDir));
    }
  }
}

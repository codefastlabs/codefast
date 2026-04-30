import { inject, injectable } from "@codefast/di";
import { Command } from "commander";
import type { CliExecutorPort } from "#/shell/application/ports/cli-executor.port";
import type { SchemaValidationPort } from "#/shell/application/ports/schema-validation.port";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import type { CliRuntime } from "#/shell/application/ports/runtime.port";
import type { CliCommand } from "#/shell/contracts/cli-command.contract";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";
import type { PrepareTagSyncUseCase } from "#/domains/tag/application/use-cases/prepare-tag-sync.use-case";
import type { RunTagSyncUseCase } from "#/domains/tag/application/use-cases/run-tag-sync.use-case";
import { exitCodeForTagSyncResult } from "#/domains/tag/application/tag-sync-cli-result";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/contracts/tag-sync-result-presenter.contract";
import {
  PrepareTagSyncUseCaseToken,
  PresentTagSyncResultPresenterToken,
  RunTagSyncUseCaseToken,
  TagSyncProgressListenerToken,
} from "#/domains/tag/contracts/tokens";
import type { TagProgressListener, TagSyncResult } from "#/domains/tag/domain/types.domain";
import { tagSyncRunRequestSchema } from "#/domains/tag/presentation/presenters/tag-cli.schema";
import {
  CliExecutorPortToken,
  CliLoggerToken,
  CliRuntimeToken,
  SchemaValidationPortToken,
} from "#/shell/application/cli-runtime.tokens";

@injectable([
  inject(CliLoggerToken),
  inject(CliRuntimeToken),
  inject(PrepareTagSyncUseCaseToken),
  inject(RunTagSyncUseCaseToken),
  inject(TagSyncProgressListenerToken),
  inject(PresentTagSyncResultPresenterToken),
  inject(SchemaValidationPortToken),
  inject(CliExecutorPortToken),
])
export class TagCommand implements CliCommand {
  readonly name = CLI_COMMAND_SLOT_NAME.tag;
  readonly description = "Add @since <version> JSDoc tags to exported declarations";

  constructor(
    private readonly logger: CliLogger,
    private readonly runtime: CliRuntime,
    private readonly prepareTagSync: PrepareTagSyncUseCase,
    private readonly runTagSync: RunTagSyncUseCase,
    private readonly tagProgressListener: TagProgressListener,
    private readonly presentSyncCliResult: PresentTagSyncResultPresenter,
    private readonly schemaValidation: SchemaValidationPort,
    private readonly cliExecutor: CliExecutorPort,
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
    _command: Command,
  ): Promise<void> {
    const prelude = await this.prepareTagSync.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      rawTarget: target,
    });
    if (!this.cliExecutor.consumeCliAppError(prelude)) {
      return;
    }
    const { rootDir, config, resolvedTargetPath } = prelude.value;
    const tagConfig = config.tag ?? {};
    const parsed = this.schemaValidation.parseWithSchema(tagSyncRunRequestSchema, {
      rootDir,
      write: !options.dryRun,
      json: options.json,
      targetPath: resolvedTargetPath,
      skipPackages: tagConfig.skipPackages,
      config: tagConfig,
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }
    const tagOutcome = await this.runTagSync.execute({
      ...parsed.value,
      listener: parsed.value.json ? undefined : this.tagProgressListener,
    });
    if (!this.cliExecutor.consumeCliAppError(tagOutcome)) {
      return;
    }
    if (parsed.value.json) {
      this.logger.out(this.formatTagSyncJsonOutput(tagOutcome.value, rootDir));
      this.runtime.setExitCode(exitCodeForTagSyncResult(tagOutcome.value));
    } else {
      this.runtime.setExitCode(this.presentSyncCliResult.present(tagOutcome.value, rootDir));
    }
  }

  private formatTagSyncJsonOutput(result: TagSyncResult, rootDir: string): string {
    return JSON.stringify({
      schemaVersion: 1 as const,
      ok: result.hookError === null,
      cwd: rootDir,
      result,
    });
  }
}

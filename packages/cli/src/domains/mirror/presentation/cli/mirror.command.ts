import { inject, injectable } from "@codefast/di";
import { Command } from "commander";
import type { CliExecutorPort } from "#/shell/application/ports/cli-executor.port";
import type { GlobalCliOptionsParsePort } from "#/shell/application/ports/global-cli-options-parse.port";
import type { SchemaValidationPort } from "#/shell/application/ports/schema-validation.port";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import type { CliRuntime } from "#/shell/application/ports/runtime.port";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/shell/domain/cli-exit-codes.domain";
import {
  PrepareMirrorSyncUseCaseToken,
  RunMirrorSyncUseCaseToken,
} from "#/domains/mirror/contracts/tokens";
import type { PrepareMirrorSyncUseCase } from "#/domains/mirror/application/use-cases/prepare-mirror-sync.use-case";
import type { RunMirrorSyncUseCase } from "#/domains/mirror/application/use-cases/run-mirror-sync.use-case";
import { mirrorSyncRunRequestSchema } from "#/domains/mirror/presentation/presenters/mirror-cli.schema";
import {
  CliExecutorPortToken,
  CliLoggerToken,
  CliRuntimeToken,
  GlobalCliOptionsParsePortToken,
  SchemaValidationPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type { CliCommand } from "#/shell/contracts/cli-command.contract";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";

@injectable([
  inject(CliLoggerToken),
  inject(CliRuntimeToken),
  inject(PrepareMirrorSyncUseCaseToken),
  inject(RunMirrorSyncUseCaseToken),
  inject(GlobalCliOptionsParsePortToken),
  inject(SchemaValidationPortToken),
  inject(CliExecutorPortToken),
])
export class MirrorCommand implements CliCommand {
  readonly name = CLI_COMMAND_SLOT_NAME.mirror;
  readonly description = "Keep package manifests aligned with what you ship";

  constructor(
    private readonly logger: CliLogger,
    private readonly runtime: CliRuntime,
    private readonly prepareMirrorSync: PrepareMirrorSyncUseCase,
    private readonly runMirrorSync: RunMirrorSyncUseCase,
    private readonly globalCliOptions: GlobalCliOptionsParsePort,
    private readonly schemaValidation: SchemaValidationPort,
    private readonly cliExecutor: CliExecutorPort,
  ) {}

  register(program: Command): void {
    const mirror = program.command(this.name).description(this.description);

    mirror
      .command("sync")
      .description("Write package.json exports from dist/ for workspace packages")
      .argument("[package]", "Optional package path relative to repo root (e.g. packages/ui)")
      .option("-v, --verbose", "Print extra diagnostics", false)
      .option("--json", "Print one JSON summary on stdout (suppresses human progress)", false)
      .action(this.execute.bind(this));
  }

  async execute(
    pkg: string | undefined,
    options: { verbose?: boolean; json?: boolean },
    command: Command,
  ): Promise<void> {
    const globalOptionsOutcome = this.globalCliOptions.parseGlobalCliOptions(
      command.optsWithGlobals(),
    );
    if (!this.cliExecutor.consumeCliAppError(globalOptionsOutcome)) {
      return;
    }
    const prelude = await this.prepareMirrorSync.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      packageArg: pkg,
      globals: globalOptionsOutcome.value,
    });
    if (!this.cliExecutor.consumeCliAppError(prelude)) {
      return;
    }
    const { rootDir, config, packageFilter, globals } = prelude.value;
    const parsed = this.schemaValidation.parseWithSchema(mirrorSyncRunRequestSchema, {
      rootDir,
      config: config.mirror ?? {},
      verbose: options.verbose,
      json: options.json,
      noColor: globals.color === false,
      packageFilter,
    });
    if (!this.cliExecutor.consumeCliAppError(parsed)) {
      return;
    }
    await this.cliExecutor.runCliResultAsync(this.runMirrorSync.execute(parsed.value), (stats) =>
      stats.packagesErrored > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS,
    );
  }
}

import { inject, injectable } from "@codefast/di";
import { Command } from "commander";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliRuntime } from "#/lib/core/application/ports/runtime.port";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/lib/core/domain/cli-exit-codes.domain";
import {
  PrepareMirrorSyncUseCaseToken,
  RunMirrorSyncUseCaseToken,
} from "#/lib/mirror/contracts/tokens";
import type { PrepareMirrorSyncUseCase } from "#/lib/mirror/application/use-cases/prepare-mirror-sync.use-case";
import type { RunMirrorSyncUseCase } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";
import { mirrorSyncRunRequestSchema } from "#/lib/mirror/presentation/mirror-cli.schema";
import { CliLoggerToken, CliRuntimeToken } from "#/lib/core/contracts/tokens";
import {
  consumeCliAppError,
  runCliResultAsync,
} from "#/lib/core/presentation/cli-executor.presenter";
import type { CliCommand } from "#/lib/kernel/contracts/cli-command.contract";
import { parseWithCliSchema } from "#/lib/core/presentation/cli-schema.parser";
import { parseGlobalCliOptions } from "#/lib/core/application/services/global-cli-options-parser.service";

@injectable([
  inject(CliLoggerToken),
  inject(CliRuntimeToken),
  inject(PrepareMirrorSyncUseCaseToken),
  inject(RunMirrorSyncUseCaseToken),
])
export class MirrorCommand implements CliCommand {
  readonly name = "mirror";
  readonly description = "Keep package manifests aligned with what you ship";

  constructor(
    private readonly logger: CliLogger,
    private readonly runtime: CliRuntime,
    private readonly prepareMirrorSync: PrepareMirrorSyncUseCase,
    private readonly runMirrorSync: RunMirrorSyncUseCase,
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
    const globalOptionsOutcome = parseGlobalCliOptions(command.optsWithGlobals());
    if (!consumeCliAppError(this.logger, globalOptionsOutcome)) {
      return;
    }
    const prelude = await this.prepareMirrorSync.execute({
      currentWorkingDirectory: this.runtime.cwd(),
      packageArg: pkg,
      globals: globalOptionsOutcome.value,
    });
    if (!consumeCliAppError(this.logger, prelude)) {
      return;
    }
    const { rootDir, config, packageFilter, globals } = prelude.value;
    const parsed = parseWithCliSchema(mirrorSyncRunRequestSchema, {
      rootDir,
      config: config.mirror ?? {},
      verbose: options.verbose,
      json: options.json,
      noColor: globals.color === false,
      packageFilter,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    await runCliResultAsync(this.logger, this.runMirrorSync.execute(parsed.value), (stats) =>
      stats.packagesErrored > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS,
    );
  }
}

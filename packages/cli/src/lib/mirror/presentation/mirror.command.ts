import process from "node:process";
import { inject, injectable } from "@codefast/di";
import { Command } from "commander";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/lib/core/domain/cli-exit-codes.domain";
import {
  PrepareMirrorOrchestratorToken,
  RunMirrorSyncUseCaseToken,
} from "#/lib/mirror/contracts/tokens";
import type { PrepareMirrorOrchestrator } from "#/lib/mirror/contracts/presentation.contract";
import type { RunMirrorSyncUseCase } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";
import { mirrorSyncRunRequestSchema } from "#/lib/mirror/presentation/mirror-cli-schema.presenter";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import {
  consumeCliAppError,
  runCliResultAsync,
} from "#/lib/core/presentation/cli-executor.presenter";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { parseWithCliSchema } from "#/lib/core/presentation/parse-cli-schema.presenter";

@injectable([
  inject(CliLoggerToken),
  inject(PrepareMirrorOrchestratorToken),
  inject(RunMirrorSyncUseCaseToken),
])
export class MirrorCommand implements CliCommand {
  readonly name = "mirror";
  readonly description = "Keep package manifests aligned with what you ship";

  constructor(
    private readonly logger: CliLogger,
    private readonly prepareMirrorSync: PrepareMirrorOrchestrator,
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
    const prelude = await this.prepareMirrorSync.execute({
      currentWorkingDirectory: process.cwd(),
      packageArg: pkg,
      globalCliRaw: command.optsWithGlobals(),
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

import process from "node:process";
import { injectable } from "@codefast/di";
import { Command } from "commander";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import {
  consumeCliAppError,
  runCliResultAsync,
} from "#/lib/core/presentation/cli-executor.presenter";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { parseWithCliSchema } from "#/lib/core/presentation/parse-cli-schema.presenter";
import { mirrorSyncRunRequestSchema } from "#/lib/mirror/presentation/mirror-cli-schema.presenter";
import {
  CliLoggerToken,
  type PrepareMirrorOrchestrator,
  PrepareMirrorOrchestratorToken,
  type RunMirrorSyncUseCase,
  RunMirrorSyncUseCaseToken,
} from "#/lib/tokens";

@injectable([CliLoggerToken, PrepareMirrorOrchestratorToken, RunMirrorSyncUseCaseToken] as const)
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
      .action(this.execute.bind(this));
  }

  async execute(
    pkg: string | undefined,
    options: { verbose?: boolean },
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
      noColor: globals.color === false,
      packageFilter,
    });
    if (!consumeCliAppError(this.logger, parsed)) {
      return;
    }
    await runCliResultAsync(this.logger, this.runMirrorSync.execute(parsed.value), (stats) =>
      stats.packagesErrored > 0 ? 1 : 0,
    );
  }
}

import process from "node:process";
import { Command } from "commander";
import { createCliContainer } from "#lib/core/infra/container.adapter";
import { consumeCliAppError } from "#lib/core/presentation/cli-executor.presenter";
import { parseWithCliSchema } from "#lib/core/presentation/parse-cli-schema.presenter";
import { runAsyncExitCodeUseCaseAfterParse } from "#lib/core/presentation/run-cli-use-case-after-parse.presenter";
import { MirrorSyncRunRequestSchema } from "#lib/mirror/presentation/mirror-cli-schema.presenter";

export function registerMirrorCommand(program: Command): void {
  const mirror = program
    .command("mirror")
    .description("Keep package manifests aligned with what you ship");

  mirror
    .command("sync")
    .description("Write package.json exports from dist/ for workspace packages")
    .argument("[package]", "Optional package path relative to repo root (e.g. packages/ui)")
    .option("-v, --verbose", "Print extra diagnostics", false)
    .action(async function (
      this: Command,
      pkg: string | undefined,
      options: { verbose?: boolean },
    ) {
      const cli = createCliContainer();
      const prelude = await cli.mirror.prepareMirrorSync({
        currentWorkingDirectory: process.cwd(),
        packageArg: pkg,
        globalCliRaw: this.optsWithGlobals(),
      });
      if (!consumeCliAppError(cli.logger, prelude)) {
        return;
      }
      const { rootDir, config, packageFilter, globals } = prelude.value;
      const parsed = parseWithCliSchema(MirrorSyncRunRequestSchema, {
        rootDir,
        config: config.mirror ?? {},
        verbose: options.verbose,
        noColor: globals.color === false,
        packageFilter,
      });
      await runAsyncExitCodeUseCaseAfterParse(cli, parsed, (input) =>
        cli.mirror.runMirrorSync(input),
      );
    });
}

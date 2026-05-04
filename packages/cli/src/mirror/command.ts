import process from "node:process";
import { Command } from "commander";
import { parseWithSchema } from "#/core/schema-parse";
import { consumeCliAppError } from "#/core/result-handle";
import { globalCliCommanderOptionsSchema } from "#/core/global-cli-options";
import { readOptionalPositionalArg } from "#/core/cli-positional";
import { logger } from "#/core/logger";
import { nodeFilesystem } from "#/core/node-filesystem";
import { prepareMirrorSync } from "#/mirror/prepare";
import { runMirrorSync } from "#/mirror/sync";
import { mirrorSyncRunRequestSchema } from "#/mirror/cli-schema";
import { exitCodeForMirrorSyncResult, formatMirrorSyncJsonOutput } from "#/mirror/cli-result";
import { MirrorSyncProgressPresenter } from "#/mirror/output";

export function createMirrorCommand(): Command {
  const cmd = new Command("mirror").description(
    "Keep package manifests aligned with what you ship",
  );

  cmd
    .command("sync")
    .description("Write package.json exports from dist/ for workspace packages")
    .argument("[package]", "Optional package path relative to repo root (e.g. packages/ui)")
    .option("-v, --verbose", "Print extra diagnostics", false)
    .option("--json", "Print one JSON summary on stdout (suppresses human progress)", false)
    .action(
      async (
        packageArg: string | undefined,
        opts: { verbose?: boolean; json?: boolean },
        command: Command,
      ) => {
        const globalsOptionCarrier =
          (command.optsWithGlobals?.() as Record<string, unknown> | undefined) ??
          (command.opts() as Record<string, unknown>);
        const globalOptionsOutcome = parseWithSchema(
          globalCliCommanderOptionsSchema,
          globalsOptionCarrier,
        );
        if (!consumeCliAppError(globalOptionsOutcome)) {
          return;
        }

        const prelude = await prepareMirrorSync(nodeFilesystem, {
          currentWorkingDirectory: process.cwd(),
          packageArg: readOptionalPositionalArg(packageArg),
          globals: globalOptionsOutcome.value,
        });
        if (!consumeCliAppError(prelude)) {
          return;
        }
        const { rootDir, config, packageFilter } = prelude.value;
        const parsed = parseWithSchema(mirrorSyncRunRequestSchema, {
          rootDir,
          config: config.mirror ?? {},
          packageFilter,
        });
        if (!consumeCliAppError(parsed)) {
          return;
        }

        const json = !!opts.json;
        const noColor = globalOptionsOutcome.value.color === false;
        const verbose = !!opts.verbose;

        const progressPresenter = new MirrorSyncProgressPresenter();
        const listener = json ? undefined : progressPresenter;
        if (!json) {
          progressPresenter.configure({ noColor, verbose });
        }

        const startTime = performance.now();
        const outcome = await runMirrorSync(nodeFilesystem, {
          ...parsed.value,
          listener,
        });
        if (!consumeCliAppError(outcome)) {
          return;
        }
        if (json) {
          logger.out(
            formatMirrorSyncJsonOutput(outcome.value, (performance.now() - startTime) / 1000),
          );
        }
        process.exitCode = exitCodeForMirrorSyncResult(outcome.value);
      },
    );

  return cmd;
}

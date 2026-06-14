import process from "node:process";

import { Command } from "commander";

import { globalCliCommanderOptionsSchema } from "#/core/cli/global-options";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError } from "#/core/cli/result-handle";
import { nodeFilesystem } from "#/core/filesystem/node";
import { logger } from "#/core/logger";
import { parseWithSchema } from "#/core/schema-parse";
import { exitCodeForMirrorSyncResult, formatMirrorSyncJsonOutput } from "#/mirror/cli-result";
import { mirrorSyncRunRequestSchema } from "#/mirror/cli-schema";
import { MirrorSyncProgressPresenter } from "#/mirror/output";
import { prepareMirrorSync } from "#/mirror/prepare";
import { runMirrorSync } from "#/mirror/sync";

/**
 * @since 0.3.16-canary.0
 */
export function createMirrorCommand(): Command {
  const cmd = new Command("mirror")
    .description("Write package.json exports from dist/ for workspace packages")
    .argument("[package]", "Optional package path relative to repo root (e.g. packages/ui)")
    .option("--dry-run", "Report what would change without writing package.json", false)
    .option("-v, --verbose", "Print extra diagnostics", false)
    .option("--json", "Print one JSON summary on stdout (suppresses human progress)", false)
    .action(
      async (
        packageArg: string | undefined,
        opts: { dryRun?: boolean; verbose?: boolean; json?: boolean },
        command: Command,
      ) => {
        const globalsOptionCarrier =
          (command.optsWithGlobals?.() as Record<string, unknown> | undefined) ??
          (command.opts() as Record<string, unknown>);
        const globalOptionsOutcome = parseWithSchema(globalCliCommanderOptionsSchema, globalsOptionCarrier);
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
        const write = !opts.dryRun;
        const { rootDir, config, packageFilter } = prelude.value;
        const parsed = parseWithSchema(mirrorSyncRunRequestSchema, {
          rootDir,
          config: config.mirror ?? {},
          packageFilter,
          write,
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
          progressPresenter.configure({ noColor, verbose, dryRun: !write });
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
          logger.out(formatMirrorSyncJsonOutput(outcome.value, (performance.now() - startTime) / 1000, write));
        }
        process.exitCode = exitCodeForMirrorSyncResult(outcome.value);
      },
    );

  return cmd;
}

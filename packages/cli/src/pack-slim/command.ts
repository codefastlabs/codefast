import process from "node:process";

import { Command } from "commander";

import { globalCliCommanderOptionsSchema } from "#/core/cli/global-options";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError } from "#/core/cli/result-handle";
import { AppError, messageFrom } from "#/core/errors";
import { nodeFilesystem } from "#/core/filesystem/node";
import { logger } from "#/core/logger";
import { err } from "#/core/result";
import { parseWithSchema } from "#/core/schema-parse";
import { findRepoRoot } from "#/core/workspace/resolver";
import { exitCodeForPackSlimResult, formatPackSlimJsonOutput } from "#/pack-slim/cli-result";
import { packSlimRunRequestSchema } from "#/pack-slim/cli-schema";
import { PackSlimProgressPresenter } from "#/pack-slim/output";
import { runPackSlim } from "#/pack-slim/sync";

/**
 * Creates the `pack-slim` subcommand, which strips the source lane from published packages before publish.
 */
export function createPackSlimCommand(): Command {
  const cmd = new Command("pack-slim")
    .description("Strip src, source conditions, and dist source maps from published packages before publish")
    .argument("[package]", "Optional package path relative to repo root (e.g. packages/ui)")
    .option("--dry-run", "Report what would change without touching any file", false)
    .option("--json", "Print one JSON summary on stdout (suppresses human progress)", false)
    .action(async (packageArg: string | undefined, opts: { dryRun?: boolean; json?: boolean }, command: Command) => {
      const globalsOptionCarrier =
        (command.optsWithGlobals?.() as Record<string, unknown> | undefined) ??
        (command.opts() as Record<string, unknown>);
      const globalOptionsOutcome = parseWithSchema(globalCliCommanderOptionsSchema, globalsOptionCarrier);
      if (!consumeCliAppError(globalOptionsOutcome)) {
        return;
      }

      let rootDir: string;
      try {
        rootDir = findRepoRoot(process.cwd(), nodeFilesystem);
      } catch (caughtError: unknown) {
        consumeCliAppError(err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError)));
        return;
      }

      const write = !opts.dryRun;
      const parsed = parseWithSchema(packSlimRunRequestSchema, {
        rootDir,
        packageFilter: readOptionalPositionalArg(packageArg),
        write,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }

      const json = !!opts.json;
      const presenter = new PackSlimProgressPresenter();
      if (!json) {
        presenter.configure({ dryRun: !write });
      }

      const startTime = performance.now();
      const outcome = await runPackSlim(nodeFilesystem, {
        ...parsed.value,
        listener: json ? undefined : presenter,
      });
      if (!consumeCliAppError(outcome)) {
        return;
      }
      if (json) {
        logger.out(formatPackSlimJsonOutput(outcome.value, (performance.now() - startTime) / 1000, write));
      }
      process.exitCode = exitCodeForPackSlimResult(outcome.value);
    });

  return cmd;
}

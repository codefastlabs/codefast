import { Command } from "commander";

import type { CommandPipeline } from "#/core/cli/command-pipeline";
import { applyCommandPipeline } from "#/core/cli/command-pipeline";
import { nodeFilesystem } from "#/core/filesystem/node";
import { ok } from "#/core/result";
import { exitCodeForPackSlimResult, formatPackSlimJsonOutput } from "#/pack-slim/cli-result";
import { packSlimRunRequestSchema } from "#/pack-slim/cli-schema";
import type { PackSlimRunRequest } from "#/pack-slim/cli-schema";
import type { PackSlimRunStats } from "#/pack-slim/domain/types";
import { PackSlimProgressPresenter } from "#/pack-slim/output";
import type { PackSlimCommandPrelude } from "#/pack-slim/prepare";
import { preparePackSlim } from "#/pack-slim/prepare";
import { runPackSlim } from "#/pack-slim/run";
import { ensureWorkingTreeClean } from "#/pack-slim/working-tree";

type PackSlimCommandOptions = { readonly dryRun?: boolean; readonly force?: boolean; readonly json?: boolean };

const packSlimPipeline: CommandPipeline<
  PackSlimCommandPrelude,
  PackSlimRunRequest,
  PackSlimRunStats,
  PackSlimProgressPresenter,
  PackSlimCommandOptions
> = {
  positional: { name: "[package]", help: "Optional package path relative to repo root (e.g. packages/ui)" },
  schema: packSlimRunRequestSchema,
  configureArgv: (command) => {
    command.option("--dry-run", "Report what would change without touching any file", false);
    command.option("--force", "Run even if the git working tree has uncommitted tracked changes", false);
  },
  prepare: (fs, input) =>
    preparePackSlim(fs, { currentWorkingDirectory: input.currentWorkingDirectory, packageArg: input.rawArg }),
  // A destructive slim must never land on uncommitted work; --dry-run writes nothing, so it is exempt.
  guard: async ({ prelude, opts }) =>
    !opts.dryRun && !opts.force ? ensureWorkingTreeClean(prelude.rootDir) : ok(undefined),
  buildRequest: ({ prelude, opts }) => ({
    rootDir: prelude.rootDir,
    packageFilter: prelude.packageFilter,
    write: !opts.dryRun,
  }),
  createPresenter: ({ opts }) => {
    const presenter = new PackSlimProgressPresenter();
    presenter.configure({ dryRun: !!opts.dryRun });
    return presenter;
  },
  run: (fs, request, presenter) => runPackSlim(fs, { ...request, listener: presenter }),
  formatJson: ({ result, opts, elapsedSeconds }) => formatPackSlimJsonOutput(result, elapsedSeconds, !opts.dryRun),
  exitCode: exitCodeForPackSlimResult,
};

/**
 * Creates the `pack-slim` subcommand, which slims published packages down to what a consumer reads before publish.
 *
 * @since 0.8.1
 */
export function createPackSlimCommand(): Command {
  const cmd = new Command("pack-slim").description(
    "Strip src, source conditions, unshipped imports, dev-only scripts, devDependencies, and dist source maps from " +
      "published packages before publish",
  );
  applyCommandPipeline(cmd, nodeFilesystem, packSlimPipeline);
  return cmd;
}

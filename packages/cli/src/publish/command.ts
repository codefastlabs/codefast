import { Command } from "commander";

import type { CommandPipeline } from "#core/cli/command-pipeline";
import { applyCommandPipeline } from "#core/cli/command-pipeline";
import { nodeFilesystem } from "#core/filesystem/node";
import { ok } from "#core/result";
import { exitCodeForPackSlimResult, formatPackSlimJsonOutput } from "#publish/cli-result";
import type { PackSlimRunRequest, PackSlimRunStats } from "#publish/domain/types";
import { PackSlimProgressPresenter } from "#publish/output";
import type { PackSlimCommandPrelude } from "#publish/prepare";
import { preparePackSlim } from "#publish/prepare";
import { runPackSlim } from "#publish/run";
import { ensureWorkingTreeClean } from "#publish/working-tree";

type PackSlimCommandOptions = { readonly dryRun?: boolean; readonly force?: boolean; readonly json?: boolean };

const packSlimPipeline: CommandPipeline<
  PackSlimCommandPrelude,
  PackSlimRunRequest,
  PackSlimRunStats,
  PackSlimProgressPresenter,
  PackSlimCommandOptions
> = {
  positional: { name: "[package]", help: "Optional package path relative to repo root (e.g. packages/ui)" },
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
 * Creates the `publish:prepare` command, which slims published packages down to what a consumer reads.
 */
export function createPublishPrepareCommand(): Command {
  const cmd = new Command("publish:prepare").description(
    "Prepare published packages for publish: strip src, source conditions, unshipped imports, dev-only scripts, " +
      "devDependencies and dist source maps",
  );
  applyCommandPipeline(cmd, nodeFilesystem, packSlimPipeline);
  return cmd;
}

import { Command } from "commander";

import type { BaseCommandOptions, CommandPipeline } from "#core/cli/command-pipeline";
import { applyCommandPipeline } from "#core/cli/command-pipeline";
import { nodeFilesystem } from "#core/filesystem/node";
import { exitCodeForMirrorSyncResult, formatMirrorSyncJsonOutput } from "#mirror/cli-result";
import type { GlobalStats, MirrorSyncCommandPrelude, MirrorSyncRunRequest } from "#mirror/domain/types";
import { MirrorSyncProgressPresenter } from "#mirror/output";
import { prepareMirrorSync } from "#mirror/prepare";
import { runMirrorSync } from "#mirror/run";

type MirrorCommandOptions = BaseCommandOptions & { readonly dryRun?: boolean };

const mirrorPipeline: CommandPipeline<
  MirrorSyncCommandPrelude,
  MirrorSyncRunRequest,
  GlobalStats,
  MirrorSyncProgressPresenter,
  MirrorCommandOptions
> = {
  positional: { name: "[package]", help: "Optional package path relative to repo root (e.g. packages/ui)" },
  configureArgv: (command) => {
    command.option("--dry-run", "Report what would change without writing package.json", false);
  },
  prepare: (fs, input) =>
    prepareMirrorSync(fs, {
      currentWorkingDirectory: input.currentWorkingDirectory,
      packageArg: input.rawArg,
      globals: input.globals,
    }),
  buildRequest: ({ prelude, opts }) => ({
    rootDir: prelude.rootDir,
    config: prelude.config.mirror ?? {},
    packageFilter: prelude.packageFilter,
    write: !opts.dryRun,
  }),
  createPresenter: ({ opts }) => {
    const presenter = new MirrorSyncProgressPresenter();
    presenter.configure({ verbose: !!opts.verbose, dryRun: !!opts.dryRun });
    return presenter;
  },
  run: (fs, request, presenter) => runMirrorSync(fs, { ...request, listener: presenter }),
  formatJson: ({ result, opts, elapsedSeconds }) => formatMirrorSyncJsonOutput(result, elapsedSeconds, !opts.dryRun),
  exitCode: exitCodeForMirrorSyncResult,
};

/**
 * Creates the `mirror` subcommand, which writes `package.json#exports` from `dist/`.
 *
 * @since 0.3.16-canary.0
 */
export function createMirrorCommand(): Command {
  const cmd = new Command("mirror").description("Write package.json exports from dist/ for workspace packages");
  applyCommandPipeline(cmd, nodeFilesystem, mirrorPipeline);
  return cmd;
}

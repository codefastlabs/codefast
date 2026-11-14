import { Command } from "commander";

import type { CommandPipeline } from "#core/cli/command-pipeline";
import { applyCommandPipeline } from "#core/cli/command-pipeline";
import { nodeFilesystem } from "#core/filesystem/node";
import { exitCodeForTagResult, formatTagJsonOutput } from "#since/cli-result";
import type { TagCommandPrelude, TagResult, TagRunRequest } from "#since/domain/types";
import { presentTagResult, TagProgressPresenter } from "#since/output";
import { prepareTag } from "#since/prepare";
import { runTag } from "#since/run";

type TagCommandOptions = { readonly dryRun?: boolean; readonly json?: boolean };

const tagPipeline: CommandPipeline<
  TagCommandPrelude,
  TagRunRequest,
  TagResult,
  TagProgressPresenter,
  TagCommandOptions
> = {
  positional: { name: "[target]", help: "Directory or file to tag (default: auto-discover workspace packages)" },
  configureArgv: (command) => {
    command.option("--dry-run", "Show summary without writing files", false);
  },
  prepare: (fs, input) =>
    prepareTag(fs, { currentWorkingDirectory: input.currentWorkingDirectory, rawTarget: input.rawArg }),
  buildRequest: ({ prelude, opts }) => {
    const tagConfig = prelude.config.since ?? {};
    return {
      rootDir: prelude.rootDir,
      write: !opts.dryRun,
      targetPath: prelude.resolvedTargetPath,
      skipPackages: tagConfig.skipPackages,
      config: tagConfig,
    };
  },
  createPresenter: () => new TagProgressPresenter(),
  run: (fs, request, presenter) => runTag(fs, { ...request, listener: presenter }),
  presentHuman: ({ result, prelude }) => {
    presentTagResult(result, prelude.rootDir);
  },
  formatJson: ({ result, prelude }) => formatTagJsonOutput(result, prelude.rootDir),
  exitCode: exitCodeForTagResult,
};

/**
 * Creates the `since:stamp` command, which stamps `@since` tags on exported declarations.
 */
export function createSinceStampCommand(): Command {
  const cmd = new Command("since:stamp").description("Stamp @since <version> TSDoc tags on exported declarations");
  applyCommandPipeline(cmd, nodeFilesystem, tagPipeline);
  return cmd;
}

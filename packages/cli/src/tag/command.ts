import { Command } from "commander";

import type { CommandPipeline } from "#/core/cli/command-pipeline";
import { applyCommandPipeline } from "#/core/cli/command-pipeline";
import { nodeFilesystem } from "#/core/filesystem/node";
import { exitCodeForTagResult, formatTagJsonOutput } from "#/tag/cli-result";
import { tagRunRequestSchema } from "#/tag/cli-schema";
import type { TagCommandPrelude, TagResult, TagRunRequest } from "#/tag/domain/types";
import { presentTagResult, TagProgressPresenter } from "#/tag/output";
import { prepareTag } from "#/tag/prepare";
import { runTag } from "#/tag/run";

type TagCommandOptions = { readonly dryRun?: boolean; readonly json?: boolean };

const tagPipeline: CommandPipeline<
  TagCommandPrelude,
  TagRunRequest,
  TagResult,
  TagProgressPresenter,
  TagCommandOptions
> = {
  positional: { name: "[target]", help: "Directory or file to tag (default: auto-discover workspace packages)" },
  schema: tagRunRequestSchema,
  configureArgv: (command) => {
    command.option("--dry-run", "Show summary without writing files", false);
  },
  prepare: (fs, input) =>
    prepareTag(fs, { currentWorkingDirectory: input.currentWorkingDirectory, rawTarget: input.rawArg }),
  buildRequest: ({ prelude, opts }) => {
    const tagConfig = prelude.config.tag ?? {};
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
 * Creates the `tag` subcommand, which stamps `@since` tags on exported declarations.
 *
 * @since 0.3.16-canary.0
 */
export function createTagCommand(): Command {
  const cmd = new Command("tag").description("Add @since <version> JSDoc tags to exported declarations");
  applyCommandPipeline(cmd, nodeFilesystem, tagPipeline);
  return cmd;
}

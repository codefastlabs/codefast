import { Command } from "commander";

import type { AnalyzeReport, ArrangeRunResult, ArrangeTargetWorkspaceAndConfig } from "#/arrange/domain/types";
import { formatArrangeGroupJsonOutput } from "#/arrange/group/cli-result";
import { arrangeSuggestGroupsRequestSchema } from "#/arrange/group/cli-schema";
import { presentArrangeGroupResult } from "#/arrange/group/output";
import { suggestCnGroupsFromCli } from "#/arrange/group/suggest";
import { formatArrangeAnalyzeJsonOutput } from "#/arrange/inspect/cli-result";
import type { ArrangeAnalyzeDirectoryRequest } from "#/arrange/inspect/cli-schema";
import { arrangeAnalyzeDirectoryRequestSchema } from "#/arrange/inspect/cli-schema";
import { presentAnalyzeReport } from "#/arrange/inspect/output";
import { runArrangeInspect } from "#/arrange/inspect/run";
import { prepareArrangeWorkspace } from "#/arrange/prepare";
import { exitCodeForArrangeResult, formatArrangeJsonOutput } from "#/arrange/regroup/cli-result";
import type { ArrangeRunRequest } from "#/arrange/regroup/cli-schema";
import { arrangeRunRequestSchema } from "#/arrange/regroup/cli-schema";
import { presentArrangeResult, presentGroupFilePreviewFromWork } from "#/arrange/regroup/output";
import { runArrange } from "#/arrange/regroup/run";
import { formatArrangeSimplifyJsonOutput } from "#/arrange/simplify/cli-result";
import type { ArrangeSimplifyRunRequest } from "#/arrange/simplify/cli-schema";
import { arrangeSimplifyRunRequestSchema } from "#/arrange/simplify/cli-schema";
import { presentSimplifyResult } from "#/arrange/simplify/output";
import { runArrangeSimplify } from "#/arrange/simplify/run";
import type { CommandPipeline, CommandPrepare, NamedCommandPipeline } from "#/core/cli/command-pipeline";
import { applyCommandPipeline, registerPipelineSubcommand } from "#/core/cli/command-pipeline";
import { consumeCliAppError } from "#/core/cli/result-handle";
import { CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import { nodeFilesystem } from "#/core/filesystem/node";
import { logger } from "#/core/logger";
import { parseWithSchema } from "#/core/schema-parse";

const targetHelp = "Directory or file (default: nearest package directory from cwd)";

type ArrangeRegroupOptions = {
  readonly dryRun?: boolean;
  readonly withClassName?: boolean;
  readonly cnImport?: string | undefined;
  readonly json?: boolean;
};
type ArrangeSimplifyOptions = { readonly dryRun?: boolean; readonly json?: boolean };

const prepareWorkspace: CommandPrepare<ArrangeTargetWorkspaceAndConfig> = (fs, input) =>
  prepareArrangeWorkspace(fs, { currentWorkingDirectory: input.currentWorkingDirectory, rawTarget: input.rawArg });

const regroupPipeline: CommandPipeline<
  ArrangeTargetWorkspaceAndConfig,
  ArrangeRunRequest,
  ArrangeRunResult,
  never,
  ArrangeRegroupOptions
> = {
  positional: { name: "[target]", help: targetHelp },
  schema: arrangeRunRequestSchema,
  configureArgv: (command) => {
    command.option("--dry-run", "Preview suggested replacements without writing files", false);
    command.option("--with-classname, --with-class-name", "Append className as final cn() argument", false);
    command.option("--cn-import <spec>", "Override module specifier when adding cn import");
  },
  prepare: prepareWorkspace,
  buildRequest: ({ prelude, opts }) => ({
    rootDir: prelude.rootDir,
    targetPath: prelude.resolvedTarget,
    write: !opts.dryRun,
    withClassName: opts.withClassName,
    cnImport: opts.cnImport,
    config: prelude.config.arrange ?? {},
  }),
  run: (fs, request) => runArrange(fs, request),
  presentHuman: ({ result, opts }) => {
    // Dry-run previews are human-only; the --json summary omits the non-serializable plans.
    if (opts.dryRun) {
      for (const plan of result.previewPlans) {
        presentGroupFilePreviewFromWork(plan);
      }
    }
    presentArrangeResult(result, !opts.dryRun);
  },
  formatJson: ({ result, opts }) => formatArrangeJsonOutput(result, !opts.dryRun),
  exitCode: exitCodeForArrangeResult,
};

const inspectPipeline: NamedCommandPipeline<
  ArrangeTargetWorkspaceAndConfig,
  ArrangeAnalyzeDirectoryRequest,
  AnalyzeReport
> = {
  name: "inspect",
  description: "Report long strings, nested cn in tv(), and related findings (read-only)",
  positional: { name: "[target]", help: targetHelp },
  jsonHelp: "Print one JSON object on stdout instead of a human report",
  schema: arrangeAnalyzeDirectoryRequestSchema,
  prepare: prepareWorkspace,
  buildRequest: ({ prelude }) => ({ analyzeRootPath: prelude.resolvedTarget }),
  run: async (fs, request) => runArrangeInspect(fs, request.analyzeRootPath),
  presentHuman: ({ result, prelude }) => {
    presentAnalyzeReport(prelude.resolvedTarget, result);
  },
  formatJson: ({ result, prelude }) => formatArrangeAnalyzeJsonOutput(prelude.resolvedTarget, result),
  exitCode: () => CLI_EXIT_SUCCESS,
};

const simplifyPipeline: NamedCommandPipeline<
  ArrangeTargetWorkspaceAndConfig,
  ArrangeSimplifyRunRequest,
  ArrangeRunResult,
  never,
  ArrangeSimplifyOptions
> = {
  name: "simplify",
  description: "Flatten grouped arrays and static-only cn() calls back to plain strings in tv() slots",
  positional: { name: "[target]", help: targetHelp },
  schema: arrangeSimplifyRunRequestSchema,
  configureArgv: (command) => {
    command.option("--dry-run", "Show what simplify would change without writing files", false);
  },
  prepare: prepareWorkspace,
  buildRequest: ({ prelude, opts }) => ({ targetPath: prelude.resolvedTarget, write: !opts.dryRun }),
  run: (fs, request) => runArrangeSimplify(fs, request),
  presentHuman: ({ result, opts }) => {
    presentSimplifyResult(result, !opts.dryRun);
  },
  formatJson: ({ result, opts }) => formatArrangeSimplifyJsonOutput(result, !opts.dryRun),
  exitCode: () => CLI_EXIT_SUCCESS,
};

/**
 * Creates the `arrange` command and its subcommands.
 *
 * @since 0.3.16-canary.0
 */
export function createArrangeCommand(): Command {
  const cmd = new Command("arrange")
    .description("Regroup Tailwind classes in cn() / tv() calls in render-pipeline order")
    // The parent action shares option names (--json) with subcommands; positional
    // options ensure tokens after a subcommand bind to that subcommand, not the parent.
    .enablePositionalOptions();
  applyCommandPipeline(cmd, nodeFilesystem, regroupPipeline);

  registerPipelineSubcommand(cmd, nodeFilesystem, inspectPipeline);
  registerPipelineSubcommand(cmd, nodeFilesystem, simplifyPipeline);

  // `group` is a pure token-string transform — no workspace prelude, a variadic positional — so it
  // does not fit the workspace pipeline and stays wired by hand.
  cmd
    .command("group")
    .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
    .argument("<tokens...>", "Class tokens (quote a single string if it contains spaces)")
    .option("--tv", "Emit tv()-style array instead of cn() call", false)
    .option("--with-classname, --with-class-name", "Append className as final cn() argument", false)
    .option("--json", "Print one JSON object on stdout instead of plain lines", false)
    .action(async (classTokenSeries: Array<string>, opts: Record<string, unknown>) => {
      const parsed = parseWithSchema(arrangeSuggestGroupsRequestSchema, {
        inlineClasses: classTokenSeries.join(" ").trim(),
        emitTvStyleArray: !!opts.tv,
        trailingClassName: !!opts.withClassName,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }
      const output = suggestCnGroupsFromCli(parsed.value);
      if (opts.json) {
        logger.out(formatArrangeGroupJsonOutput(output));
      } else {
        presentArrangeGroupResult(output);
      }
    });

  return cmd;
}

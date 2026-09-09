import process from "node:process";

import { Command } from "commander";

import { formatArrangeGroupJsonOutput } from "#/arrange/group/cli-result";
import { arrangeSuggestGroupsRequestSchema } from "#/arrange/group/cli-schema";
import { presentArrangeGroupResult } from "#/arrange/group/output";
import { suggestCnGroupsFromCli } from "#/arrange/group/suggest";
import { formatArrangeAnalyzeJsonOutput } from "#/arrange/inspect/cli-result";
import { arrangeAnalyzeDirectoryRequestSchema } from "#/arrange/inspect/cli-schema";
import { presentAnalyzeReport } from "#/arrange/inspect/output";
import { runArrangeInspect } from "#/arrange/inspect/run";
import { prepareArrangeWorkspace } from "#/arrange/prepare";
import { exitCodeForArrangeResult, formatArrangeJsonOutput } from "#/arrange/regroup/cli-result";
import { arrangeRunRequestSchema } from "#/arrange/regroup/cli-schema";
import { presentGroupFilePreviewFromWork, presentArrangeResult } from "#/arrange/regroup/output";
import { runArrange } from "#/arrange/regroup/run";
import { formatArrangeSimplifyJsonOutput } from "#/arrange/simplify/cli-result";
import { arrangeSimplifyRunRequestSchema } from "#/arrange/simplify/cli-schema";
import { presentSimplifyResult } from "#/arrange/simplify/output";
import { runArrangeSimplify } from "#/arrange/simplify/run";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError, runCliResultAsync } from "#/core/cli/result-handle";
import { CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import { nodeFilesystem } from "#/core/filesystem/node";
import { logger } from "#/core/logger";
import { parseWithSchema } from "#/core/schema-parse";

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
    .enablePositionalOptions()
    .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
    .option("--dry-run", "Preview suggested replacements without writing files", false)
    .option("--with-classname, --with-class-name", "Append className as final cn() argument", false)
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .option("--json", "Print one JSON object on stdout (suppresses human progress)", false)
    .action(async (target: string | undefined, opts: Record<string, unknown>) => {
      const write = !opts.dryRun;
      const prelude = await prepareArrangeWorkspace(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { resolvedTarget, rootDir, config } = prelude.value;
      const parsed = parseWithSchema(arrangeRunRequestSchema, {
        rootDir,
        targetPath: resolvedTarget,
        write,
        withClassName: opts.withClassName as boolean | undefined,
        cnImport: opts.cnImport as string | undefined,
        config: config.arrange ?? {},
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }
      await runCliResultAsync(runArrange(nodeFilesystem, parsed.value), (value) => {
        if (!write) {
          for (const plan of value.previewPlans) {
            presentGroupFilePreviewFromWork(plan);
          }
        }
        if (opts.json) {
          logger.out(formatArrangeJsonOutput(value, write));
          return exitCodeForArrangeResult(value);
        }
        presentArrangeResult(value, write);
        return exitCodeForArrangeResult(value);
      });
    });

  cmd
    .command("inspect")
    .description("Report long strings, nested cn in tv(), and related findings (read-only)")
    .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
    .option("--json", "Print one JSON object on stdout instead of a human report", false)
    .action(async (target: string | undefined, opts: { json?: boolean }) => {
      const prelude = await prepareArrangeWorkspace(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { resolvedTarget } = prelude.value;
      const parsed = parseWithSchema(arrangeAnalyzeDirectoryRequestSchema, {
        analyzeRootPath: resolvedTarget,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }
      const outcome = runArrangeInspect(nodeFilesystem, parsed.value.analyzeRootPath);
      if (!consumeCliAppError(outcome)) {
        return;
      }
      if (opts.json) {
        logger.out(formatArrangeAnalyzeJsonOutput(resolvedTarget, outcome.value));
      } else {
        presentAnalyzeReport(resolvedTarget, outcome.value);
      }
    });

  cmd
    .command("simplify")
    .description("Flatten grouped arrays and static-only cn() calls back to plain strings in tv() slots")
    .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
    .option("--dry-run", "Show what simplify would change without writing files", false)
    .option("--json", "Print one JSON object on stdout (suppresses human progress)", false)
    .action(async (target: string | undefined, opts: Record<string, unknown>) => {
      const write = !opts.dryRun;
      const prelude = await prepareArrangeWorkspace(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { resolvedTarget } = prelude.value;
      const parsed = parseWithSchema(arrangeSimplifyRunRequestSchema, { targetPath: resolvedTarget, write });
      if (!consumeCliAppError(parsed)) {
        return;
      }
      await runCliResultAsync(runArrangeSimplify(nodeFilesystem, parsed.value), (value) => {
        if (opts.json) {
          logger.out(formatArrangeSimplifyJsonOutput(value, write));
          return CLI_EXIT_SUCCESS;
        }
        presentSimplifyResult(value, write);
        return CLI_EXIT_SUCCESS;
      });
    });

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

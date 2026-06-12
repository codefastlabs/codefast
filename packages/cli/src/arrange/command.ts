import process from "node:process";

import { Command } from "commander";

import { analyzeDirectory } from "#/arrange/analyze";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/arrange/cli-schema";
import type { AnalyzeReport, ArrangeRunResult } from "#/arrange/domain/types";
import type { ArrangeSuggestGroupsOutput } from "#/arrange/domain/types";
import {
  printAnalyzeReport,
  printGroupFilePreviewFromWork,
  printSimplifyResult,
  printSyncResult,
} from "#/arrange/output";
import { runArrangeSimplify } from "#/arrange/simplify-sync";
import { suggestCnGroupsFromCli } from "#/arrange/suggest";
import { runArrangeSync } from "#/arrange/sync";
import { prepareArrangeWorkspace } from "#/arrange/workspace";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError, runCliResultAsync } from "#/core/cli/result-handle";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import { nodeFilesystem } from "#/core/filesystem/node";
import { logger } from "#/core/logger";
import { parseWithSchema } from "#/core/schema-parse";

/**
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
      const parsed = parseWithSchema(arrangeSyncRunRequestSchema, {
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
      await runCliResultAsync(runArrangeSync(nodeFilesystem, parsed.value), (value) => {
        if (!write) {
          for (const plan of value.previewPlans) {
            printGroupFilePreviewFromWork(plan);
          }
        }
        if (opts.json) {
          logger.out(formatArrangeSyncJsonOutput(value, write));
          return exitCodeForArrangeSyncResult(value);
        }
        printSyncResult(value, write);
        return exitCodeForArrangeSyncResult(value);
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
      const outcome = analyzeDirectory(nodeFilesystem, parsed.value.analyzeRootPath);
      if (!consumeCliAppError(outcome)) {
        return;
      }
      if (opts.json) {
        logger.out(formatArrangeAnalyzeJsonOutput(resolvedTarget, outcome.value));
      } else {
        printAnalyzeReport(resolvedTarget, outcome.value);
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
      await runCliResultAsync(runArrangeSimplify(nodeFilesystem, { targetPath: resolvedTarget, write }), (value) => {
        if (opts.json) {
          logger.out(JSON.stringify({ schemaVersion: 1 as const, ok: true, write, result: value }));
          return CLI_EXIT_SUCCESS;
        }
        printSimplifyResult(value, write);
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
        logger.out(output.primaryLine);
        logger.out(output.bucketsCommentLine);
      }
    });

  return cmd;
}

function formatArrangeAnalyzeJsonOutput(analyzeRootPath: string, report: AnalyzeReport): string {
  return JSON.stringify({ schemaVersion: 1 as const, analyzeRootPath, report });
}

function formatArrangeSyncJsonOutput(result: ArrangeRunResult, write: boolean): string {
  const { previewPlans: _plans, ...serializableResult } = result;
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.hookError === null,
    write,
    result: serializableResult,
  });
}

function formatArrangeGroupJsonOutput(output: ArrangeSuggestGroupsOutput): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    primaryLine: output.primaryLine,
    bucketsCommentLine: output.bucketsCommentLine,
  });
}

function exitCodeForArrangeSyncResult(result: ArrangeRunResult): number {
  return result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

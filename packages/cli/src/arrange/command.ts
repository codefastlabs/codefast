import process from "node:process";
import { Command } from "commander";
import { parseWithSchema } from "#/core/schema-parse";
import { consumeCliAppError, runCliResultAsync } from "#/core/result-handle";
import { logger } from "#/core/logger";
import { nodeFilesystem } from "#/core/node-filesystem";
import {
  arrangeAnalyzeDirectoryRequestSchema,
  arrangeSuggestGroupsRequestSchema,
  arrangeSyncRunRequestSchema,
} from "#/arrange/cli-schema";
import { prepareArrangeWorkspace } from "#/arrange/workspace";
import { analyzeDirectory } from "#/arrange/analyze";
import { runArrangeSync } from "#/arrange/sync";
import { suggestCnGroupsFromCli } from "#/arrange/suggest";
import {
  printAnalyzeReport,
  printGroupFilePreviewFromWork,
  printSyncResult,
} from "#/arrange/output";
import type { AnalyzeReport, ArrangeRunResult } from "#/arrange/domain/types.domain";
import type { ArrangeSuggestGroupsOutput } from "#/arrange/domain/types.domain";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import { readOptionalPositionalArg } from "#/core/cli-positional";

export function createArrangeCommand(): Command {
  const cmd = new Command("arrange").description(
    "Analyze and regroup Tailwind classes in cn() / tv() calls (Tailwind v4)",
  );

  cmd
    .command("analyze")
    .description("Report long strings, nested cn in tv(), and related findings")
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

  const previewOrApply =
    (write: boolean) => async (target: string | undefined, opts: Record<string, unknown>) => {
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
    };

  cmd
    .command("preview")
    .description("Dry-run: print suggested replacements without writing files")
    .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
    .option("--with-classname, --with-class-name", "Append className as final cn() argument", false)
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .option("--json", "Print one JSON object on stdout (suppresses human progress)", false)
    .action(previewOrApply(false));

  cmd
    .command("apply")
    .description("Apply grouping and cn-in-tv unwrap edits to files")
    .argument("[target]", "Directory or file (default: nearest package directory from cwd)")
    .option("--with-classname, --with-class-name", "Append className as final cn() argument", false)
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .option("--json", "Print one JSON object on stdout (suppresses human progress)", false)
    .action(previewOrApply(true));

  cmd
    .command("group")
    .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
    .argument("<tokens...>", "Class tokens (quote a single string if it contains spaces)")
    .option("--tv", "Emit tv()-style array instead of cn() call", false)
    .option("--with-classname, --with-class-name", "Append className as final cn() argument", false)
    .option("--json", "Print one JSON object on stdout instead of plain lines", false)
    .action(async (classTokenSeries: string[], opts: Record<string, unknown>) => {
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

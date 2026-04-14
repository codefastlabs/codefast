import path from "node:path";
import process from "node:process";
import type { Command } from "commander";
import { Option } from "commander";
import { ArrangeAnalyzeDirectoryRequestSchema } from "#lib/arrange/application/requests/analyze-directory.request";
import { ArrangeSyncRunRequestSchema } from "#lib/arrange/application/requests/arrange-sync.request";
import { DEFAULT_ARRANGE_TARGET } from "#lib/arrange/domain/constants";
import { suggestCnGroups, summarizeGroupBucketLabels } from "#lib/arrange/domain/grouping";
import { formatArray, formatCnCall } from "#lib/arrange/domain/source-text-formatters";
import { printAnalyzeReport } from "#lib/arrange/presentation/report";
import { consumeCliAppError } from "#lib/core/presentation/cli-executor";
import {
  assertPathExistsOrExit,
  createCliContext,
  parseWithCliSchema,
  resolveWorkspaceRoot,
  runAsyncExitCodeUseCaseAfterParse,
  runSyncUseCaseAfterParse,
  tryLoadCodefastConfig,
} from "#lib/core/presentation/create-command-handler";

function withClassNameOption(): Option {
  return new Option(
    "--with-classname, --with-class-name",
    "Append className as final cn() argument",
  ).default(false);
}

function defaultTargetPath(): string {
  return path.resolve(process.cwd(), DEFAULT_ARRANGE_TARGET);
}

export function registerArrangeCommand(program: Command): void {
  const arrange = program
    .command("arrange")
    .description("Analyze and regroup Tailwind classes in cn() / tv() calls (Tailwind v4)");

  arrange
    .command("analyze")
    .description("Report long strings, nested cn in tv(), and related findings")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .action(async (target: string | undefined) => {
      const cli = createCliContext();
      const resolved = target ? path.resolve(target) : defaultTargetPath();
      if (!assertPathExistsOrExit(resolved, cli)) {
        return;
      }
      const rootOutcome = resolveWorkspaceRoot(cli);
      if (!consumeCliAppError(cli.logger, rootOutcome)) {
        return;
      }
      const rootDir = rootOutcome.value;
      const loadedOutcome = await tryLoadCodefastConfig(cli, rootDir);
      if (!consumeCliAppError(cli.logger, loadedOutcome)) {
        return;
      }
      const parsed = parseWithCliSchema(ArrangeAnalyzeDirectoryRequestSchema, {
        analyzeRootPath: resolved,
      });
      runSyncUseCaseAfterParse(
        cli,
        parsed,
        (input) => cli.arrange.analyzeDirectory(input),
        (report) => printAnalyzeReport(resolved, report, cli.logger),
      );
    });

  arrange
    .command("preview")
    .description("Dry-run: print suggested replacements without writing files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .addOption(withClassNameOption())
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action(
      async (target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) => {
        const cli = createCliContext();
        const resolved = target ? path.resolve(target) : defaultTargetPath();
        if (!assertPathExistsOrExit(resolved, cli)) {
          return;
        }
        const rootOutcome = resolveWorkspaceRoot(cli);
        if (!consumeCliAppError(cli.logger, rootOutcome)) {
          return;
        }
        const rootDir = rootOutcome.value;
        const loadedOutcome = await tryLoadCodefastConfig(cli, rootDir);
        if (!consumeCliAppError(cli.logger, loadedOutcome)) {
          return;
        }
        const parsed = parseWithCliSchema(ArrangeSyncRunRequestSchema, {
          rootDir,
          targetPath: resolved,
          write: false,
          withClassName: opts.withClassName,
          cnImport: opts.cnImport,
          config: loadedOutcome.value.config.arrange ?? {},
        });
        await runAsyncExitCodeUseCaseAfterParse(cli, parsed, (input) =>
          cli.arrange.runArrangeSync(input),
        );
      },
    );

  arrange
    .command("apply")
    .description("Apply grouping and cn-in-tv unwrap edits to files")
    .argument("[target]", "Directory or file (default: packages/ui/src/components)")
    .addOption(withClassNameOption())
    .option("--cn-import <spec>", "Override module specifier when adding cn import")
    .action(
      async (target: string | undefined, opts: { withClassName?: boolean; cnImport?: string }) => {
        const cli = createCliContext();
        const resolved = target ? path.resolve(target) : defaultTargetPath();
        if (!assertPathExistsOrExit(resolved, cli)) {
          return;
        }
        const rootOutcome = resolveWorkspaceRoot(cli);
        if (!consumeCliAppError(cli.logger, rootOutcome)) {
          return;
        }
        const rootDir = rootOutcome.value;
        const loadedOutcome = await tryLoadCodefastConfig(cli, rootDir);
        if (!consumeCliAppError(cli.logger, loadedOutcome)) {
          return;
        }
        const parsed = parseWithCliSchema(ArrangeSyncRunRequestSchema, {
          rootDir,
          targetPath: resolved,
          write: true,
          withClassName: opts.withClassName,
          cnImport: opts.cnImport,
          config: loadedOutcome.value.config.arrange ?? {},
        });
        await runAsyncExitCodeUseCaseAfterParse(cli, parsed, (input) =>
          cli.arrange.runArrangeSync(input),
        );
      },
    );

  arrange
    .command("group")
    .description("Try grouping on a pasted class string (stdout: cn(...) or tv array with --tv)")
    .argument("[tokens...]", "Class tokens (quote a single string if it contains spaces)")
    .option("--tv", "Emit tv()-style array instead of cn() call", false)
    .addOption(withClassNameOption())
    .action((tokens: string[], opts: { tv?: boolean; withClassName?: boolean }) => {
      const cli = createCliContext();
      const inlineClasses = tokens.join(" ").trim();
      if (!inlineClasses) {
        cli.logger.err(
          'Pass a class string. Example: codefast arrange group "flex gap-2 text-sm rounded-md"\n',
        );
        process.exitCode = 1;
        return;
      }
      const groups = suggestCnGroups(inlineClasses);
      const result = opts.tv
        ? formatArray(groups)
        : formatCnCall(groups, { trailingClassName: !!opts.withClassName });
      cli.logger.out(result);
      cli.logger.out(`// Buckets: ${JSON.stringify(summarizeGroupBucketLabels(groups))}`);
    });
}

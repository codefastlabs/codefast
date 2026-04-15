import process from "node:process";
import type { Command } from "commander";
import { Option } from "commander";
import { ArrangeAnalyzeDirectoryRequestSchema } from "#lib/arrange/application/requests/analyze-directory.request";
import { ArrangeSyncRunRequestSchema } from "#lib/arrange/application/requests/arrange-sync.request";
import { ArrangeSuggestGroupsRequestSchema } from "#lib/arrange/application/requests/suggest-groups.request";
import { createCliContainer } from "#lib/core/infra/container.adapter";
import { consumeCliAppError } from "#lib/core/presentation/cli-executor.presenter";
import { parseWithCliSchema } from "#lib/core/presentation/parse-cli-schema.presenter";
import {
  runAsyncExitCodeUseCaseAfterParse,
  runSyncUseCaseAfterParse,
} from "#lib/core/presentation/run-cli-use-case-after-parse.presenter";

function withClassNameOption(): Option {
  return new Option(
    "--with-classname, --with-class-name",
    "Append className as final cn() argument",
  ).default(false);
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
      const cli = createCliContainer();
      const prelude = await cli.arrange.prepareTargetWorkspaceAndConfig({
        currentWorkingDirectory: process.cwd(),
        rawTarget: target,
      });
      if (!consumeCliAppError(cli.logger, prelude)) {
        return;
      }
      const { resolvedTarget } = prelude.value;
      const parsed = parseWithCliSchema(ArrangeAnalyzeDirectoryRequestSchema, {
        analyzeRootPath: resolvedTarget,
      });
      runSyncUseCaseAfterParse(
        cli,
        parsed,
        (input) => cli.arrange.analyzeDirectory(input),
        (report) => cli.arrange.presentAnalyzeReport(resolvedTarget, report),
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
        const cli = createCliContainer();
        const prelude = await cli.arrange.prepareTargetWorkspaceAndConfig({
          currentWorkingDirectory: process.cwd(),
          rawTarget: target,
        });
        if (!consumeCliAppError(cli.logger, prelude)) {
          return;
        }
        const { resolvedTarget, rootDir, config } = prelude.value;
        const parsed = parseWithCliSchema(ArrangeSyncRunRequestSchema, {
          rootDir,
          targetPath: resolvedTarget,
          write: false,
          withClassName: opts.withClassName,
          cnImport: opts.cnImport,
          config: config.arrange ?? {},
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
        const cli = createCliContainer();
        const prelude = await cli.arrange.prepareTargetWorkspaceAndConfig({
          currentWorkingDirectory: process.cwd(),
          rawTarget: target,
        });
        if (!consumeCliAppError(cli.logger, prelude)) {
          return;
        }
        const { resolvedTarget, rootDir, config } = prelude.value;
        const parsed = parseWithCliSchema(ArrangeSyncRunRequestSchema, {
          rootDir,
          targetPath: resolvedTarget,
          write: true,
          withClassName: opts.withClassName,
          cnImport: opts.cnImport,
          config: config.arrange ?? {},
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
      const cli = createCliContainer();
      const parsed = parseWithCliSchema(ArrangeSuggestGroupsRequestSchema, {
        inlineClasses: tokens.join(" ").trim(),
        emitTvStyleArray: !!opts.tv,
        trailingClassName: !!opts.withClassName,
      });
      if (!consumeCliAppError(cli.logger, parsed)) {
        return;
      }
      const output = cli.arrange.suggestCnGroups(parsed.value);
      cli.logger.out(output.primaryLine);
      cli.logger.out(output.bucketsCommentLine);
    });
}

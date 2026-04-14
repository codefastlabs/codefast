import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import { loadConfig } from "#lib/config";
import type { CodefastTagConfig } from "#lib/config";
import { printConfigSchemaWarnings } from "#lib/infra/config-reporter";
import { createNodeCliFs, createNodeCliLogger, runTagSync } from "#lib/tag";
import { findRepoRoot } from "#lib/infra/workspace/repo-root";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import {
  createTagProgressListener,
  formatSummary,
  formatTargetTable,
  formatWarningsAndErrors,
} from "#lib/tag/presentation/tag-presenter";

function resolveTagRootDir(fs: CliFs, logger: CliLogger): string {
  try {
    return findRepoRoot(fs);
  } catch (caughtRepoRootError: unknown) {
    logger.out(
      `[tag] workspace root auto-detection failed (${messageFromCaughtUnknown(caughtRepoRootError)}), using cwd=${process.cwd()}`,
    );
    return process.cwd();
  }
}

export function registerTagCommand(program: Command): void {
  program
    .command("tag")
    .alias("annotate")
    .description("Add @since <version> JSDoc tags to exported declarations")
    .argument(
      "[target]",
      "Directory or file to annotate (default: auto-discover workspace packages)",
    )
    .option("--dry-run", "Show summary without writing files", false)
    .action(async (target: string | undefined, options: { dryRun?: boolean }) => {
      const fs = createNodeCliFs();
      const logger = createNodeCliLogger();
      const rootDir = resolveTagRootDir(fs, logger);
      let tagConfig: CodefastTagConfig = {};
      try {
        const { config, warnings } = await loadConfig(fs, rootDir);
        printConfigSchemaWarnings(logger, warnings);
        tagConfig = config.tag ?? {};
      } catch (caughtConfigError: unknown) {
        logger.err(messageFromCaughtUnknown(caughtConfigError));
        process.exitCode = 1;
        return;
      }

      const tagResult = await runTagSync({
        rootDir,
        config: tagConfig,
        skipPackages: tagConfig.skipPackages,
        targetPath: target ? path.resolve(target) : undefined,
        write: !options.dryRun,
        fs,
        listener: createTagProgressListener((line) => logger.out(line)),
      });
      logger.out(formatTargetTable(tagResult.selectedTargets, rootDir));

      if (tagResult.selectedTargets.length === 0) {
        logger.err(
          "No packages found in workspace. Check your pnpm-workspace.yaml or provide an explicit target path.",
        );
        process.exitCode = 1;
        return;
      }

      const warningsAndErrorsSection = formatWarningsAndErrors(tagResult);
      if (warningsAndErrorsSection) {
        logger.err(warningsAndErrorsSection);
      }

      logger.out(formatSummary(tagResult));

      const hasRunErrors = tagResult.targetResults.some(
        (targetResult) => targetResult.runError !== null,
      );
      process.exitCode = hasRunErrors || tagResult.hookError ? 1 : 0;
    });
}

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
import type {
  TagProgressListener,
  TagResolvedTarget,
  TagSyncResult,
  TagTargetExecutionResult,
} from "#lib/tag/domain/types";

const CliColors = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
};

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

function printResolvedTargets(logger: CliLogger, rootDir: string, result: TagSyncResult): void {
  const packageColumnWidth = Math.max(
    "package".length,
    ...result.selectedTargets.map((target) => (target.packageName ?? "-").length),
  );
  const pathColumnWidth = Math.max(
    "path".length,
    ...result.selectedTargets.map((target) => target.rootRelativeTargetPath.length),
  );

  const lines: string[] = [];
  lines.push(`[tag] Root: ${rootDir}`);
  lines.push(`[tag] Resolved targets: ${result.selectedTargets.length}`);
  lines.push("[tag] Targets:");
  lines.push(
    `  ${"package".padEnd(packageColumnWidth)}   ${"path".padEnd(pathColumnWidth)}   source`,
  );
  lines.push(
    `  ${"-".repeat(packageColumnWidth)}   ${"-".repeat(pathColumnWidth)}   ${"-".repeat("source".length)}`,
  );
  for (const target of result.selectedTargets) {
    const packageLabel = target.packageName ?? "-";
    lines.push(
      `  ${packageLabel.padEnd(packageColumnWidth)}   ${target.rootRelativeTargetPath.padEnd(pathColumnWidth)}   ${target.source}`,
    );
  }
  logger.out(lines.join("\n"));
}

function printTagSummary(logger: CliLogger, result: TagSyncResult): void {
  const isDryRun = result.mode === "dry-run";
  const summaryPrefix = isDryRun ? "[tag:dry-run]" : "[tag]";
  const versionSuffix =
    result.versionSummary === "mixed" && result.distinctVersions.length > 0
      ? ` [${result.distinctVersions.join(", ")}]`
      : "";
  const hasError =
    result.targetResults.some((targetResult) => targetResult.runError !== null) ||
    result.hookError !== null;
  const summaryColor = hasError ? CliColors.RED : isDryRun ? CliColors.YELLOW : CliColors.GREEN;
  logger.out(
    `${summaryColor}${summaryPrefix} version=${result.versionSummary}${versionSuffix} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}${CliColors.RESET}`,
  );
}

function createTagProgressListener(logger: CliLogger): TagProgressListener {
  function targetDisplayName(target: TagResolvedTarget): string {
    return target.packageName ?? target.rootRelativeTargetPath;
  }

  return {
    onTargetStarted: (target: TagResolvedTarget) => {
      logger.out(`[tag] Processing ${targetDisplayName(target)}...`);
    },
    onTargetCompleted: (target: TagResolvedTarget, result: TagTargetExecutionResult) => {
      const changedFiles = result.result?.filesChanged ?? 0;
      logger.out(`[tag] Done ${targetDisplayName(target)} (${changedFiles} changes)`);
    },
  };
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
        targetPath: target ? path.resolve(target) : undefined,
        write: !options.dryRun,
        fs,
        listener: createTagProgressListener(logger),
      });
      printResolvedTargets(logger, rootDir, tagResult);

      if (tagResult.selectedTargets.length === 0) {
        logger.err(
          `${CliColors.YELLOW}No packages found in workspace. Check your pnpm-workspace.yaml or provide an explicit target path.${CliColors.RESET}`,
        );
        process.exitCode = 1;
        return;
      }

      const targetErrors = tagResult.targetResults
        .map((targetResult) => targetResult.runError)
        .filter((runError): runError is string => typeof runError === "string");
      for (const targetError of targetErrors) {
        logger.err(`${CliColors.RED}[tag] ${targetError}${CliColors.RESET}`);
      }

      printTagSummary(logger, tagResult);

      if (tagResult.hookError) {
        logger.err(`${CliColors.RED}${tagResult.hookError}${CliColors.RESET}`);
      }

      process.exitCode = targetErrors.length > 0 || tagResult.hookError ? 1 : 0;
    });
}

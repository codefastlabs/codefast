import { logger } from "#/core/logger";
import { CLI_EXIT_GENERAL_ERROR } from "#/core/exit-codes";
import type {
  TagProgressListener,
  TagResolvedTarget,
  TagSyncResult,
  TagTargetExecutionResult,
} from "#/tag/domain/types";
import { exitCodeForTagSyncResult } from "#/tag/cli-result";

type TagProgressEvent =
  | { type: "target-started"; target: TagResolvedTarget }
  | { type: "target-completed"; target: TagResolvedTarget; result: TagTargetExecutionResult };

/**
 * @since 0.3.16-canary.0
 */
export class TagSyncProgressPresenter implements TagProgressListener {
  onTargetStarted(target: TagResolvedTarget): void {
    logger.out(TagSyncProgressPresenter.formatProgress({ type: "target-started", target }));
  }

  onTargetCompleted(target: TagResolvedTarget, result: TagTargetExecutionResult): void {
    logger.out(
      TagSyncProgressPresenter.formatProgress({ type: "target-completed", target, result }),
    );
  }

  private static formatProgress(event: TagProgressEvent): string {
    const targetDisplayName = (target: TagResolvedTarget): string =>
      target.packageName ?? target.rootRelativeTargetPath;

    if (event.type === "target-started") {
      return `[tag] Processing ${targetDisplayName(event.target)}...`;
    }
    const changedFiles = event.result.result?.filesChanged ?? 0;
    return `[tag] Done ${targetDisplayName(event.target)} (${changedFiles} changes)`;
  }
}

const colorReset = "\x1b[0m";
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
} as const;

/**
 * @since 0.3.16-canary.0
 */
export function presentTagSyncResult(result: TagSyncResult, rootDir: string): number {
  logger.out(formatTargetTable(result.selectedTargets, rootDir));
  if (result.selectedTargets.length === 0) {
    logger.err(
      "No packages found in workspace. Check your pnpm-workspace.yaml or provide an explicit target path.",
    );
    return CLI_EXIT_GENERAL_ERROR;
  }
  const warningsAndErrorsSection = formatWarningsAndErrors(result);
  if (warningsAndErrorsSection) {
    logger.err(warningsAndErrorsSection);
  }
  logger.out(formatSummary(result));
  return exitCodeForTagSyncResult(result);
}

function withColorizedLine(line: string, colorCode: string): string {
  return `${colorCode}${line}${colorReset}`;
}

function warningsAndErrorsFromResult(result: TagSyncResult): string[] {
  const entries: string[] = [];
  for (const targetResult of result.targetResults) {
    if (targetResult.runError) {
      entries.push(targetResult.runError);
    }
  }
  if (result.hookError) {
    entries.push(result.hookError);
  }
  return entries;
}

function formatTargetTable(targets: TagResolvedTarget[], rootDir: string): string {
  const packageColumnWidth = Math.max(
    "package".length,
    ...targets.map((target) => (target.packageName ?? "-").length),
  );
  const pathColumnWidth = Math.max(
    "path".length,
    ...targets.map((target) => target.rootRelativeTargetPath.length),
  );
  const lines: string[] = [];
  lines.push(`[tag] Root: ${rootDir}`);
  lines.push(`[tag] Resolved targets: ${targets.length}`);
  lines.push("[tag] Targets:");
  lines.push(
    `  ${"package".padEnd(packageColumnWidth)}   ${"path".padEnd(pathColumnWidth)}   source`,
  );
  lines.push(
    `  ${"-".repeat(packageColumnWidth)}   ${"-".repeat(pathColumnWidth)}   ${"-".repeat("source".length)}`,
  );
  for (const target of targets) {
    lines.push(
      `  ${(target.packageName ?? "-").padEnd(packageColumnWidth)}   ${target.rootRelativeTargetPath.padEnd(pathColumnWidth)}   ${target.source}`,
    );
  }
  return lines.join("\n");
}

function formatWarningsAndErrors(result: TagSyncResult): string | null {
  const entries = warningsAndErrorsFromResult(result);
  if (entries.length === 0) {
    return null;
  }
  const lines = [withColorizedLine("⚠️ Warnings & Errors", colors.yellow)];
  for (const entry of entries) {
    lines.push(withColorizedLine(`- ${entry}`, colors.red));
  }
  return lines.join("\n");
}

function formatSummary(result: TagSyncResult): string {
  const isDryRun = result.mode === "dry-run";
  const summaryPrefix = isDryRun ? "[tag:dry-run]" : "[tag]";
  const versionSuffix =
    result.versionSummary === "mixed" && result.distinctVersions.length > 0
      ? ` [${result.distinctVersions.join(", ")}]`
      : "";
  const hasError =
    result.targetResults.some((targetResult) => targetResult.runError !== null) ||
    result.hookError !== null;
  const summaryColor = hasError ? colors.red : isDryRun ? colors.yellow : colors.green;
  const lines = [
    withColorizedLine(
      `${summaryPrefix} version=${result.versionSummary}${versionSuffix} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}`,
      summaryColor,
    ),
  ];
  if (result.skippedPackages.length > 0) {
    lines.push(`[tag] Skipped: ${result.skippedPackages.length} package(s)`);
  }
  return lines.join("\n");
}

import path from "node:path";
import process from "node:process";

import { logger } from "#core/logger";
import { paint } from "#core/style";
import type { TagProgressListener, TagResolvedTarget, TagResult, TagTargetExecutionResult } from "#tag/domain/types";

type TagProgressEvent =
  | { type: "target-started"; target: TagResolvedTarget }
  | { type: "target-completed"; target: TagResolvedTarget; result: TagTargetExecutionResult };

/**
 * A progress listener that prints a line as each tag target starts and completes.
 *
 * @since 0.3.16-canary.0
 */
export class TagProgressPresenter implements TagProgressListener {
  onTargetStarted(target: TagResolvedTarget): void {
    logger.out(TagProgressPresenter.formatProgress({ type: "target-started", target }));
  }

  onTargetCompleted(target: TagResolvedTarget, result: TagTargetExecutionResult): void {
    logger.out(TagProgressPresenter.formatProgress({ type: "target-completed", target, result }));
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

/**
 * Prints a tag run's target table, warnings, and summary to the human reader.
 *
 * @since 0.3.16-canary.0
 */
export function presentTagResult(result: TagResult, rootDir: string): void {
  logger.out(formatTargetTable(result.selectedTargets, rootDir));
  if (result.selectedTargets.length === 0) {
    logger.err("No packages found in workspace. Check your pnpm-workspace.yaml or provide an explicit target path.");
    return;
  }
  const warningsAndErrorsSection = formatWarningsAndErrors(result, rootDir);
  if (warningsAndErrorsSection) {
    logger.err(warningsAndErrorsSection);
  }
  logger.out(formatSummary(result));
}

function warningsAndErrorsFromResult(result: TagResult, rootDir: string): Array<string> {
  const entries: Array<string> = [];
  for (const targetResult of result.targetResults) {
    if (targetResult.runError) {
      entries.push(targetResult.runError);
    }
  }
  for (const blocked of result.blockedDeclarations) {
    entries.push(
      `${path.relative(rootDir, blocked.filePath)}:${blocked.line} \`${blocked.name}\` left unstamped: it has no doc block and a // comment holds the line above it — write the block by hand, then rerun`,
    );
  }
  if (result.hookError) {
    entries.push(result.hookError);
  }
  return entries;
}

function formatTargetTable(targets: Array<TagResolvedTarget>, rootDir: string): string {
  const packageColumnWidth = Math.max("package".length, ...targets.map((target) => (target.packageName ?? "-").length));
  const pathColumnWidth = Math.max("path".length, ...targets.map((target) => target.rootRelativeTargetPath.length));
  const lines: Array<string> = [];
  lines.push(`[tag] Root: ${rootDir}`);
  lines.push(`[tag] Resolved targets: ${targets.length}`);
  lines.push("[tag] Targets:");
  lines.push(`  ${"package".padEnd(packageColumnWidth)}   ${"path".padEnd(pathColumnWidth)}   source`);
  lines.push(`  ${"-".repeat(packageColumnWidth)}   ${"-".repeat(pathColumnWidth)}   ${"-".repeat("source".length)}`);
  for (const target of targets) {
    lines.push(
      `  ${(target.packageName ?? "-").padEnd(packageColumnWidth)}   ${target.rootRelativeTargetPath.padEnd(pathColumnWidth)}   ${target.source}`,
    );
  }
  return lines.join("\n");
}

function formatWarningsAndErrors(result: TagResult, rootDir: string): string | null {
  const entries = warningsAndErrorsFromResult(result, rootDir);
  if (entries.length === 0) {
    return null;
  }
  const lines = [paint("yellow", "⚠️ Warnings & Errors", process.stderr)];
  for (const entry of entries) {
    lines.push(paint("red", `- ${entry}`, process.stderr));
  }
  return lines.join("\n");
}

function formatSummary(result: TagResult): string {
  const isDryRun = result.mode === "dry-run";
  const summaryPrefix = isDryRun ? "[tag:dry-run]" : "[tag]";
  const versionSuffix =
    result.versionSummary === "mixed" && result.distinctVersions.length > 0
      ? ` [${result.distinctVersions.join(", ")}]`
      : "";
  const hasError =
    result.targetResults.some((targetResult) => targetResult.runError !== null) ||
    result.blockedDeclarations.length > 0 ||
    result.hookError !== null;
  const summaryStyle = hasError ? "red" : isDryRun ? "yellow" : "green";
  const blockedSuffix = result.blockedDeclarations.length > 0 ? ` blocked=${result.blockedDeclarations.length}` : "";
  const lines = [
    paint(
      summaryStyle,
      `${summaryPrefix} version=${result.versionSummary}${versionSuffix} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}${blockedSuffix}`,
    ),
  ];
  if (result.skippedPackages.length > 0) {
    lines.push(`[tag] Skipped: ${result.skippedPackages.length} package(s)`);
  }
  return lines.join("\n");
}

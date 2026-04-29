import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CLI_EXIT_GENERAL_ERROR } from "#/lib/core/domain/cli-exit-codes.domain";
import { exitCodeForTagSyncResult } from "#/lib/tag/application/tag-sync-cli-result";
import type {
  TagResolvedTarget,
  TagSyncResult,
  TagTargetExecutionResult,
} from "#/lib/tag/domain/types.domain";
import { TAG_COLORS, withTagColor } from "#/lib/tag/presentation/colors.presenter";

type TagProgressEvent =
  | { type: "target-started"; target: TagResolvedTarget }
  | { type: "target-completed"; target: TagResolvedTarget; result: TagTargetExecutionResult };

function targetDisplayName(target: TagResolvedTarget): string {
  return target.packageName ?? target.rootRelativeTargetPath;
}

export function formatProgress(event: TagProgressEvent): string {
  if (event.type === "target-started") {
    return `[tag] Processing ${targetDisplayName(event.target)}...`;
  }
  const changedFiles = event.result.result?.filesChanged ?? 0;
  return `[tag] Done ${targetDisplayName(event.target)} (${changedFiles} changes)`;
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
  const lines = [withTagColor("⚠️ Warnings & Errors", TAG_COLORS.YELLOW)];
  for (const entry of entries) {
    lines.push(withTagColor(`- ${entry}`, TAG_COLORS.RED));
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
  const summaryColor = hasError ? TAG_COLORS.RED : isDryRun ? TAG_COLORS.YELLOW : TAG_COLORS.GREEN;
  const lines = [
    withTagColor(
      `${summaryPrefix} version=${result.versionSummary}${versionSuffix} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}`,
      summaryColor,
    ),
  ];
  if (result.skippedPackages.length > 0) {
    lines.push(`[tag] Skipped: ${result.skippedPackages.length} package(s)`);
  }
  return lines.join("\n");
}

/**
 * Prints tag sync output and returns a process exit code (0 success, 1 when empty targets or hook/run errors).
 */
export function presentTagSyncCliResult(
  logger: CliLogger,
  tagResult: TagSyncResult,
  rootDir: string,
): number {
  logger.out(formatTargetTable(tagResult.selectedTargets, rootDir));
  if (tagResult.selectedTargets.length === 0) {
    logger.err(
      "No packages found in workspace. Check your pnpm-workspace.yaml or provide an explicit target path.",
    );
    return CLI_EXIT_GENERAL_ERROR;
  }
  const warningsAndErrorsSection = formatWarningsAndErrors(tagResult);
  if (warningsAndErrorsSection) {
    logger.err(warningsAndErrorsSection);
  }
  logger.out(formatSummary(tagResult));
  return exitCodeForTagSyncResult(tagResult);
}

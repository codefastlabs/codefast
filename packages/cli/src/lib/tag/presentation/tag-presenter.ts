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

export type TagProgressEvent =
  | { type: "target-started"; target: TagResolvedTarget }
  | { type: "target-completed"; target: TagResolvedTarget; result: TagTargetExecutionResult };

function targetDisplayName(target: TagResolvedTarget): string {
  return target.packageName ?? target.rootRelativeTargetPath;
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

export function formatProgress(event: TagProgressEvent): string {
  if (event.type === "target-started") {
    return `[tag] Processing ${targetDisplayName(event.target)}...`;
  }
  const changedFiles = event.result.result?.filesChanged ?? 0;
  return `[tag] Done ${targetDisplayName(event.target)} (${changedFiles} changes)`;
}

export function formatTargetTable(targets: TagResolvedTarget[], rootDir: string): string {
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

export function formatWarningsAndErrors(result: TagSyncResult): string | null {
  const entries = warningsAndErrorsFromResult(result);
  if (entries.length === 0) {
    return null;
  }
  const lines = [`${CliColors.YELLOW}⚠️ Warnings & Errors${CliColors.RESET}`];
  for (const entry of entries) {
    lines.push(`${CliColors.RED}- ${entry}${CliColors.RESET}`);
  }
  return lines.join("\n");
}

export function formatSummary(result: TagSyncResult): string {
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
  return `${summaryColor}${summaryPrefix} version=${result.versionSummary}${versionSuffix} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}${CliColors.RESET}`;
}

export function createTagProgressListener(
  onProgressLine: (line: string) => void,
): TagProgressListener {
  return {
    onTargetStarted: (target: TagResolvedTarget) => {
      onProgressLine(formatProgress({ type: "target-started", target }));
    },
    onTargetCompleted: (target: TagResolvedTarget, result: TagTargetExecutionResult) => {
      onProgressLine(formatProgress({ type: "target-completed", target, result }));
    },
  };
}

import { inject, injectable } from "@codefast/di";
import { exitCodeForTagSyncResult } from "#/domains/tag/application/tag-sync-cli-result";
import type { PresentTagSyncResultPresenter as PresentTagSyncResultPresenterContract } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.presenter";
import type { TagResolvedTarget, TagSyncResult } from "#/domains/tag/domain/types.domain";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import { CLI_EXIT_GENERAL_ERROR } from "#/shell/domain/cli-exit-codes.domain";

@injectable([inject(CliLoggerPortToken)])
export class PresentTagSyncResultPresenter implements PresentTagSyncResultPresenterContract {
  private static readonly colorReset = "\x1b[0m";
  private static readonly colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
  } as const;

  constructor(private readonly logger: CliLoggerPort) {}

  present(result: TagSyncResult, rootDir: string): number {
    this.logger.out(this.formatTargetTable(result.selectedTargets, rootDir));
    if (result.selectedTargets.length === 0) {
      this.logger.err(
        "No packages found in workspace. Check your pnpm-workspace.yaml or provide an explicit target path.",
      );
      return CLI_EXIT_GENERAL_ERROR;
    }
    const warningsAndErrorsSection = this.formatWarningsAndErrors(result);
    if (warningsAndErrorsSection) {
      this.logger.err(warningsAndErrorsSection);
    }
    this.logger.out(this.formatSummary(result));
    return exitCodeForTagSyncResult(result);
  }

  private withColorizedLine(line: string, colorCode: string): string {
    return `${colorCode}${line}${PresentTagSyncResultPresenter.colorReset}`;
  }

  private warningsAndErrorsFromResult(result: TagSyncResult): string[] {
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

  private formatTargetTable(targets: TagResolvedTarget[], rootDir: string): string {
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

  private formatWarningsAndErrors(result: TagSyncResult): string | null {
    const entries = this.warningsAndErrorsFromResult(result);
    if (entries.length === 0) {
      return null;
    }
    const lines = [
      this.withColorizedLine("⚠️ Warnings & Errors", PresentTagSyncResultPresenter.colors.yellow),
    ];
    for (const entry of entries) {
      lines.push(this.withColorizedLine(`- ${entry}`, PresentTagSyncResultPresenter.colors.red));
    }
    return lines.join("\n");
  }

  private formatSummary(result: TagSyncResult): string {
    const isDryRun = result.mode === "dry-run";
    const summaryPrefix = isDryRun ? "[tag:dry-run]" : "[tag]";
    const versionSuffix =
      result.versionSummary === "mixed" && result.distinctVersions.length > 0
        ? ` [${result.distinctVersions.join(", ")}]`
        : "";
    const hasError =
      result.targetResults.some((targetResult) => targetResult.runError !== null) ||
      result.hookError !== null;
    const summaryColor = hasError
      ? PresentTagSyncResultPresenter.colors.red
      : isDryRun
        ? PresentTagSyncResultPresenter.colors.yellow
        : PresentTagSyncResultPresenter.colors.green;
    const lines = [
      this.withColorizedLine(
        `${summaryPrefix} version=${result.versionSummary}${versionSuffix} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}`,
        summaryColor,
      ),
    ];
    if (result.skippedPackages.length > 0) {
      lines.push(`[tag] Skipped: ${result.skippedPackages.length} package(s)`);
    }
    return lines.join("\n");
  }
}

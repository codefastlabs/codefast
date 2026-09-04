import { logger } from "#/core/logger";
import type { PackSlimPackageStats, PackSlimProgressListener, PackSlimRunStats } from "#/pack-slim/domain/types";

/**
 * A progress listener that renders pack-slim run events as human-readable CLI lines.
 */
export class PackSlimProgressPresenter implements PackSlimProgressListener {
  private dryRun = false;

  configure(options: { readonly dryRun: boolean }): void {
    this.dryRun = options.dryRun;
  }

  onBanner(): void {
    logger.out(this.dryRun ? "pack-slim (dry run) — no files will change" : "pack-slim — stripping source lane");
  }

  onPackageComplete(stats: PackSlimPackageStats, ordinal: number, total: number): void {
    const position = `[${ordinal}/${total}]`;
    if (stats.skipped) {
      logger.out(`${position} skip ${stats.name} (${stats.skipReason})`);
      return;
    }
    if (stats.error !== null) {
      logger.err(`${position} error ${stats.name}: ${stats.error}`);
      return;
    }
    if (!stats.changed) {
      logger.out(`${position} ok   ${stats.name} (already slim)`);
      return;
    }
    const verb = this.dryRun ? "would drop" : "dropped";
    const parts: Array<string> = [];
    if (stats.filesSrcRemoved) {
      parts.push("files:src");
    }
    if (stats.exportsSourceRemoved > 0) {
      parts.push(`exports:source×${stats.exportsSourceRemoved}`);
    }
    if (stats.importsSourceRemoved > 0) {
      parts.push(`imports:source×${stats.importsSourceRemoved}`);
    }
    if (stats.mapFilesDeleted > 0) {
      parts.push(`maps×${stats.mapFilesDeleted}`);
    }
    if (stats.sourceCommentsStripped > 0) {
      parts.push(`sourceMappingURL×${stats.sourceCommentsStripped}`);
    }
    logger.out(`${position} ok   ${stats.name} — ${verb} ${parts.join(", ")}`);
  }

  onComplete(stats: PackSlimRunStats, elapsedSeconds: number): void {
    logger.out(
      `pack-slim done in ${elapsedSeconds.toFixed(2)}s — ${stats.packagesChanged} changed, ` +
        `${stats.packagesSkipped} skipped, ${stats.totalMapFilesDeleted} maps ${this.dryRun ? "to drop" : "dropped"}` +
        (stats.packagesErrored > 0 ? `, ${stats.packagesErrored} errored` : ""),
    );
  }
}

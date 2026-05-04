import { logger } from "#/core/logger";
import type { MirrorSyncProgressListener } from "#/mirror/sync-types";
import type { GlobalStats, PackageStats } from "#/mirror/domain/types";
import {
  MirrorSyncReporter,
  type CliLoggerLike,
  type MirrorProcessingModeInput,
} from "#/mirror/sync-reporter";

const cliLogger: CliLoggerLike = logger;

/**
 * @since 0.3.16-canary.0
 */
export class MirrorSyncProgressPresenter implements MirrorSyncProgressListener {
  private readonly reporter = new MirrorSyncReporter();
  private verbose = false;

  configure(options: { readonly noColor: boolean; readonly verbose: boolean }): void {
    this.verbose = options.verbose;
    this.reporter.configureMirrorColors(options.noColor);
  }

  onBanner(): void {
    this.reporter.mirrorBanner(cliLogger);
  }

  onProcessingMode(mode: MirrorProcessingModeInput): void {
    this.reporter.mirrorProcessingMode(cliLogger, mode);
  }

  onNoPackages(): void {
    this.reporter.mirrorNoPackages(cliLogger);
  }

  onPackageComplete(pkgStats: PackageStats, ordinal: number, total: number): void {
    if (pkgStats.skipped) {
      this.reporter.logSkippedWorkspacePackage(
        cliLogger,
        ordinal,
        total,
        pkgStats.name,
        pkgStats.skipReason,
      );
      return;
    }
    if (pkgStats.error !== null) {
      this.reporter.logPackageError(
        cliLogger,
        ordinal,
        total,
        pkgStats.name,
        pkgStats.error,
        this.verbose,
      );
      return;
    }
    for (const exportSpecifier of pkgStats.prunedExportKeys) {
      this.reporter.logPrunedStaleExport(cliLogger, exportSpecifier);
    }
    this.reporter.logPackageSuccess(
      cliLogger,
      ordinal,
      total,
      pkgStats,
      { jsCount: pkgStats.jsModules, cssCount: pkgStats.cssExports },
      this.verbose,
    );
  }

  onComplete(stats: GlobalStats, elapsedSeconds: number): void {
    this.reporter.mirrorSummarySeparator(cliLogger);
    this.reporter.mirrorSummary(cliLogger, stats, elapsedSeconds);
  }
}

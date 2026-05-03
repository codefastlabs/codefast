import { inject, injectable } from "@codefast/di";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import type {
  MirrorProcessingMode,
  MirrorSyncProgressListener,
} from "#/domains/mirror/application/ports/presenting/present-mirror-sync-progress.presenter";
import type { GlobalStats, PackageStats } from "#/domains/mirror/domain/types.domain";
import type { MirrorSyncReporterPort } from "#/domains/mirror/application/ports/outbound/mirror-sync-reporter.port";
import { MirrorSyncReporterPortToken } from "#/domains/mirror/composition/tokens";

@injectable([inject(CliLoggerPortToken), inject(MirrorSyncReporterPortToken)])
export class PresentMirrorSyncPresenter implements MirrorSyncProgressListener {
  private verbose = false;

  constructor(
    private readonly logger: CliLoggerPort,
    private readonly reporter: MirrorSyncReporterPort,
  ) {}

  configure(options: { readonly noColor: boolean; readonly verbose: boolean }): void {
    this.verbose = options.verbose;
    this.reporter.configureMirrorColors(options.noColor);
  }

  onBanner(): void {
    this.reporter.mirrorBanner(this.logger);
  }

  onProcessingMode(mode: MirrorProcessingMode): void {
    this.reporter.mirrorProcessingMode(this.logger, mode);
  }

  onNoPackages(): void {
    this.reporter.mirrorNoPackages(this.logger);
  }

  onPackageComplete(pkgStats: PackageStats, ordinal: number, total: number): void {
    if (pkgStats.skipped) {
      this.reporter.logSkippedWorkspacePackage(
        this.logger,
        ordinal,
        total,
        pkgStats.name,
        pkgStats.skipReason,
      );
      return;
    }
    if (pkgStats.error !== null) {
      this.reporter.logPackageError(
        this.logger,
        ordinal,
        total,
        pkgStats.name,
        pkgStats.error,
        this.verbose,
      );
      return;
    }
    for (const exportSpecifier of pkgStats.prunedExportKeys) {
      this.reporter.logPrunedStaleExport(this.logger, exportSpecifier);
    }
    this.reporter.logPackageSuccess(
      this.logger,
      ordinal,
      total,
      pkgStats,
      { jsCount: pkgStats.jsModules, cssCount: pkgStats.cssExports },
      this.verbose,
    );
  }

  onComplete(stats: GlobalStats, elapsedSeconds: number): void {
    this.reporter.mirrorSummarySeparator(this.logger);
    this.reporter.mirrorSummary(this.logger, stats, elapsedSeconds);
  }
}

import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type {
  GlobalStats,
  MirrorDistAssetCounts,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";

export type MirrorProcessingModeInput =
  | { kind: "single" }
  | { kind: "multi"; source: WorkspaceMultiDiscoverySource };

/**
 * Outbound sink: progress and summary lines for mirror sync.
 */
export interface MirrorSyncReporterPort {
  configureMirrorColors(noColor: boolean): void;
  mirrorBanner(logger: CliLoggerPort): void;
  mirrorProcessingMode(logger: CliLoggerPort, mode: MirrorProcessingModeInput): void;
  mirrorNoPackages(logger: CliLoggerPort): void;
  logSkippedWorkspacePackage(
    logger: CliLoggerPort,
    index: number,
    total: number,
    displayName: string,
    reason: string,
  ): void;
  logPackageSuccess(
    logger: CliLoggerPort,
    index: number,
    total: number,
    pkgStats: PackageStats,
    generatedDistAssetCounts: MirrorDistAssetCounts,
    verbose: boolean,
  ): void;
  logPrunedStaleExport(logger: CliLoggerPort, exportSpecifier: string): void;
  logPackageError(
    logger: CliLoggerPort,
    index: number,
    total: number,
    displayName: string,
    errValue: unknown,
    verbose: boolean,
  ): void;
  mirrorSummarySeparator(logger: CliLoggerPort): void;
  mirrorSummary(logger: CliLoggerPort, stats: GlobalStats, elapsedSeconds: number): void;
}

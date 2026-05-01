import type { CliLogger } from "#/shell/application/outbound/cli-io.outbound-port";
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
  mirrorBanner(logger: CliLogger): void;
  mirrorProcessingMode(logger: CliLogger, mode: MirrorProcessingModeInput): void;
  mirrorNoPackages(logger: CliLogger): void;
  logSkippedWorkspacePackage(
    logger: CliLogger,
    index: number,
    total: number,
    displayName: string,
    reason: string,
  ): void;
  logPackageSuccess(
    logger: CliLogger,
    index: number,
    total: number,
    pkgStats: PackageStats,
    generatedDistAssetCounts: MirrorDistAssetCounts,
    verbose: boolean,
  ): void;
  logPrunedStaleExport(logger: CliLogger, exportSpecifier: string): void;
  logPackageError(
    logger: CliLogger,
    index: number,
    total: number,
    displayName: string,
    errValue: unknown,
    verbose: boolean,
  ): void;
  mirrorSummarySeparator(logger: CliLogger): void;
  mirrorSummary(logger: CliLogger, stats: GlobalStats, elapsedSeconds: number): void;
}

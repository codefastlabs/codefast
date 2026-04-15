import type { CliLogger } from "#lib/core/application/ports/cli-io.port";
import type {
  GlobalStats,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#lib/mirror/domain/types.domain";

export type MirrorProcessingModeInput =
  | { kind: "single" }
  | { kind: "multi"; source: WorkspaceMultiDiscoverySource };

/**
 * CLI output for mirror sync — implemented in `presentation`, injected here so `application/use-cases/run-mirror-sync` stays clean.
 */
export type MirrorSyncReporterPort = {
  configureMirrorColors(noColor: boolean): void;
  mirrorBanner(logger: CliLogger): void;
  mirrorProcessingMode(logger: CliLogger, mode: MirrorProcessingModeInput): void;
  mirrorNoPackages(logger: CliLogger): void;
  logWorkspaceGlobWarning(logger: CliLogger, message: string): void;
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
    generatedDistAssetCounts: { jsCount: number; cssCount: number },
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
};

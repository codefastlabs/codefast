import type { GlobalStats, PackageStats, WorkspaceMultiDiscoverySource } from "#/mirror/domain/types";

/**
 * The inputs a mirror run is invoked with.
 *
 * @since 0.3.16-canary.0
 */
export type MirrorSyncRunRequest = {
  rootDir: string;
  packageFilter?: string;
  config?: unknown;
  /** When false, compute and report changes without writing package.json. Defaults to true. */
  write?: boolean;
};

/**
 * Callbacks a mirror run invokes as it progresses through packages.
 *
 * @since 0.3.16-canary.0
 */
export type MirrorSyncProgressListener = {
  configure(options: { readonly noColor: boolean; readonly verbose: boolean; readonly dryRun: boolean }): void;
  onBanner(): void;
  onProcessingMode(
    mode: { readonly kind: "single" } | { readonly kind: "multi"; readonly source: WorkspaceMultiDiscoverySource },
  ): void;
  onNoPackages(): void;
  onPackageComplete(pkgStats: PackageStats, ordinal: number, total: number): void;
  onComplete(stats: GlobalStats, elapsedSeconds: number): void;
};

/**
 * A run request paired with an optional progress listener.
 *
 * @since 0.3.16-canary.0
 */
export type MirrorSyncExecutionInput = MirrorSyncRunRequest & {
  readonly listener?: MirrorSyncProgressListener | undefined;
};

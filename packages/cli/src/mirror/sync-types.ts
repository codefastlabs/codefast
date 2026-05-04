import type {
  GlobalStats,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#/mirror/domain/types.domain";

export type MirrorSyncRunRequest = {
  rootDir: string;
  packageFilter?: string;
  config?: unknown;
};

export type MirrorSyncProgressListener = {
  configure(options: { readonly noColor: boolean; readonly verbose: boolean }): void;
  onBanner(): void;
  onProcessingMode(
    mode:
      | { readonly kind: "single" }
      | { readonly kind: "multi"; readonly source: WorkspaceMultiDiscoverySource },
  ): void;
  onNoPackages(): void;
  onPackageComplete(pkgStats: PackageStats, ordinal: number, total: number): void;
  onComplete(stats: GlobalStats, elapsedSeconds: number): void;
};

export type MirrorSyncExecutionInput = MirrorSyncRunRequest & {
  readonly listener?: MirrorSyncProgressListener | undefined;
};

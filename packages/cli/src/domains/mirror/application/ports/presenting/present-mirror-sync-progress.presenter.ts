import type {
  GlobalStats,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";

export type MirrorProcessingMode =
  | { readonly kind: "single" }
  | { readonly kind: "multi"; readonly source: WorkspaceMultiDiscoverySource };

export interface MirrorSyncProgressListener {
  configure(options: { readonly noColor: boolean; readonly verbose: boolean }): void;
  onBanner(): void;
  onProcessingMode(mode: MirrorProcessingMode): void;
  onNoPackages(): void;
  onPackageComplete(pkgStats: PackageStats, ordinal: number, total: number): void;
  onComplete(stats: GlobalStats, elapsedSeconds: number): void;
}

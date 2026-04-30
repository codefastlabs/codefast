import type { MirrorConfig } from "#/domains/config/domain/schema.domain";
import type { GlobalStats, PackageStats } from "#/domains/mirror/domain/types.domain";

export interface SyncWorkspacePackagePort {
  syncExportsForWorkspacePackage(
    rootDir: string,
    packagePathStr: string,
    index: number,
    total: number,
    config: MirrorConfig,
    verbose: boolean,
    stats: GlobalStats,
    suppressMirrorLogs?: boolean,
  ): Promise<PackageStats>;
}

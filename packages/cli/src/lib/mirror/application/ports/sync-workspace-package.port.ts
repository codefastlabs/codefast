import type { MirrorConfig } from "#/lib/config/domain/schema.domain";
import type { GlobalStats, PackageStats } from "#/lib/mirror/domain/types.domain";

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

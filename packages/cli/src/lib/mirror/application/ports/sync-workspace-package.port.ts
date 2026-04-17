import type { MirrorConfig } from "#/lib/config/domain/schema.domain";
import type { GlobalStats, PackageStats } from "#/lib/mirror/domain/types.domain";

export type SyncWorkspacePackageService = {
  syncExportsForWorkspacePackage(
    rootDir: string,
    packagePathStr: string,
    index: number,
    total: number,
    config: MirrorConfig,
    verbose: boolean,
    stats: GlobalStats,
  ): Promise<PackageStats>;
};

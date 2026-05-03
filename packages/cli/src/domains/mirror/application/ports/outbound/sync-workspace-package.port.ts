import type { MirrorConfig } from "#/domains/config/domain/schema.domain";
import type { PackageStats } from "#/domains/mirror/domain/types.domain";

export interface SyncWorkspacePackagePort {
  syncExportsForWorkspacePackage(
    rootDir: string,
    packagePathStr: string,
    config: MirrorConfig,
  ): Promise<PackageStats>;
}

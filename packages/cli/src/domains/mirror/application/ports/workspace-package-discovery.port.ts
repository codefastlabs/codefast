import type { FindWorkspacePackagesResult } from "#/domains/mirror/domain/types.domain";

export interface WorkspacePackageDiscoveryPort {
  findWorkspacePackageRelPaths(
    rootDir: string,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult>;
}

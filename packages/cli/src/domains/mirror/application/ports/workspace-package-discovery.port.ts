import type { FindWorkspacePackagesResult } from "#/domains/mirror/domain/types.domain";

export interface WorkspacePackageDiscoveryPort {
  /**
   * @see WorkspacePackageLayoutPort.listPackageDirectoryPathsAbsolute — same suppression semantics.
   */
  findWorkspacePackageRelPaths(
    rootDir: string,
    suppressGlobPermissionDiagnostics?: boolean,
  ): Promise<FindWorkspacePackagesResult>;
}

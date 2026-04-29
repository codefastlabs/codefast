import type { FindWorkspacePackagesResult } from "#/lib/mirror/domain/types.domain";

export interface WorkspaceServicePort {
  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string;
  findWorkspacePackageRelPaths(
    rootDir: string,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult>;
}

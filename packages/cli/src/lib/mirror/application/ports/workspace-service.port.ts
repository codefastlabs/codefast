import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { FindWorkspacePackagesResult } from "#/lib/mirror/domain/types.domain";

export interface WorkspaceServicePort {
  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string;
  findWorkspacePackageRelPaths(
    rootDir: string,
    fs: CliFs,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult>;
}

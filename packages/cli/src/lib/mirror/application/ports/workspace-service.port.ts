import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import type { FindWorkspacePackagesResult } from "#lib/mirror/domain/types";

export interface WorkspaceServicePort {
  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string;
  findWorkspacePackageRelPaths(
    rootDir: string,
    fs: CliFs,
    logger: CliLogger,
  ): Promise<FindWorkspacePackagesResult>;
}

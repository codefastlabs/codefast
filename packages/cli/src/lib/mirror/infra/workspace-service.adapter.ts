import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import type { WorkspaceServicePort } from "#lib/mirror/application/ports/workspace-service.port";
import type { FindWorkspacePackagesResult } from "#lib/mirror/domain/types";
import { resolvePackageFilterUnderRoot } from "#lib/mirror/infra/package-filter";
import { findWorkspacePackageRelPaths } from "#lib/mirror/infra/workspace-packages";

export class WorkspaceServiceAdapter implements WorkspaceServicePort {
  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string {
    return resolvePackageFilterUnderRoot(rootDir, packageFilter);
  }

  findWorkspacePackageRelPaths(
    rootDir: string,
    fs: CliFs,
    logger: CliLogger,
  ): Promise<FindWorkspacePackagesResult> {
    return findWorkspacePackageRelPaths(rootDir, fs, logger);
  }
}

import type { CliFs } from "#lib/infra/fs-contract.port";
import type { WorkspaceServicePort } from "#lib/mirror/application/ports/workspace-service.port";
import type { FindWorkspacePackagesResult } from "#lib/mirror/domain/types.domain";
import { resolvePackageFilterUnderRoot } from "#lib/mirror/infra/package-filter.adapter";
import { findWorkspacePackageRelPaths } from "#lib/mirror/infra/workspace-packages.adapter";

export class WorkspaceServiceAdapter implements WorkspaceServicePort {
  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string {
    return resolvePackageFilterUnderRoot(rootDir, packageFilter);
  }

  findWorkspacePackageRelPaths(
    rootDir: string,
    fs: CliFs,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult> {
    return findWorkspacePackageRelPaths(rootDir, fs, onGlobWarning);
  }
}

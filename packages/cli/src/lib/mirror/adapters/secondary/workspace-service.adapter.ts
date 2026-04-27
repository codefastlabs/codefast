import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { WorkspaceServicePort } from "#/lib/mirror/application/ports/workspace-service.port";
import type { FindWorkspacePackagesResult } from "#/lib/mirror/domain/types.domain";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import { resolvePackageFilterUnderRoot } from "#/lib/mirror/infrastructure/package-filter-resolver.service";
import { findWorkspacePackageRelPaths } from "#/lib/mirror/infrastructure/workspace-packages.service";

@injectable([inject(CliFsToken)])
export class WorkspaceServiceAdapter implements WorkspaceServicePort {
  constructor(private readonly fs: CliFs) {}

  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string {
    return resolvePackageFilterUnderRoot(rootDir, packageFilter);
  }

  findWorkspacePackageRelPaths(
    rootDir: string,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult> {
    return findWorkspacePackageRelPaths(rootDir, this.fs, onGlobWarning);
  }
}

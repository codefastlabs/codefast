import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import type { WorkspaceServicePort } from "#/domains/mirror/application/ports/workspace-service.port";
import type { FindWorkspacePackagesResult } from "#/domains/mirror/domain/types.domain";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import { resolvePackageFilterUnderRoot } from "#/domains/mirror/infrastructure/package-filter-resolver.service";
import { findWorkspacePackageRelPaths } from "#/domains/mirror/infrastructure/workspace-packages.service";

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

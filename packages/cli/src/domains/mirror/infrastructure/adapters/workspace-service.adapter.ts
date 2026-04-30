import { inject, injectable } from "@codefast/di";
import type { PackageFilterPathResolverPort } from "#/domains/mirror/application/ports/package-filter-path-resolver.port";
import type { WorkspacePackageDiscoveryPort } from "#/domains/mirror/application/ports/workspace-package-discovery.port";
import type { WorkspaceServicePort } from "#/domains/mirror/application/ports/workspace-service.port";
import {
  PackageFilterPathResolverPortToken,
  WorkspacePackageDiscoveryPortToken,
} from "#/domains/mirror/contracts/tokens";
import type { FindWorkspacePackagesResult } from "#/domains/mirror/domain/types.domain";

@injectable([
  inject(PackageFilterPathResolverPortToken),
  inject(WorkspacePackageDiscoveryPortToken),
])
export class WorkspaceServiceAdapter implements WorkspaceServicePort {
  constructor(
    private readonly packageFilterPathResolver: PackageFilterPathResolverPort,
    private readonly workspacePackageDiscovery: WorkspacePackageDiscoveryPort,
  ) {}

  resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string {
    return this.packageFilterPathResolver.resolvePackageFilterUnderRoot(rootDir, packageFilter);
  }

  findWorkspacePackageRelPaths(
    rootDir: string,
    onGlobWarning: (message: string) => void,
  ): Promise<FindWorkspacePackagesResult> {
    return this.workspacePackageDiscovery.findWorkspacePackageRelPaths(rootDir, onGlobWarning);
  }
}

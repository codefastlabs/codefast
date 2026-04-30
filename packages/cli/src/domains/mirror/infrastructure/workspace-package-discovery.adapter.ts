import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { WorkspacePackageDiscoveryPort } from "#/domains/mirror/application/ports/workspace-package-discovery.port";
import type {
  FindWorkspacePackagesResult,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";
import type { WorkspacePackageLayoutPort } from "#/shell/application/ports/workspace-package-layout.port";
import { WorkspacePackageLayoutPortToken } from "#/shell/application/cli-runtime.tokens";

/**
 * Mirror-facing adapter: maps shell {@link WorkspacePackageLayoutPort} to repo-relative paths for sync.
 */
@injectable([inject(WorkspacePackageLayoutPortToken)])
export class WorkspacePackageDiscoveryAdapter implements WorkspacePackageDiscoveryPort {
  constructor(private readonly workspacePackageLayout: WorkspacePackageLayoutPort) {}

  async findWorkspacePackageRelPaths(
    rootDir: string,
    suppressGlobPermissionDiagnostics?: boolean,
  ): Promise<FindWorkspacePackagesResult> {
    const outcome = await this.workspacePackageLayout.listPackageDirectoryPathsAbsolute(
      rootDir,
      suppressGlobPermissionDiagnostics,
    );

    if (outcome.layoutSource === "declared-empty") {
      return { relPaths: [], multiSource: "declared-empty" };
    }

    const multiSource: WorkspaceMultiDiscoverySource = outcome.layoutSource;

    const relPaths = outcome.packageDirectoryPathsAbsolute
      .map((absolutePath) => normalizePath(path.relative(rootDir, absolutePath)))
      .filter((relPath) => relPath.length > 0);

    relPaths.sort((a, b) => a.localeCompare(b));
    return { relPaths, multiSource };
  }
}

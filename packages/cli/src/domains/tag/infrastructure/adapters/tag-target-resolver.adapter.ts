import { inject, injectable } from "@codefast/di";
import path from "node:path";
import { z } from "zod";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { WorkspacePackageLayoutPort } from "#/shell/application/ports/outbound/workspace-package-layout.port";
import {
  CliFilesystemPortToken,
  WorkspacePackageLayoutPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type { TagEligibleWorkspacePathsPort } from "#/domains/tag/application/ports/outbound/tag-eligible-workspace-paths.port";
import type { TagTargetCandidate } from "#/domains/tag/domain/types.domain";

/**
 * Finds eligible workspace tagging targets via {@link WorkspacePackageLayoutPort}, explicit paths, or `src/` fallback.
 */
@injectable([inject(CliFilesystemPortToken), inject(WorkspacePackageLayoutPortToken)])
export class TagTargetResolverAdapter implements TagEligibleWorkspacePathsPort {
  private readonly packageJsonFileName = "package.json";

  private readonly packageJsonNameSchema = z.looseObject({
    name: z.string().min(1).optional(),
  });

  constructor(
    private readonly fs: CliFilesystemPort,
    private readonly workspacePackageLayout: WorkspacePackageLayoutPort,
  ) {}

  resolveTagTargetCandidates(
    rootDir: string,
    explicitTarget: string | undefined,
  ): Promise<TagTargetCandidate[]> {
    return this.resolveTagTargetCandidatesImpl(rootDir, explicitTarget);
  }

  private toPosix(filePath: string): string {
    return filePath.split(path.sep).join("/");
  }

  private async discoverWorkspacePackageDirs(rootDir: string): Promise<{
    packageDirs: string[];
    hasWorkspaceFile: boolean;
    declaredEmptyPackages: boolean;
  }> {
    /** Tag does not surface workspace glob permission diagnostics on stdout. */
    const outcome = await this.workspacePackageLayout.listPackageDirectoryPathsAbsolute(
      rootDir,
      true,
    );
    return {
      packageDirs: [...outcome.packageDirectoryPathsAbsolute],
      hasWorkspaceFile: outcome.hasPnpmWorkspaceYamlFile,
      declaredEmptyPackages: outcome.layoutSource === "declared-empty",
    };
  }

  private readPackageName(packageDir: string): string | null {
    const pkgFile = this.packageJsonFileName;
    const packageJsonPath = path.join(packageDir, pkgFile);
    if (!this.fs.existsSync(packageJsonPath)) {
      return null;
    }
    try {
      const rawPackageJson = this.fs.readFileSync(packageJsonPath, "utf8");
      const parsedPackageJson = JSON.parse(rawPackageJson) as unknown;
      const parsedPackageName = this.packageJsonNameSchema.safeParse(parsedPackageJson);
      if (!parsedPackageName.success) {
        return null;
      }
      return parsedPackageName.data.name ?? null;
    } catch {
      return null;
    }
  }

  private toRootRelativePath(rootDir: string, absolutePath: string): string {
    const relativePath = path.relative(rootDir, absolutePath);
    return relativePath ? this.toPosix(relativePath) : ".";
  }

  private toPackageTargetCandidate(rootDir: string, packageDir: string): TagTargetCandidate {
    const packageName = this.readPackageName(packageDir);
    return {
      candidatePath: packageDir,
      rootRelativeCandidatePath: this.toRootRelativePath(rootDir, packageDir),
      source: "workspace-package",
      packageDir,
      packageName,
    };
  }

  private async resolveTagTargetCandidatesImpl(
    rootDir: string,
    explicitTarget: string | undefined,
  ): Promise<TagTargetCandidate[]> {
    if (explicitTarget) {
      const resolvedExplicitTarget = path.resolve(explicitTarget);
      return [
        {
          candidatePath: resolvedExplicitTarget,
          rootRelativeCandidatePath: this.toRootRelativePath(rootDir, resolvedExplicitTarget),
          source: "explicit-target",
          packageDir: null,
          packageName: null,
        },
      ];
    }

    const workspaceDiscovery = await this.discoverWorkspacePackageDirs(rootDir);
    if (workspaceDiscovery.packageDirs.length === 0) {
      if (workspaceDiscovery.hasWorkspaceFile) {
        return [];
      }
      const repoSourceDir = path.join(rootDir, "src");
      return [
        {
          candidatePath: repoSourceDir,
          rootRelativeCandidatePath: this.toRootRelativePath(rootDir, repoSourceDir),
          source: "repo-src-fallback",
          packageDir: null,
          packageName: null,
        },
      ];
    }

    return workspaceDiscovery.packageDirs.map((packageDir) =>
      this.toPackageTargetCandidate(rootDir, packageDir),
    );
  }
}

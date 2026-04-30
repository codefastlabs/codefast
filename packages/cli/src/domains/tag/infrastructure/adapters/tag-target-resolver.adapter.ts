import { inject, injectable } from "@codefast/di";
import { globSync } from "node:fs";
import path from "node:path";
import picomatch from "picomatch";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import type { TagTargetResolverPort } from "#/domains/tag/application/ports/target-resolver.port";
import type { TagTargetCandidate } from "#/domains/tag/domain/types.domain";

@injectable([inject(CliFsToken)])
export class TagTargetResolverAdapter implements TagTargetResolverPort {
  private static readonly pnpmWorkspaceFile = "pnpm-workspace.yaml";
  private static readonly packageJsonFile = "package.json";
  private static readonly defaultWorkspacePackagePatterns = ["packages/*"];

  private static readonly pnpmWorkspaceSchema = z.looseObject({
    packages: z.array(z.string()).optional(),
  });

  private static readonly packageNameSchema = z.looseObject({
    name: z.string().min(1).optional(),
  });

  constructor(private readonly fs: CliFs) {}

  resolveTagTargetCandidates(
    rootDir: string,
    explicitTarget: string | undefined,
  ): Promise<TagTargetCandidate[]> {
    return this.resolveTagTargetCandidatesImpl(rootDir, explicitTarget);
  }

  private static toPosix(filePath: string): string {
    return filePath.split(path.sep).join("/");
  }

  private static workspacePatternToPackageJsonGlob(
    pattern: string,
    packageJsonFile: string,
  ): string {
    const normalizedPattern = TagTargetResolverAdapter.toPosix(pattern.trim()).replace(/\/+$/, "");
    if (!normalizedPattern) {
      return `**/${packageJsonFile}`;
    }
    return `${normalizedPattern}/${packageJsonFile}`;
  }

  private static splitWorkspacePackagePatterns(rawPatterns: readonly string[]): {
    include: string[];
    exclude: string[];
  } {
    const include: string[] = [];
    const exclude: string[] = [];
    for (const rawPattern of rawPatterns) {
      const trimmedPattern = rawPattern.trim();
      if (!trimmedPattern) {
        continue;
      }
      if (trimmedPattern.startsWith("!")) {
        exclude.push(trimmedPattern.slice(1).trim());
        continue;
      }
      include.push(trimmedPattern);
    }
    return { include, exclude };
  }

  private async readWorkspacePackagePatterns(
    rootDir: string,
  ): Promise<{ patterns: string[]; hasWorkspaceFile: boolean; declaredEmptyPackages: boolean }> {
    const wf = TagTargetResolverAdapter.pnpmWorkspaceFile;
    const defaults = TagTargetResolverAdapter.defaultWorkspacePackagePatterns;
    const workspaceYamlPath = path.join(rootDir, wf);
    if (!this.fs.existsSync(workspaceYamlPath)) {
      return {
        patterns: [...defaults],
        hasWorkspaceFile: false,
        declaredEmptyPackages: false,
      };
    }

    let workspaceYamlRaw = "";
    try {
      workspaceYamlRaw = await this.fs.readFile(workspaceYamlPath, "utf8");
    } catch (caughtReadError: unknown) {
      throw new Error(`Failed to read ${wf}: ${messageFromCaughtUnknown(caughtReadError)}`);
    }

    let parsedWorkspaceDoc: unknown;
    try {
      parsedWorkspaceDoc = parseYaml(workspaceYamlRaw) as unknown;
    } catch (caughtParseError: unknown) {
      throw new Error(`Failed to parse ${wf}: ${messageFromCaughtUnknown(caughtParseError)}`);
    }

    const parsedWorkspaceResult =
      TagTargetResolverAdapter.pnpmWorkspaceSchema.safeParse(parsedWorkspaceDoc);
    if (!parsedWorkspaceResult.success) {
      const issuePath = parsedWorkspaceResult.error.issues[0]?.path.join(".") ?? "<root>";
      const issueMessage = parsedWorkspaceResult.error.issues[0]?.message ?? "Invalid value";
      throw new Error(`Invalid ${wf} schema at "${issuePath}": ${issueMessage}`);
    }

    const hasPackagesKey =
      typeof parsedWorkspaceDoc === "object" &&
      parsedWorkspaceDoc !== null &&
      Object.prototype.hasOwnProperty.call(parsedWorkspaceDoc, "packages");
    const workspacePackages = parsedWorkspaceResult.data.packages;
    if (!workspacePackages) {
      return {
        patterns: [...defaults],
        hasWorkspaceFile: true,
        declaredEmptyPackages: false,
      };
    }

    if (workspacePackages.length === 0 && hasPackagesKey) {
      return { patterns: [], hasWorkspaceFile: true, declaredEmptyPackages: true };
    }

    return {
      patterns: workspacePackages,
      hasWorkspaceFile: true,
      declaredEmptyPackages: false,
    };
  }

  private async discoverWorkspacePackageDirs(
    rootDir: string,
  ): Promise<{ packageDirs: string[]; hasWorkspaceFile: boolean; declaredEmptyPackages: boolean }> {
    const workspacePackages = await this.readWorkspacePackagePatterns(rootDir);
    const { include, exclude } = TagTargetResolverAdapter.splitWorkspacePackagePatterns(
      workspacePackages.patterns,
    );
    const defaults = TagTargetResolverAdapter.defaultWorkspacePackagePatterns;
    const includePatterns = include.length > 0 ? include : [...defaults];
    const pkgFile = TagTargetResolverAdapter.packageJsonFile;

    const foundPackageDirs = new Set<string>();
    const globOptions = {
      cwd: rootDir,
      posix: true as const,
      ...(path.sep === "\\" ? { windowsPathsNoEscape: true as const } : {}),
    };

    for (const pattern of includePatterns) {
      const packageJsonGlob = TagTargetResolverAdapter.workspacePatternToPackageJsonGlob(
        pattern,
        pkgFile,
      );
      const matches = globSync(packageJsonGlob, globOptions);
      for (const matchedPath of matches) {
        if (!matchedPath.endsWith(`/${pkgFile}`)) {
          continue;
        }
        const packageRelDir = matchedPath.slice(0, -`/${pkgFile}`.length);
        if (!packageRelDir) {
          continue;
        }
        foundPackageDirs.add(path.resolve(rootDir, packageRelDir));
      }
    }

    if (exclude.length === 0) {
      return {
        packageDirs: [...foundPackageDirs].sort((leftDir, rightDir) =>
          leftDir.localeCompare(rightDir),
        ),
        hasWorkspaceFile: workspacePackages.hasWorkspaceFile,
        declaredEmptyPackages: workspacePackages.declaredEmptyPackages,
      };
    }

    const excludeMatchers = exclude.map((excludePattern) =>
      picomatch(excludePattern, { dot: true }),
    );
    const discoveredDirs = [...foundPackageDirs].filter((packageDir) => {
      const relativePackagePath = TagTargetResolverAdapter.toPosix(
        path.relative(rootDir, packageDir),
      );
      return !excludeMatchers.some((excludeMatcher) => excludeMatcher(relativePackagePath));
    });
    discoveredDirs.sort((leftDir, rightDir) => leftDir.localeCompare(rightDir));
    return {
      packageDirs: discoveredDirs,
      hasWorkspaceFile: workspacePackages.hasWorkspaceFile,
      declaredEmptyPackages: workspacePackages.declaredEmptyPackages,
    };
  }

  private readPackageName(packageDir: string): string | null {
    const pkgFile = TagTargetResolverAdapter.packageJsonFile;
    const packageJsonPath = path.join(packageDir, pkgFile);
    if (!this.fs.existsSync(packageJsonPath)) {
      return null;
    }
    try {
      const rawPackageJson = this.fs.readFileSync(packageJsonPath, "utf8");
      const parsedPackageJson = JSON.parse(rawPackageJson) as unknown;
      const parsedPackageName =
        TagTargetResolverAdapter.packageNameSchema.safeParse(parsedPackageJson);
      if (!parsedPackageName.success) {
        return null;
      }
      return parsedPackageName.data.name ?? null;
    } catch {
      return null;
    }
  }

  private static toRootRelativePath(rootDir: string, absolutePath: string): string {
    const relativePath = path.relative(rootDir, absolutePath);
    return relativePath ? TagTargetResolverAdapter.toPosix(relativePath) : ".";
  }

  private toPackageTargetCandidate(rootDir: string, packageDir: string): TagTargetCandidate {
    const packageName = this.readPackageName(packageDir);
    return {
      candidatePath: packageDir,
      rootRelativeCandidatePath: TagTargetResolverAdapter.toRootRelativePath(rootDir, packageDir),
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
          rootRelativeCandidatePath: TagTargetResolverAdapter.toRootRelativePath(
            rootDir,
            resolvedExplicitTarget,
          ),
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
          rootRelativeCandidatePath: TagTargetResolverAdapter.toRootRelativePath(
            rootDir,
            repoSourceDir,
          ),
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

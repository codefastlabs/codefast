import path from "node:path";

import * as z from "zod";

import type { Filesystem } from "#/core/filesystem/filesystem";
import { listWorkspacePackageDirectories } from "#/core/workspace/resolver";
import { packageJsonFileName } from "#/core/workspace/well-known-files";
import type { TagTargetCandidate } from "#/tag/domain/types";

const packageJsonNameSchema = z.looseObject({
  name: z.string().min(1).optional(),
});

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function readPackageName(fs: Filesystem, packageDir: string): string | null {
  const packageJsonPath = path.join(packageDir, packageJsonFileName);
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  try {
    const rawPackageJson = fs.readFileSync(packageJsonPath, "utf8");
    const parsedPackageJson = JSON.parse(rawPackageJson) as unknown;
    const parsedPackageName = packageJsonNameSchema.safeParse(parsedPackageJson);
    if (!parsedPackageName.success) {
      return null;
    }
    return parsedPackageName.data.name ?? null;
  } catch {
    return null;
  }
}

function toRootRelativePath(rootDir: string, absolutePath: string): string {
  const relativePath = path.relative(rootDir, absolutePath);
  return relativePath ? toPosix(relativePath) : ".";
}

function toPackageTargetCandidate(fs: Filesystem, rootDir: string, packageDir: string): TagTargetCandidate {
  const packageName = readPackageName(fs, packageDir);
  return {
    candidatePath: packageDir,
    rootRelativeCandidatePath: toRootRelativePath(rootDir, packageDir),
    source: "workspace-package",
    packageDir,
    packageName,
  };
}

/**
 * Resolves the candidate targets for a tag run: the explicit target, or the discovered workspace packages.
 *
 * @since 0.3.16-canary.0
 */
export async function resolveTagTargetCandidates(
  fs: Filesystem,
  rootDir: string,
  explicitTarget: string | undefined,
): Promise<Array<TagTargetCandidate>> {
  if (explicitTarget) {
    const resolvedExplicitTarget = path.resolve(explicitTarget);
    return [
      {
        candidatePath: resolvedExplicitTarget,
        rootRelativeCandidatePath: toRootRelativePath(rootDir, resolvedExplicitTarget),
        source: "explicit-target",
        packageDir: null,
        packageName: null,
      },
    ];
  }

  const outcome = await listWorkspacePackageDirectories(rootDir, fs, true);
  const packageDirs = [...outcome.packageDirectoryPathsAbsolute];
  const hasWorkspaceFile = outcome.hasPnpmWorkspaceYamlFile;

  if (packageDirs.length === 0) {
    if (hasWorkspaceFile) {
      return [];
    }
    const repoSourceDir = path.join(rootDir, "src");
    return [
      {
        candidatePath: repoSourceDir,
        rootRelativeCandidatePath: toRootRelativePath(rootDir, repoSourceDir),
        source: "repo-src-fallback",
        packageDir: null,
        packageName: null,
      },
    ];
  }

  return packageDirs.map((packageDir) => toPackageTargetCandidate(fs, rootDir, packageDir));
}

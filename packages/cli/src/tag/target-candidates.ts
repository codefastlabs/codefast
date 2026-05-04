import path from "node:path";
import { z } from "zod";
import type { FilesystemPort } from "#/core/filesystem";
import { listWorkspacePackageDirectories } from "#/core/workspace";
import type { TagTargetCandidate } from "#/tag/domain/types";

const packageJsonFileName = "package.json";

const packageJsonNameSchema = z.looseObject({
  name: z.string().min(1).optional(),
});

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function readPackageName(fs: FilesystemPort, packageDir: string): string | null {
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

function toPackageTargetCandidate(
  fs: FilesystemPort,
  rootDir: string,
  packageDir: string,
): TagTargetCandidate {
  const packageName = readPackageName(fs, packageDir);
  return {
    candidatePath: packageDir,
    rootRelativeCandidatePath: toRootRelativePath(rootDir, packageDir),
    source: "workspace-package",
    packageDir,
    packageName,
  };
}

export async function resolveTagTargetCandidates(
  fs: FilesystemPort,
  rootDir: string,
  explicitTarget: string | undefined,
): Promise<TagTargetCandidate[]> {
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

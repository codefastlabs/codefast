import { globSync } from "node:fs";
import path from "node:path";
import picomatch from "picomatch";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import type { TagTargetCandidate } from "#/domains/tag/domain/types.domain";

const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";
const PACKAGE_JSON_FILE = "package.json";
const DEFAULT_WORKSPACE_PACKAGE_PATTERNS = ["packages/*"];

const pnpmWorkspaceSchema = z.looseObject({
  packages: z.array(z.string()).optional(),
});

const packageNameSchema = z.looseObject({
  name: z.string().min(1).optional(),
});

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function workspacePatternToPackageJsonGlob(pattern: string): string {
  const normalizedPattern = toPosix(pattern.trim()).replace(/\/+$/, "");
  if (!normalizedPattern) {
    return `**/${PACKAGE_JSON_FILE}`;
  }
  return `${normalizedPattern}/${PACKAGE_JSON_FILE}`;
}

function splitWorkspacePackagePatterns(rawPatterns: readonly string[]): {
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

async function readWorkspacePackagePatterns(
  rootDir: string,
  fs: CliFs,
): Promise<{ patterns: string[]; hasWorkspaceFile: boolean; declaredEmptyPackages: boolean }> {
  const workspaceYamlPath = path.join(rootDir, PNPM_WORKSPACE_FILE);
  if (!fs.existsSync(workspaceYamlPath)) {
    return {
      patterns: [...DEFAULT_WORKSPACE_PACKAGE_PATTERNS],
      hasWorkspaceFile: false,
      declaredEmptyPackages: false,
    };
  }

  let workspaceYamlRaw = "";
  try {
    workspaceYamlRaw = await fs.readFile(workspaceYamlPath, "utf8");
  } catch (caughtReadError: unknown) {
    throw new Error(
      `Failed to read ${PNPM_WORKSPACE_FILE}: ${messageFromCaughtUnknown(caughtReadError)}`,
    );
  }

  let parsedWorkspaceDoc: unknown;
  try {
    parsedWorkspaceDoc = parseYaml(workspaceYamlRaw) as unknown;
  } catch (caughtParseError: unknown) {
    throw new Error(
      `Failed to parse ${PNPM_WORKSPACE_FILE}: ${messageFromCaughtUnknown(caughtParseError)}`,
    );
  }

  const parsedWorkspaceResult = pnpmWorkspaceSchema.safeParse(parsedWorkspaceDoc);
  if (!parsedWorkspaceResult.success) {
    const issuePath = parsedWorkspaceResult.error.issues[0]?.path.join(".") ?? "<root>";
    const issueMessage = parsedWorkspaceResult.error.issues[0]?.message ?? "Invalid value";
    throw new Error(`Invalid ${PNPM_WORKSPACE_FILE} schema at "${issuePath}": ${issueMessage}`);
  }

  const hasPackagesKey =
    typeof parsedWorkspaceDoc === "object" &&
    parsedWorkspaceDoc !== null &&
    Object.prototype.hasOwnProperty.call(parsedWorkspaceDoc, "packages");
  const workspacePackages = parsedWorkspaceResult.data.packages;
  if (!workspacePackages) {
    return {
      patterns: [...DEFAULT_WORKSPACE_PACKAGE_PATTERNS],
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

async function discoverWorkspacePackageDirs(
  rootDir: string,
  fs: CliFs,
): Promise<{ packageDirs: string[]; hasWorkspaceFile: boolean; declaredEmptyPackages: boolean }> {
  const workspacePackages = await readWorkspacePackagePatterns(rootDir, fs);
  const { include, exclude } = splitWorkspacePackagePatterns(workspacePackages.patterns);
  const includePatterns = include.length > 0 ? include : [...DEFAULT_WORKSPACE_PACKAGE_PATTERNS];

  const foundPackageDirs = new Set<string>();
  const globOptions = {
    cwd: rootDir,
    posix: true as const,
    ...(path.sep === "\\" ? { windowsPathsNoEscape: true as const } : {}),
  };

  for (const pattern of includePatterns) {
    const packageJsonGlob = workspacePatternToPackageJsonGlob(pattern);
    const matches = globSync(packageJsonGlob, globOptions);
    for (const matchedPath of matches) {
      if (!matchedPath.endsWith(`/${PACKAGE_JSON_FILE}`)) {
        continue;
      }
      const packageRelDir = matchedPath.slice(0, -`/${PACKAGE_JSON_FILE}`.length);
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

  const excludeMatchers = exclude.map((excludePattern) => picomatch(excludePattern, { dot: true }));
  const discoveredDirs = [...foundPackageDirs].filter((packageDir) => {
    const relativePackagePath = toPosix(path.relative(rootDir, packageDir));
    return !excludeMatchers.some((excludeMatcher) => excludeMatcher(relativePackagePath));
  });
  discoveredDirs.sort((leftDir, rightDir) => leftDir.localeCompare(rightDir));
  return {
    packageDirs: discoveredDirs,
    hasWorkspaceFile: workspacePackages.hasWorkspaceFile,
    declaredEmptyPackages: workspacePackages.declaredEmptyPackages,
  };
}

function readPackageName(packageDir: string, fs: CliFs): string | null {
  const packageJsonPath = path.join(packageDir, PACKAGE_JSON_FILE);
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  try {
    const rawPackageJson = fs.readFileSync(packageJsonPath, "utf8");
    const parsedPackageJson = JSON.parse(rawPackageJson) as unknown;
    const parsedPackageName = packageNameSchema.safeParse(parsedPackageJson);
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
  rootDir: string,
  packageDir: string,
  fs: CliFs,
): TagTargetCandidate {
  const packageName = readPackageName(packageDir, fs);
  return {
    candidatePath: packageDir,
    rootRelativeCandidatePath: toRootRelativePath(rootDir, packageDir),
    source: "workspace-package",
    packageDir,
    packageName,
  };
}

export async function resolveTagTargetCandidates(
  rootDir: string,
  explicitTarget: string | undefined,
  fs: CliFs,
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

  const workspaceDiscovery = await discoverWorkspacePackageDirs(rootDir, fs);
  if (workspaceDiscovery.packageDirs.length === 0) {
    if (workspaceDiscovery.hasWorkspaceFile) {
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

  return workspaceDiscovery.packageDirs.map((packageDir) =>
    toPackageTargetCandidate(rootDir, packageDir, fs),
  );
}

import path from "node:path";

import { parse as parseYaml } from "yaml";

import { messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import { createAnyGlobMatcher } from "#/core/glob";
import { logger } from "#/core/logger";
import { findNearestAncestor } from "#/core/workspace/ancestor-directories";
import { packageJsonFileName, workspaceYamlFileName } from "#/core/workspace/well-known-files";

/**
 * Whether a resolved project root is a pnpm workspace or a standalone single package.
 */
export type ProjectRootMode = "workspace" | "single-package";

/**
 * A resolved project root and whether it is a pnpm workspace or a standalone single package.
 */
export type ResolvedProjectRoot = {
  readonly rootDir: string;
  readonly mode: ProjectRootMode;
};

/**
 * Resolves the project root: the `pnpm-workspace.yaml` directory, or the nearest `package.json` for a single package.
 */
export function resolveProjectRoot(fromDirectory: string, fs: FilesystemPort): ResolvedProjectRoot {
  // Resolution follows where the user is (cwd), not where the CLI is installed.
  const workspaceRoot = findNearestAncestor(fromDirectory, (directoryPath) =>
    fs.existsSync(path.join(directoryPath, workspaceYamlFileName)),
  );
  if (workspaceRoot !== undefined) {
    return { rootDir: workspaceRoot, mode: "workspace" };
  }
  const packageRoot = findNearestAncestor(fromDirectory, (directoryPath) =>
    fs.existsSync(path.join(directoryPath, packageJsonFileName)),
  );
  if (packageRoot !== undefined) {
    return { rootDir: packageRoot, mode: "single-package" };
  }
  throw new Error(
    `Could not locate a project root (no pnpm-workspace.yaml and no package.json found from: ${fromDirectory})`,
  );
}

/**
 * Where the workspace package patterns came from.
 *
 * @since 0.3.16-canary.0
 */
type WorkspacePackageLayoutSource = "pnpm-workspace-yaml" | "default-patterns" | "declared-empty" | "single-package";

/**
 * The discovered workspace package directories together with how the layout was determined.
 *
 * @since 0.3.16-canary.0
 */
export type WorkspacePackageLayoutOutcome = {
  readonly packageDirectoryPathsAbsolute: Array<string>;
  readonly layoutSource: WorkspacePackageLayoutSource;
  readonly hasPnpmWorkspaceYamlFile: boolean;
};

const defaultIncludePatterns = ["packages/*"];

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function isGlobPermissionError(caughtError: unknown): boolean {
  if (typeof caughtError !== "object" || caughtError === null || !("code" in caughtError)) {
    return false;
  }
  const code = (caughtError as NodeJS.ErrnoException).code;
  return code === "EACCES" || code === "EPERM";
}

function workspacePatternToPackageJsonGlob(pattern: string): string {
  const normalizedPattern = toPosix(pattern.trim()).replace(/\/+$/, "");
  if (!normalizedPattern) {
    return `**/${packageJsonFileName}`;
  }
  return `${normalizedPattern}/${packageJsonFileName}`;
}

function splitPnpmWorkspacePackagesArray(raw: unknown): {
  include: Array<string>;
  exclude: Array<string>;
} {
  const include: Array<string> = [];
  const exclude: Array<string> = [];
  if (!Array.isArray(raw)) {
    return { include, exclude };
  }
  for (const entry of raw) {
    if (typeof entry !== "string") {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("!")) {
      exclude.push(trimmed.slice(1).trim());
    } else {
      include.push(trimmed);
    }
  }
  return { include, exclude };
}

function parsePnpmWorkspaceDocument(doc: unknown): {
  include: Array<string>;
  exclude: Array<string>;
  hasPackagesKey: boolean;
  isEmptyPackagesArray: boolean;
} {
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`${workspaceYamlFileName} root must be a mapping, not an array or scalar`);
  }
  const parsedDoc = doc as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(parsedDoc, "packages")) {
    return { include: [], exclude: [], hasPackagesKey: false, isEmptyPackagesArray: false };
  }
  const packagesField = parsedDoc.packages;
  if (!Array.isArray(packagesField)) {
    throw new Error(`${workspaceYamlFileName} field "packages" must be an array`);
  }
  if (packagesField.length === 0) {
    return { include: [], exclude: [], hasPackagesKey: true, isEmptyPackagesArray: true };
  }
  return {
    ...splitPnpmWorkspacePackagesArray(packagesField),
    hasPackagesKey: true,
    isEmptyPackagesArray: false,
  };
}

async function readWorkspaceYaml(
  rootDir: string,
  fs: FilesystemPort,
): Promise<{ exists: false } | { exists: true; doc: unknown }> {
  const workspaceYamlPath = path.join(rootDir, workspaceYamlFileName);
  if (!fs.existsSync(workspaceYamlPath)) {
    return { exists: false };
  }
  let raw: string;
  try {
    raw = await fs.readFile(workspaceYamlPath, "utf8");
  } catch (caughtReadError: unknown) {
    throw new Error(`Failed to read ${workspaceYamlFileName}: ${messageFrom(caughtReadError)}`, {
      cause: caughtReadError,
    });
  }
  let doc: unknown;
  try {
    doc = parseYaml(raw) as unknown;
  } catch (caughtYamlParseError: unknown) {
    throw new Error(`Failed to parse ${workspaceYamlFileName}: ${messageFrom(caughtYamlParseError)}`, {
      cause: caughtYamlParseError,
    });
  }
  if (doc === null || doc === undefined) {
    throw new Error(`${workspaceYamlFileName} must define a mapping at the document root`);
  }
  return { exists: true, doc };
}

/**
 * Lists the workspace's package directories per `pnpm-workspace.yaml`, falling back to default patterns.
 *
 * @since 0.3.16-canary.0
 */
export async function listWorkspacePackageDirectories(
  rootDirectoryPathAbsolute: string,
  fs: FilesystemPort,
  suppressGlobPermissionDiagnostics?: boolean,
): Promise<WorkspacePackageLayoutOutcome> {
  const workspaceYaml = await readWorkspaceYaml(rootDirectoryPathAbsolute, fs);

  if (!workspaceYaml.exists) {
    // No pnpm-workspace.yaml: treat the nearest package as the whole workspace.
    const rootPackageJsonPath = path.join(rootDirectoryPathAbsolute, packageJsonFileName);
    return {
      packageDirectoryPathsAbsolute: fs.existsSync(rootPackageJsonPath) ? [rootDirectoryPathAbsolute] : [],
      layoutSource: "single-package",
      hasPnpmWorkspaceYamlFile: false,
    };
  }

  let include: Array<string>;
  let exclude: Array<string>;
  let layoutSource: WorkspacePackageLayoutSource;

  const parsed = parsePnpmWorkspaceDocument(workspaceYaml.doc);
  if (!parsed.hasPackagesKey) {
    include = [...defaultIncludePatterns];
    exclude = [];
    layoutSource = "default-patterns";
  } else if (parsed.isEmptyPackagesArray) {
    return {
      packageDirectoryPathsAbsolute: [],
      layoutSource: "declared-empty",
      hasPnpmWorkspaceYamlFile: true,
    };
  } else {
    include = parsed.include;
    exclude = parsed.exclude;
    layoutSource = "pnpm-workspace-yaml";
  }

  const foundRelativePosixPackageRoots = new Set<string>();

  for (const pattern of include) {
    const packageJsonGlob = workspacePatternToPackageJsonGlob(pattern);
    let matches: Array<string>;
    try {
      matches = fs.globSync(packageJsonGlob, { cwd: rootDirectoryPathAbsolute });
    } catch (caughtGlobError: unknown) {
      if (isGlobPermissionError(caughtGlobError)) {
        if (!suppressGlobPermissionDiagnostics) {
          logger.out(`⚠ Skipping workspace glob "${pattern}" (${messageFrom(caughtGlobError)})`);
        }
        continue;
      }
      throw new Error(`Invalid workspace glob "${pattern}": ${messageFrom(caughtGlobError)}`, {
        cause: caughtGlobError,
      });
    }
    const suffix = `/${packageJsonFileName}`;
    for (const matchedPath of matches) {
      const posixPath = toPosix(matchedPath);
      if (!posixPath.endsWith(suffix)) {
        continue;
      }
      const relativeRoot = posixPath.slice(0, -suffix.length);
      if (!relativeRoot) {
        continue;
      }
      foundRelativePosixPackageRoots.add(relativeRoot);
    }
  }

  const isExcluded = createAnyGlobMatcher(exclude, { dot: true });

  const filteredRelative = [...foundRelativePosixPackageRoots].filter((relativeRoot) => !isExcluded(relativeRoot));
  filteredRelative.sort((a, b) => a.localeCompare(b));

  const packageDirectoryPathsAbsolute = filteredRelative.map((relativeRoot) =>
    path.resolve(rootDirectoryPathAbsolute, relativeRoot.split("/").join(path.sep)),
  );

  return {
    packageDirectoryPathsAbsolute,
    layoutSource,
    hasPnpmWorkspaceYamlFile: true,
  };
}

import path from "node:path";

import { parse as parseYaml } from "yaml";

import { messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { createAnyGlobMatcher } from "#core/glob";
import { logger } from "#core/logger";
import { toPosixPath } from "#core/path";
import { findNearestAncestor } from "#core/workspace/ancestor-directories";
import { packageJsonFileName, workspaceYamlFileName } from "#core/workspace/well-known-files";

/**
 * A resolved project root and whether it is a pnpm workspace or a standalone single package.
 *
 * @since 0.10.0
 */
export type ResolvedProjectRoot = {
  readonly rootDir: string;
  readonly mode: "workspace" | "single-package";
};

/**
 * Resolves the project root: the `pnpm-workspace.yaml` directory, or the nearest `package.json` for a single package.
 *
 * @since 0.10.0
 */
export function resolveProjectRoot(fromDirectory: string, fs: Filesystem): ResolvedProjectRoot {
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

const defaultIncludePatterns = ["packages/*"];

function isGlobPermissionError(caughtError: unknown): boolean {
  return (
    typeof caughtError === "object" &&
    caughtError !== null &&
    "code" in caughtError &&
    (caughtError.code === "EACCES" || caughtError.code === "EPERM")
  );
}

function packageJsonGlob(pattern: string): string {
  const normalizedPattern = toPosixPath(pattern.trim()).replace(/\/+$/, "");
  return normalizedPattern ? `${normalizedPattern}/${packageJsonFileName}` : `**/${packageJsonFileName}`;
}

// The include and exclude globs a `pnpm-workspace.yaml` declares; no `packages` key falls back to the default layout.
function readPackagePatterns(rootDir: string, fs: Filesystem): { include: Array<string>; exclude: Array<string> } {
  const yamlPath = path.join(rootDir, workspaceYamlFileName);
  let document: unknown;
  try {
    document = parseYaml(fs.readFileSync(yamlPath, "utf8")) as unknown;
  } catch (caughtError: unknown) {
    throw new Error(`Failed to read ${workspaceYamlFileName}: ${messageFrom(caughtError)}`, { cause: caughtError });
  }
  if (document === null || typeof document !== "object" || Array.isArray(document)) {
    throw new Error(`${workspaceYamlFileName} must define a mapping at the document root`);
  }
  if (!("packages" in document)) {
    return { include: [...defaultIncludePatterns], exclude: [] };
  }
  const declared = document.packages;
  if (!Array.isArray(declared)) {
    throw new Error(`${workspaceYamlFileName} field "packages" must be an array`);
  }
  const include: Array<string> = [];
  const exclude: Array<string> = [];
  for (const entry of declared) {
    const trimmed = typeof entry === "string" ? entry.trim() : "";
    if (trimmed.startsWith("!")) {
      exclude.push(trimmed.slice(1).trim());
    } else if (trimmed) {
      include.push(trimmed);
    }
  }
  return { include, exclude };
}

/**
 * Lists the absolute package directories of a project, sorted: the `pnpm-workspace.yaml` globs, or the root alone.
 *
 * @remarks A workspace glob the user may not read is skipped with a warning on stderr rather than failing the run.
 */
export function listPackageDirectories(root: ResolvedProjectRoot, fs: Filesystem): Array<string> {
  if (root.mode === "single-package") {
    return [root.rootDir];
  }
  const { include, exclude } = readPackagePatterns(root.rootDir, fs);
  const isExcluded = createAnyGlobMatcher(exclude, { dot: true });
  const suffix = `/${packageJsonFileName}`;
  const found = new Set<string>();

  for (const pattern of include) {
    let matches: Array<string>;
    try {
      matches = fs.globSync(packageJsonGlob(pattern), { cwd: root.rootDir });
    } catch (caughtError: unknown) {
      if (isGlobPermissionError(caughtError)) {
        logger.err(`⚠ Skipping workspace glob "${pattern}" (${messageFrom(caughtError)})`);
        continue;
      }
      throw new Error(`Invalid workspace glob "${pattern}": ${messageFrom(caughtError)}`, { cause: caughtError });
    }
    for (const match of matches) {
      const posixMatch = toPosixPath(match);
      const relativeDirectory = posixMatch.endsWith(suffix) ? posixMatch.slice(0, -suffix.length) : "";
      if (relativeDirectory && !isExcluded(relativeDirectory)) {
        found.add(relativeDirectory);
      }
    }
  }

  return [...found]
    .toSorted((left, right) => left.localeCompare(right))
    .map((relativeDirectory) => path.resolve(root.rootDir, ...relativeDirectory.split("/")));
}

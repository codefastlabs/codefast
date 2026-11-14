import path from "node:path";

import { loadConfig } from "#core/config/loader";
import type { CodefastConfig } from "#core/config/schema";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { isWithinDirectory, relativePosixPath } from "#core/path";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import type { ResolvedProjectRoot } from "#core/workspace/resolver";
import { listPackageDirectories, resolveProjectRoot } from "#core/workspace/resolver";
import { packageJsonFileName } from "#core/workspace/well-known-files";

/**
 * A parsed `package.json`.
 */
export type PackageManifest = Readonly<Record<string, unknown>>;

/**
 * A package of the project, its manifest read once for every command.
 */
export interface WorkspacePackage {
  /** The manifest's `name`, or the package directory when it declares none. */
  readonly name: string;
  readonly directory: string;
  /** The package directory as a POSIX path from the root, `"."` for a single-package project. */
  readonly relativeDirectory: string;
  readonly manifest: PackageManifest;
  readonly isPrivate: boolean;
}

/**
 * The project a command runs in: its root, its config, and its packages.
 */
export interface Workspace {
  readonly rootDir: string;
  readonly mode: ResolvedProjectRoot["mode"];
  readonly config: CodefastConfig;
  readonly packages: ReadonlyArray<WorkspacePackage>;
  /** The root's own manifest, which in a workspace belongs to no package. */
  readonly rootManifest: PackageManifest | null;
}

/**
 * Reads a `package.json`, naming the file in the error when it is not a JSON object.
 */
export function readManifest(fs: Filesystem, manifestPath: string): PackageManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (caughtError: unknown) {
    throw new Error(`${manifestPath}: ${messageFrom(caughtError)}`, { cause: caughtError });
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${manifestPath}: the root must be a JSON object`);
  }
  return parsed as PackageManifest;
}

function readPackage(fs: Filesystem, rootDir: string, directory: string): WorkspacePackage {
  const manifest = readManifest(fs, path.join(directory, packageJsonFileName));
  const relativeDirectory = relativePosixPath(rootDir, directory);
  return {
    name: typeof manifest.name === "string" && manifest.name.length > 0 ? manifest.name : relativeDirectory,
    directory,
    relativeDirectory,
    manifest,
    isPrivate: manifest.private === true,
  };
}

/**
 * Resolves the project the working directory sits in, and reads its config and every package manifest.
 */
export async function loadWorkspace(
  fs: Filesystem,
  currentWorkingDirectory: string,
): Promise<Result<Workspace, AppError>> {
  let root: ResolvedProjectRoot;
  try {
    const resolved = resolveProjectRoot(currentWorkingDirectory, fs);
    // Canonical, so every path a report prints relative to it stays stable when the working directory is a symlink.
    root = { ...resolved, rootDir: fs.canonicalPathSync(resolved.rootDir) };
  } catch (caughtError: unknown) {
    return err(new AppError("NOT_FOUND", messageFrom(caughtError)));
  }

  const config = await loadConfig(root.rootDir, fs);
  if (!config.ok) {
    return config;
  }

  try {
    const rootManifestPath = path.join(root.rootDir, packageJsonFileName);
    return ok({
      rootDir: root.rootDir,
      mode: root.mode,
      config: config.value,
      packages: listPackageDirectories(root, fs).map((directory) => readPackage(fs, root.rootDir, directory)),
      rootManifest: fs.existsSync(rootManifestPath) ? readManifest(fs, rootManifestPath) : null,
    });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

/**
 * Returns the innermost package holding a path, if any does.
 */
export function owningPackage(workspace: Workspace, filePath: string): WorkspacePackage | undefined {
  let owner: WorkspacePackage | undefined;
  for (const candidate of workspace.packages) {
    if (
      isWithinDirectory(candidate.directory, filePath) &&
      candidate.directory.length > (owner?.directory.length ?? -1)
    ) {
      owner = candidate;
    }
  }
  return owner;
}

/**
 * Returns the packages a target reaches: every package beneath it, or else the one package holding it.
 */
export function packagesInTarget(workspace: Workspace, targetPath: string): ReadonlyArray<WorkspacePackage> {
  const beneath = workspace.packages.filter((candidate) => isWithinDirectory(targetPath, candidate.directory));
  if (beneath.length > 0) {
    return beneath;
  }
  const owner = owningPackage(workspace, targetPath);
  return owner === undefined ? [] : [owner];
}

import path from "node:path";

import { parse as parseYaml } from "yaml";

import type { EngineViolation, EnginesAuditResult, PackageEngineFloor } from "#audit/domain/types";
import type { NodeVersion } from "#audit/engines/domain/node-floor";
import {
  compareNodeVersions,
  formatNodeVersion,
  isOnReleaseLine,
  parseNodeFloor,
  parseNodeVersion,
} from "#audit/engines/domain/node-floor";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { listWorkspacePackageDirectories } from "#core/workspace/resolver";
import { packageJsonFileName } from "#core/workspace/well-known-files";

const lockfileName = "pnpm-lock.yaml";

const typesPackageName = "@types/node";

// The edges a consumer installs; dev dependencies run on the toolchain's Node, never on the floor.
const runtimeDependencyFields = ["dependencies", "peerDependencies", "optionalDependencies"] as const;

const lockfileDependencyFields = ["dependencies", "devDependencies", "optionalDependencies"] as const;

type WorkspaceManifest = {
  readonly packageName: string;
  readonly directory: string;
  readonly isPrivate: boolean;
  readonly range: string | undefined;
  readonly floor: NodeVersion | null;
  readonly runtimeDependencies: ReadonlyArray<string>;
  readonly checked: boolean;
};

/**
 * Reports every Node floor that breaks a rule a consumer or CI depends on.
 *
 * @remarks A published package declares a floor as `>=X.Y.Z`, no lower than the toolchain's, the floor of any workspace
 * package it depends on at runtime, or the release line of the `@types/node` the lockfile resolves for it.
 */
export async function runEnginesAudit(
  fs: Filesystem,
  args: {
    readonly rootDir: string;
    readonly targetPath: string;
  },
): Promise<Result<EnginesAuditResult, AppError>> {
  try {
    const { rootDir, targetPath } = args;
    const violations: Array<EngineViolation> = [];

    const rootManifest = readManifest(fs, rootDir);
    const toolchainRange = rootManifest === null ? undefined : nodeRangeOf(rootManifest);
    const toolchainFloor = toolchainRange === undefined ? null : parseNodeFloor(toolchainRange);
    if (toolchainRange !== undefined && toolchainFloor === null) {
      violations.push({ kind: "unparsable-floor", packageName: nameOf(rootManifest, "."), range: toolchainRange });
    }

    const layout = await listWorkspacePackageDirectories(rootDir, fs, true);
    const manifests: Array<WorkspaceManifest> = [];
    for (const packageDir of layout.packageDirectoryPathsAbsolute) {
      const manifest = readManifest(fs, packageDir);
      if (manifest === null) {
        continue;
      }
      const directory = toPosixPath(path.relative(rootDir, packageDir)) || ".";
      const range = nodeRangeOf(manifest);
      manifests.push({
        packageName: nameOf(manifest, directory),
        directory,
        isPrivate: manifest.private === true,
        range,
        floor: range === undefined ? null : parseNodeFloor(range),
        runtimeDependencies: runtimeDependencyFields.flatMap((field) => Object.keys(recordOf(manifest[field]))),
        checked: isWithin(packageDir, targetPath) || isWithin(targetPath, packageDir),
      });
    }
    manifests.sort((left, right) => left.directory.localeCompare(right.directory));

    const floorsByName = new Map<string, NodeVersion>();
    for (const { packageName, floor } of manifests) {
      if (floor !== null) {
        floorsByName.set(packageName, floor);
      }
    }
    const typesVersions = readLockfileTypesVersions(fs, rootDir);

    const floors: Array<PackageEngineFloor> = [];
    const checked = manifests.filter((manifest) => manifest.checked);
    for (const manifest of checked) {
      const { packageName, directory, range, floor } = manifest;
      if (range === undefined) {
        if (!manifest.isPrivate) {
          violations.push({ kind: "missing-floor", packageName });
        }
        continue;
      }
      if (floor === null) {
        violations.push({ kind: "unparsable-floor", packageName, range });
        continue;
      }
      const formatted = formatNodeVersion(floor);
      floors.push({ packageName, directory, floor: formatted });

      if (toolchainFloor !== null && compareNodeVersions(floor, toolchainFloor) < 0) {
        violations.push({
          kind: "below-toolchain",
          packageName,
          floor: formatted,
          toolchainFloor: formatNodeVersion(toolchainFloor),
        });
      }

      for (const dependency of manifest.runtimeDependencies) {
        const dependencyFloor = floorsByName.get(dependency);
        if (dependencyFloor !== undefined && compareNodeVersions(floor, dependencyFloor) < 0) {
          violations.push({
            kind: "below-dependency",
            packageName,
            floor: formatted,
            dependency,
            dependencyFloor: formatNodeVersion(dependencyFloor),
          });
        }
      }

      const typesVersion = typesVersions.get(directory);
      const resolvedTypes = typesVersion === undefined ? null : parseNodeVersion(typesVersion);
      if (typesVersion !== undefined && (resolvedTypes === null || !isOnReleaseLine(resolvedTypes, floor))) {
        violations.push({ kind: "types-off-floor", packageName, floor: formatted, typesVersion });
      }
    }

    return ok({
      toolchainFloor: toolchainFloor === null ? null : formatNodeVersion(toolchainFloor),
      floors,
      violations,
      packageCount: checked.length,
    });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function readManifest(fs: Filesystem, directory: string): Record<string, unknown> | null {
  const manifestPath = path.join(directory, packageJsonFileName);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return recordOf(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
}

function nodeRangeOf(manifest: Record<string, unknown>): string | undefined {
  const range = recordOf(manifest.engines).node;
  return typeof range === "string" ? range : undefined;
}

function nameOf(manifest: Record<string, unknown> | null, fallback: string): string {
  return typeof manifest?.name === "string" ? manifest.name : fallback;
}

// The `@types/node` version the lockfile resolves for each importer, keyed by its repo-relative directory.
function readLockfileTypesVersions(fs: Filesystem, rootDir: string): Map<string, string> {
  const versions = new Map<string, string>();
  const lockfilePath = path.join(rootDir, lockfileName);
  if (!fs.existsSync(lockfilePath)) {
    return versions;
  }
  const importers = recordOf(recordOf(parseYaml(fs.readFileSync(lockfilePath, "utf8"))).importers);
  for (const [directory, importer] of Object.entries(importers)) {
    for (const field of lockfileDependencyFields) {
      const version = recordOf(recordOf(recordOf(importer)[field])[typesPackageName]).version;
      if (typeof version === "string") {
        versions.set(directory, version);
      }
    }
  }
  return versions;
}

function recordOf(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWithin(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

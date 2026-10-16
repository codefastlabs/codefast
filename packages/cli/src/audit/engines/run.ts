import path from "node:path";

import { satisfies, validRange } from "semver";
import { parse as parseYaml } from "yaml";

import type { EngineViolation, EnginesAuditResult, PackageEngineFloor } from "#audit/domain/types";
import type { NodeVersion } from "#audit/engines/domain/node-floor";
import { formatNodeVersion, parseNodeFloor, parseNodeVersion, typesFitFloor } from "#audit/engines/domain/node-floor";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { listWorkspacePackageDirectories } from "#core/workspace/resolver";
import { packageJsonFileName } from "#core/workspace/well-known-files";

const lockfileName = "pnpm-lock.yaml";

const typesPackageName = "@types/node";

// Runtime fields are what a consumer installs on the floor; dev dependencies run the package's own tests there in CI.
const dependencyFields = ["dependencies", "peerDependencies", "optionalDependencies", "devDependencies"] as const;

const lockfileDependencyFields = ["dependencies", "devDependencies", "optionalDependencies"] as const;

type WorkspaceManifest = {
  readonly packageName: string;
  readonly packageDir: string;
  readonly directory: string;
  readonly manifest: Record<string, unknown>;
  readonly checked: boolean;
};

/**
 * Reports every Node floor that breaks a rule a consumer or CI depends on.
 *
 * @remarks A published package declares a floor as `>=X.Y.Z`. Each floor must satisfy the `engines.node` of every
 * dependency that runs on it, and the `@types/node` the lockfile resolves for it must declare nothing the floor lacks.
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

    const layout = await listWorkspacePackageDirectories(rootDir, fs, true);
    const manifests: Array<WorkspaceManifest> = [];
    for (const packageDir of layout.packageDirectoryPathsAbsolute) {
      const manifest = readManifest(fs, packageDir);
      if (manifest === null) {
        continue;
      }
      const directory = toPosixPath(path.relative(rootDir, packageDir)) || ".";
      manifests.push({
        packageName: typeof manifest.name === "string" ? manifest.name : directory,
        packageDir,
        directory,
        manifest,
        checked: isWithin(packageDir, targetPath) || isWithin(targetPath, packageDir),
      });
    }
    manifests.sort((left, right) => left.directory.localeCompare(right.directory));

    const workspaceManifests = new Map(manifests.map((entry) => [entry.packageName, entry.manifest]));
    const typesVersions = readLockfileTypesVersions(fs, rootDir);

    const floors: Array<PackageEngineFloor> = [];
    const violations: Array<EngineViolation> = [];
    const checked = manifests.filter((entry) => entry.checked);
    for (const { packageName, packageDir, directory, manifest } of checked) {
      const range = nodeRangeOf(manifest);
      if (range === undefined) {
        if (manifest.private !== true) {
          violations.push({ kind: "missing-floor", packageName });
        }
        continue;
      }
      const floor = parseNodeFloor(range);
      if (floor === null) {
        violations.push({ kind: "unparsable-floor", packageName, range });
        continue;
      }
      const formatted = formatNodeVersion(floor);
      floors.push({ packageName, directory, floor: formatted });

      for (const { dependency, field } of dependenciesOf(manifest)) {
        const dependencyManifest =
          workspaceManifests.get(dependency) ?? readInstalledManifest(fs, packageDir, dependency);
        const dependencyRange = dependencyManifest === null ? undefined : nodeRangeOf(dependencyManifest);
        if (dependencyRange !== undefined && !floorSatisfies(floor, dependencyRange)) {
          violations.push({
            kind: "outside-dependency-engines",
            packageName,
            floor: formatted,
            dependency,
            field,
            range: dependencyRange,
          });
        }
      }

      const typesVersion = typesVersions.get(directory);
      const resolvedTypes = typesVersion === undefined ? null : parseNodeVersion(typesVersion);
      if (typesVersion !== undefined && (resolvedTypes === null || !typesFitFloor(resolvedTypes, floor))) {
        violations.push({ kind: "types-off-floor", packageName, floor: formatted, typesVersion });
      }
    }

    return ok({ floors, violations, packageCount: checked.length });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

// Each dependency once, under the first field that lists it.
function dependenciesOf(manifest: Record<string, unknown>): Array<{ dependency: string; field: string }> {
  const seen = new Set<string>();
  const dependencies: Array<{ dependency: string; field: string }> = [];
  for (const field of dependencyFields) {
    for (const dependency of Object.keys(recordOf(manifest[field]))) {
      if (!seen.has(dependency)) {
        seen.add(dependency);
        dependencies.push({ dependency, field });
      }
    }
  }
  return dependencies;
}

// A range no semver parser reads cannot be judged, so it passes rather than guessing.
function floorSatisfies(floor: NodeVersion, range: string): boolean {
  return validRange(range) === null || satisfies(formatNodeVersion(floor), range);
}

function readManifest(fs: Filesystem, directory: string): Record<string, unknown> | null {
  const manifestPath = path.join(directory, packageJsonFileName);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return recordOf(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
}

// The manifest pnpm links into the package's own `node_modules`; a dependency not installed there is not judged.
function readInstalledManifest(fs: Filesystem, packageDir: string, dependency: string): Record<string, unknown> | null {
  return readManifest(fs, path.join(packageDir, "node_modules", ...dependency.split("/")));
}

function nodeRangeOf(manifest: Record<string, unknown>): string | undefined {
  const range = recordOf(manifest.engines).node;
  return typeof range === "string" ? range : undefined;
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

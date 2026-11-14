import path from "node:path";

import { satisfies } from "semver";
import { parseAllDocuments } from "yaml";

import type { AuditContext, AuditScan } from "#audit/domain/types";
import type { NodeVersion } from "#audit/engines/domain/node-floor";
import {
  compareNodeVersions,
  formatNodeVersion,
  parseNodeFloor,
  parseNodeVersion,
  typesFitFloor,
} from "#audit/engines/domain/node-floor";
import { shortLivedMajors, uncoveredNodeRanges } from "#audit/engines/domain/range-gaps";
import type { EngineViolation, PackageEngineFloor } from "#audit/engines/domain/violation";
import { describeViolation, violationText } from "#audit/engines/domain/violation";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { isWithinDirectory } from "#core/path";
import type { Finding } from "#core/report";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { lineOfText } from "#core/source-position";
import { packageJsonFileName } from "#core/workspace/well-known-files";
import type { Workspace } from "#core/workspace/workspace";
import { readManifest } from "#core/workspace/workspace";

const lockfileName = "pnpm-lock.yaml";

// The Node release CI develops and runs every package's tests on, besides the floor.
const nodeVersionFileName = ".node-version";

const typesPackageName = "@types/node";

// Runtime fields are what a consumer installs on every release the floor claims; dev dependencies run the package's
// own tests, which CI runs on the floor and on the newest line.
const dependencyFields = ["dependencies", "peerDependencies", "optionalDependencies", "devDependencies"] as const;

const testFields: ReadonlySet<string> = new Set(["devDependencies"]);

const lockfileDependencyFields = ["dependencies", "devDependencies", "optionalDependencies"] as const;

type WorkspaceManifest = {
  readonly packageName: string;
  readonly packageDir: string;
  readonly directory: string;
  readonly manifest: Readonly<Record<string, unknown>>;
  readonly checked: boolean;
};

/**
 * The scan of `audit:engines`, which also lists every floor it read, for planning the CI legs that run on each.
 */
export interface EnginesScan extends AuditScan {
  readonly floors: ReadonlyArray<PackageEngineFloor>;
}

// Places a violation in the manifest it names: the package's own, or the root's.
function findingOf(fs: Filesystem, workspace: Workspace, violation: EngineViolation): Finding {
  const owner = workspace.packages.find((candidate) => candidate.name === violation.packageName);
  const directory =
    violation.kind === "root-outside-dependency-engines" || owner === undefined ? "." : owner.relativeDirectory;
  const file = directory === "." ? packageJsonFileName : `${directory}/${packageJsonFileName}`;
  const { text, needle } = violationText(violation);
  return {
    file,
    line: lineOfText(fs.readFileSync(path.join(workspace.rootDir, file), "utf8"), needle),
    text,
    message: describeViolation(violation),
  };
}

/**
 * Returns every floor the target reaches and every rule one of them breaks.
 *
 * @remarks A published package declares a floor as `>=X.Y.Z`, the same one every other published package declares. The `engines.node` of every runtime dependency must
 * admit every release from the floor up, short-lived odd lines aside; that of every dev dependency, the floor and the
 * newest release CI tests on. The `@types/node` the lockfile resolves must declare nothing the floor lacks. The
 * workspace root's floor, never listed among `floors`, must be admitted by every dependency any package installs.
 */
export function inspectEngines(
  fs: Filesystem,
  workspace: Workspace,
  targetPath: string,
): {
  readonly floors: Array<PackageEngineFloor>;
  readonly violations: Array<EngineViolation>;
  readonly checked: number;
} {
  const { rootDir } = workspace;

  const manifests: Array<WorkspaceManifest> = workspace.packages.map((workspacePackage) => ({
    packageName: workspacePackage.name,
    packageDir: workspacePackage.directory,
    directory: workspacePackage.relativeDirectory,
    manifest: workspacePackage.manifest,
    checked:
      isWithinDirectory(workspacePackage.directory, targetPath) ||
      isWithinDirectory(targetPath, workspacePackage.directory),
  }));

  const workspaceManifests = new Map(manifests.map((entry) => [entry.packageName, entry.manifest]));
  const typesVersions = readLockfileTypesVersions(fs, rootDir);
  const testedNewest = readNodeVersion(fs, rootDir);

  const sharedFloor = highestPublishedFloor(manifests);
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
    if (manifest.private !== true && sharedFloor !== null && formatted !== sharedFloor) {
      violations.push({ kind: "divergent-floor", packageName, floor: formatted, sharedFloor });
    }
    const unjudgedMajors = shortLivedMajors(floor, testedNewest);
    const tested = [formatted, ...(testedNewest === null ? [] : [formatNodeVersion(testedNewest)])];

    for (const { dependency, field } of dependenciesOf(manifest)) {
      const dependencyManifest =
        workspaceManifests.get(dependency) ?? readInstalledManifest(fs, packageDir, dependency);
      const dependencyRange = dependencyManifest === null ? undefined : nodeRangeOf(dependencyManifest);
      // A range no semver parser reads cannot be judged, so it passes rather than guessing.
      const gaps = dependencyRange === undefined ? null : uncoveredNodeRanges(floor, dependencyRange, unjudgedMajors);
      if (dependencyRange === undefined || gaps === null) {
        continue;
      }
      const uncovered = testFields.has(field)
        ? gaps.filter((gap) => tested.some((version) => satisfies(version, gap)))
        : gaps;
      if (uncovered.length > 0) {
        violations.push({
          kind: "outside-dependency-engines",
          packageName,
          floor: formatted,
          dependency,
          field,
          range: dependencyRange,
          uncovered: uncovered.join(" || "),
        });
      }
    }

    const typesVersion = typesVersions.get(directory);
    const resolvedTypes = typesVersion === undefined ? null : parseNodeVersion(typesVersion);
    if (typesVersion !== undefined && (resolvedTypes === null || !typesFitFloor(resolvedTypes, floor))) {
      violations.push({ kind: "types-off-floor", packageName, floor: formatted, typesVersion });
    }
  }

  if (isWithinDirectory(targetPath, rootDir)) {
    violations.push(...auditRootFloor(fs, workspace, manifests, workspaceManifests, testedNewest));
  }

  return { floors, violations, checked: checked.length };
}

/**
 * Reports every Node floor that breaks a rule a consumer or CI depends on, each at the manifest it names.
 *
 * @since 0.15.0
 */
export function runEnginesAudit({ fs, workspace, target }: AuditContext): Result<EnginesScan, AppError> {
  try {
    const { floors, violations, checked } = inspectEngines(fs, workspace, target.path);
    return ok({
      findings: violations.map((violation) => findingOf(fs, workspace, violation)),
      scannedFiles: 0,
      scannedPackages: checked,
      fixedFiles: [],
      floors,
    });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

/**
 * Reports each dependency installed anywhere in the workspace whose `engines.node` leaves out a release the root floor
 * claims, since a contributor on that release runs every package's build and tests.
 */
function auditRootFloor(
  fs: Filesystem,
  workspace: Workspace,
  manifests: ReadonlyArray<WorkspaceManifest>,
  workspaceManifests: ReadonlyMap<string, Readonly<Record<string, unknown>>>,
  testedNewest: NodeVersion | null,
): Array<EngineViolation> {
  const { rootDir, rootManifest } = workspace;
  const rootRange = rootManifest === null ? undefined : nodeRangeOf(rootManifest);
  const floor = rootRange === undefined ? null : parseNodeFloor(rootRange);
  if (rootManifest === null || floor === null) {
    return [];
  }
  const packageName = typeof rootManifest.name === "string" ? rootManifest.name : ".";
  const formatted = formatNodeVersion(floor);
  const unjudgedMajors = shortLivedMajors(floor, testedNewest);
  const importers: ReadonlyArray<Pick<WorkspaceManifest, "packageName" | "packageDir" | "manifest">> = manifests.some(
    (entry) => entry.packageDir === rootDir,
  )
    ? manifests
    : [{ packageName, packageDir: rootDir, manifest: rootManifest }, ...manifests];

  const byDependency = new Map<string, Extract<EngineViolation, { kind: "root-outside-dependency-engines" }>>();
  for (const importer of importers) {
    for (const { dependency } of dependenciesOf(importer.manifest)) {
      const dependencyManifest =
        workspaceManifests.get(dependency) ?? readInstalledManifest(fs, importer.packageDir, dependency);
      const dependencyRange = dependencyManifest === null ? undefined : nodeRangeOf(dependencyManifest);
      const gaps = dependencyRange === undefined ? null : uncoveredNodeRanges(floor, dependencyRange, unjudgedMajors);
      if (dependencyRange === undefined || gaps === null || gaps.length === 0) {
        continue;
      }
      const key = `${dependency}@${dependencyRange}`;
      const existing = byDependency.get(key);
      if (existing === undefined) {
        byDependency.set(key, {
          kind: "root-outside-dependency-engines",
          packageName,
          floor: formatted,
          dependency,
          range: dependencyRange,
          dependents: [importer.packageName],
          uncovered: gaps.join(" || "),
        });
      } else if (!existing.dependents.includes(importer.packageName)) {
        existing.dependents.push(importer.packageName);
      }
    }
  }
  return [...byDependency.values()];
}

// The packages ship as one set, so a consumer's floor is the highest any of them declares.
function highestPublishedFloor(manifests: ReadonlyArray<WorkspaceManifest>): string | null {
  let highest: NodeVersion | null = null;
  for (const { manifest } of manifests) {
    const range = manifest.private === true ? undefined : nodeRangeOf(manifest);
    const floor = range === undefined ? null : parseNodeFloor(range);
    if (floor !== null && (highest === null || compareNodeVersions(floor, highest) > 0)) {
      highest = floor;
    }
  }
  return highest === null ? null : formatNodeVersion(highest);
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

// The release `.node-version` pins, or `null` when the file is absent or names no full version.
function readNodeVersion(fs: Filesystem, rootDir: string): NodeVersion | null {
  const filePath = path.join(rootDir, nodeVersionFileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return parseNodeVersion(fs.readFileSync(filePath, "utf8").trim().replace(/^v/, ""));
}

// The manifest pnpm links into the package's own `node_modules`; a dependency not installed there is not judged.
function readInstalledManifest(
  fs: Filesystem,
  packageDir: string,
  dependency: string,
): Readonly<Record<string, unknown>> | null {
  const manifestPath = path.join(packageDir, "node_modules", ...dependency.split("/"), packageJsonFileName);
  return fs.existsSync(manifestPath) ? readManifest(fs, manifestPath) : null;
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
  // pnpm prefixes the dependency lockfile with an env document pinning pnpm itself, so the last document is the one.
  const lockfile = parseAllDocuments(fs.readFileSync(lockfilePath, "utf8")).at(-1)?.toJS() as unknown;
  const importers = recordOf(recordOf(lockfile).importers);
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

import path from "node:path";

import { AppError, messageFrom } from "#/core/errors";
import type { DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { listWorkspacePackageDirectories } from "#/core/workspace/resolver";
import { DIST_DIR, PACKAGE_JSON } from "#/mirror/domain/constants";
import type { PackSlimRunRequest } from "#/pack-slim/cli-schema";
import {
  isMapAnnotatedFile,
  isSourceMapFile,
  slimPublishManifest,
  stripSourceMappingComment,
} from "#/pack-slim/domain/transform";
import type { PackSlimPackageStats, PackSlimProgressListener, PackSlimRunStats } from "#/pack-slim/domain/types";

/**
 * A pack-slim run request paired with an optional progress listener.
 *
 * @since 0.8.1
 */
export type PackSlimRunInput = PackSlimRunRequest & {
  readonly listener?: PackSlimProgressListener | undefined;
};

/**
 * Strips the source lane from every published package's build output and returns the aggregate stats.
 *
 * @remarks Meant to run on an ephemeral CI checkout right before `changeset publish`: it rewrites `package.json`, drops
 * `dist` source maps, and clears their now-dangling `sourceMappingURL` directives, so the tarball ships only `dist`
 * runtime and types. Private packages are skipped because `changeset publish` never publishes them.
 *
 * @since 0.8.1
 */
export async function runPackSlim(
  fs: FilesystemPort,
  input: PackSlimRunInput,
): Promise<Result<PackSlimRunStats, AppError>> {
  const write = input.write ?? true;
  const { listener } = input;

  listener?.onBanner?.();
  const startTime = performance.now();

  try {
    const targets = await resolveTargets(fs, input.rootDir, input.packageFilter);

    const stats: PackSlimRunStats = {
      packagesFound: targets.length,
      packagesProcessed: 0,
      packagesSkipped: 0,
      packagesErrored: 0,
      packagesChanged: 0,
      totalMapFilesDeleted: 0,
      packageDetails: [],
    };

    let ordinal = 1;
    for (const packageDir of targets) {
      const pkgStats = await slimWorkspacePackage(fs, packageDir, write);
      stats.packageDetails.push(pkgStats);
      accumulate(stats, pkgStats);
      listener?.onPackageComplete?.(pkgStats, ordinal, targets.length);
      ordinal += 1;
    }

    listener?.onComplete?.(stats, (performance.now() - startTime) / 1000);
    return ok(stats);
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

async function resolveTargets(
  fs: FilesystemPort,
  rootDir: string,
  packageFilter: string | undefined,
): Promise<Array<string>> {
  if (packageFilter !== undefined) {
    const packageDir = path.resolve(rootDir, packageFilter);
    if (!fs.existsSync(path.join(packageDir, PACKAGE_JSON))) {
      throw new Error(`No package.json under "${packageFilter}"`);
    }
    return [packageDir];
  }
  const layout = await listWorkspacePackageDirectories(rootDir, fs, false);
  return [...layout.packageDirectoryPathsAbsolute].sort((left, right) => left.localeCompare(right));
}

async function slimWorkspacePackage(
  fs: FilesystemPort,
  packageDir: string,
  write: boolean,
): Promise<PackSlimPackageStats> {
  const packageJsonPath = path.join(packageDir, PACKAGE_JSON);
  const pkgStats: PackSlimPackageStats = {
    name: path.basename(packageDir),
    path: packageDir,
    skipped: false,
    skipReason: "",
    error: null,
    filesSrcRemoved: false,
    exportsSourceRemoved: 0,
    importsSourceRemoved: 0,
    mapFilesDeleted: 0,
    sourceCommentsStripped: 0,
    changed: false,
  };

  if (!fs.existsSync(packageJsonPath)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "package.json not found";
    return pkgStats;
  }

  try {
    const raw = await fs.readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new SyntaxError("package.json root must be a JSON object");
    }
    const manifest = parsed as Record<string, unknown>;
    if (typeof manifest.name === "string") {
      pkgStats.name = manifest.name;
    }
    if (manifest.private === true) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "private package";
      return pkgStats;
    }

    const { manifest: slimmed, report } = slimPublishManifest(manifest);
    pkgStats.filesSrcRemoved = report.filesSrcRemoved;
    pkgStats.exportsSourceRemoved = report.exportsSourceRemoved;
    pkgStats.importsSourceRemoved = report.importsSourceRemoved;
    if (report.changed && write) {
      await fs.writeFile(packageJsonPath, `${JSON.stringify(slimmed, null, 2)}\n`, "utf8");
    }

    await pruneDist(fs, path.join(packageDir, DIST_DIR), write, pkgStats);

    pkgStats.changed = report.changed || pkgStats.mapFilesDeleted > 0 || pkgStats.sourceCommentsStripped > 0;
  } catch (caughtError: unknown) {
    pkgStats.error = messageFrom(caughtError);
  }

  return pkgStats;
}

async function pruneDist(
  fs: FilesystemPort,
  distDir: string,
  write: boolean,
  pkgStats: PackSlimPackageStats,
): Promise<void> {
  if (!fs.existsSync(distDir)) {
    return;
  }
  const entries = (await fs.readdir(distDir, { recursive: true, withFileTypes: true })) as Array<DirectoryEntry>;
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const filePath = path.join(entry.parentPath, entry.name);
    if (isSourceMapFile(entry.name)) {
      if (write) {
        await fs.unlink(filePath);
      }
      pkgStats.mapFilesDeleted += 1;
      continue;
    }
    if (isMapAnnotatedFile(entry.name)) {
      const contents = await fs.readFile(filePath, "utf8");
      const { text, stripped } = stripSourceMappingComment(contents);
      if (stripped) {
        if (write) {
          await fs.writeFile(filePath, text, "utf8");
        }
        pkgStats.sourceCommentsStripped += 1;
      }
    }
  }
}

function accumulate(stats: PackSlimRunStats, pkgStats: PackSlimPackageStats): void {
  if (pkgStats.skipped) {
    stats.packagesSkipped += 1;
    return;
  }
  if (pkgStats.error !== null) {
    stats.packagesErrored += 1;
    return;
  }
  stats.packagesProcessed += 1;
  stats.totalMapFilesDeleted += pkgStats.mapFilesDeleted;
  if (pkgStats.changed) {
    stats.packagesChanged += 1;
  }
}

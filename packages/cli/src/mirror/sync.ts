import path from "node:path";
import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import type { MirrorConfig } from "#/core/config/schema";
import type {
  FindWorkspacePackagesResult,
  GlobalStats,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#/mirror/domain/types";
import { normalizePath } from "#/mirror/domain/path-normalizer";
import {
  listWorkspacePackageDirectories,
  type WorkspacePackageLayoutOutcome,
} from "#/core/workspace/resolver";
import { resolvePackageFilterUnderRoot } from "#/mirror/package-path";
import { syncExportsForWorkspacePackage } from "#/mirror/sync-workspace-package";
import type { MirrorSyncExecutionInput } from "#/mirror/sync-types";

export type {
  MirrorSyncExecutionInput,
  MirrorSyncProgressListener,
  MirrorSyncRunRequest,
} from "#/mirror/sync-types";

/**
 * @since 0.3.16-canary.0
 */
export async function runMirrorSync(
  fs: FilesystemPort,
  input: MirrorSyncExecutionInput,
): Promise<Result<GlobalStats, AppError>> {
  const config = (input.config ?? {}) as MirrorConfig;
  const { listener } = input;

  listener?.onBanner();

  const startTime = performance.now();

  try {
    let targetPackages: Array<string> = [];
    if (input.packageFilter) {
      const filterOutcome = resolvePackageFilterUnderRoot(fs, input.rootDir, input.packageFilter);
      if (!filterOutcome.ok) {
        return filterOutcome;
      }
      targetPackages = [filterOutcome.value];
      listener?.onProcessingMode({ kind: "single" });
    } else {
      const layoutOutcome = await listWorkspacePackageDirectories(input.rootDir, fs, false);
      const { relPaths, multiSource } = mirrorTargetsFromWorkspaceLayout(
        input.rootDir,
        layoutOutcome,
      );
      targetPackages = relPaths;
      listener?.onProcessingMode({ kind: "multi", source: multiSource });
    }

    const stats: GlobalStats = {
      packagesFound: targetPackages.length,
      packagesProcessed: 0,
      packagesSkipped: 0,
      packagesErrored: 0,
      totalExports: 0,
      totalJsModules: 0,
      totalCssExports: 0,
      packageDetails: [],
    };

    if (targetPackages.length === 0) {
      listener?.onNoPackages();
      listener?.onComplete(stats, (performance.now() - startTime) / 1000);
      return ok(stats);
    }

    let ordinal = 1;
    for (const pkgPath of targetPackages) {
      const pkgStats = await syncExportsForWorkspacePackage(fs, input.rootDir, pkgPath, config);
      stats.packageDetails.push(pkgStats);
      listener?.onPackageComplete(pkgStats, ordinal, targetPackages.length);
      ordinal++;

      accumulateStats(stats, pkgStats);
    }

    const elapsed = (performance.now() - startTime) / 1000;
    listener?.onComplete(stats, elapsed);

    return ok(stats);
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}

function accumulateStats(stats: GlobalStats, pkgStats: PackageStats): void {
  if (pkgStats.skipped) {
    stats.packagesSkipped++;
  } else if (pkgStats.error !== null) {
    stats.packagesErrored++;
  } else {
    stats.packagesProcessed++;
    stats.totalExports += pkgStats.totalExports;
    stats.totalJsModules += pkgStats.jsModules;
    stats.totalCssExports += pkgStats.cssExports;
  }
}

function mirrorTargetsFromWorkspaceLayout(
  rootDir: string,
  layoutOutcome: WorkspacePackageLayoutOutcome,
): FindWorkspacePackagesResult {
  if (layoutOutcome.layoutSource === "declared-empty") {
    return { relPaths: [], multiSource: "declared-empty" };
  }

  const multiSource: WorkspaceMultiDiscoverySource = layoutOutcome.layoutSource;

  const relPaths = layoutOutcome.packageDirectoryPathsAbsolute
    .map((absolutePath) => normalizePath(path.relative(rootDir, absolutePath)))
    .filter((relativePath) => relativePath.length > 0);

  relPaths.sort((left, right) => left.localeCompare(right));
  return { relPaths, multiSource };
}

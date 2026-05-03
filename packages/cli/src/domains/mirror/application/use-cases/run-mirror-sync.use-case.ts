import path from "node:path";
import { inject, injectable } from "@codefast/di";
import {
  MirrorPackagePathPortToken,
  SyncWorkspacePackagePortToken,
} from "#/domains/mirror/composition/tokens";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import { WorkspacePackageLayoutPortToken } from "#/shell/application/cli-runtime.tokens";
import type {
  WorkspacePackageLayoutOutcome,
  WorkspacePackageLayoutPort,
} from "#/shell/application/ports/outbound/workspace-package-layout.port";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { MirrorConfig } from "#/domains/config/domain/schema.domain";
import type { MirrorSyncExecutionInput } from "#/domains/mirror/application/requests/mirror-sync-execution-input";
import type {
  FindWorkspacePackagesResult,
  GlobalStats,
  PackageStats,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";
import type { MirrorPackagePathPort } from "#/domains/mirror/application/ports/outbound/mirror-package-path.port";
import type { SyncWorkspacePackagePort } from "#/domains/mirror/application/ports/outbound/sync-workspace-package.port";
import type { RunMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/run-mirror-sync.port";

@injectable([
  inject(MirrorPackagePathPortToken),
  inject(WorkspacePackageLayoutPortToken),
  inject(SyncWorkspacePackagePortToken),
])
export class RunMirrorSyncUseCase implements RunMirrorSyncPort {
  constructor(
    private readonly mirrorPackagePath: MirrorPackagePathPort,
    private readonly workspacePackageLayout: WorkspacePackageLayoutPort,
    private readonly syncWorkspacePackage: SyncWorkspacePackagePort,
  ) {}

  async execute(input: MirrorSyncExecutionInput): Promise<Result<GlobalStats, AppError>> {
    const config = (input.config ?? {}) as MirrorConfig;
    const { listener } = input;

    listener?.onBanner();

    const startTime = performance.now();

    try {
      let targetPackages: string[] = [];
      if (input.packageFilter) {
        const filterOutcome = this.mirrorPackagePath.resolvePackageFilterUnderRoot(
          input.rootDir,
          input.packageFilter,
        );
        if (!filterOutcome.ok) {
          return filterOutcome;
        }
        targetPackages = [filterOutcome.value];
        listener?.onProcessingMode({ kind: "single" });
      } else {
        const layoutOutcome = await this.workspacePackageLayout.listPackageDirectoryPathsAbsolute(
          input.rootDir,
          false,
        );
        const { relPaths, multiSource } = this.mirrorTargetsFromWorkspaceLayout(
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
        const pkgStats = await this.syncWorkspacePackage.syncExportsForWorkspacePackage(
          input.rootDir,
          pkgPath,
          config,
        );
        stats.packageDetails.push(pkgStats);
        listener?.onPackageComplete(pkgStats, ordinal, targetPackages.length);
        ordinal++;

        this.accumulateStats(stats, pkgStats);
      }

      const elapsed = (performance.now() - startTime) / 1000;
      listener?.onComplete(stats, elapsed);

      return ok(stats);
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }

  private accumulateStats(stats: GlobalStats, pkgStats: PackageStats): void {
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

  private mirrorTargetsFromWorkspaceLayout(
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
}

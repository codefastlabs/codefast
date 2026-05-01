import path from "node:path";
import { inject, injectable } from "@codefast/di";
import {
  MirrorPackagePathPortToken,
  MirrorSyncReporterPortToken,
  SyncWorkspacePackagePortToken,
} from "#/domains/mirror/contracts/tokens";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import type { CliLogger } from "#/shell/application/outbound/cli-io.outbound-port";
import {
  CliLoggerToken,
  WorkspacePackageLayoutPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type {
  WorkspacePackageLayoutOutcome,
  WorkspacePackageLayoutPort,
} from "#/shell/application/outbound/workspace-package-layout.outbound-port";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { MirrorConfig } from "#/domains/config/domain/schema.domain";
import type { MirrorSyncRunRequest } from "#/domains/mirror/application/requests/mirror-sync.request";
import type {
  FindWorkspacePackagesResult,
  GlobalStats,
  WorkspaceMultiDiscoverySource,
} from "#/domains/mirror/domain/types.domain";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";
import type { MirrorPackagePathPort } from "#/domains/mirror/application/outbound/mirror-package-path.outbound-port";
import type { MirrorSyncReporterPort } from "#/domains/mirror/application/outbound/mirror-sync-reporter.outbound-port";
import type { SyncWorkspacePackagePort } from "#/domains/mirror/application/outbound/sync-workspace-package.outbound-port";
import type { RunMirrorSyncUseCase } from "#/domains/mirror/application/inbound/run-mirror-sync.use-case";

@injectable([
  inject(CliLoggerToken),
  inject(MirrorPackagePathPortToken),
  inject(WorkspacePackageLayoutPortToken),
  inject(MirrorSyncReporterPortToken),
  inject(SyncWorkspacePackagePortToken),
])
export class RunMirrorSyncUseCaseImpl implements RunMirrorSyncUseCase {
  constructor(
    private readonly logger: CliLogger,
    private readonly mirrorPackagePath: MirrorPackagePathPort,
    private readonly workspacePackageLayout: WorkspacePackageLayoutPort,
    private readonly mirrorReporter: MirrorSyncReporterPort,
    private readonly syncWorkspacePackage: SyncWorkspacePackagePort,
  ) {}

  async execute(request: MirrorSyncRunRequest): Promise<Result<GlobalStats, AppError>> {
    const config = (request.config ?? {}) as MirrorConfig;
    const json = !!request.json;

    if (!json) {
      this.mirrorReporter.configureMirrorColors(!!request.noColor);
      this.mirrorReporter.mirrorBanner(this.logger);
    }

    const startTime = performance.now();
    const verbose = !!request.verbose;

    try {
      const stats: GlobalStats = {
        packagesFound: 0,
        packagesProcessed: 0,
        packagesSkipped: 0,
        packagesErrored: 0,
        totalExports: 0,
        totalJsModules: 0,
        totalCssExports: 0,
        packageDetails: [],
      };

      let targetPackages: string[] = [];
      if (request.packageFilter) {
        const filterOutcome = this.mirrorPackagePath.resolvePackageFilterUnderRoot(
          request.rootDir,
          request.packageFilter,
        );
        if (!filterOutcome.ok) {
          return filterOutcome;
        }
        targetPackages = [filterOutcome.value];
        if (!json) {
          this.mirrorReporter.mirrorProcessingMode(this.logger, { kind: "single" });
        }
      } else {
        const layoutOutcome = await this.workspacePackageLayout.listPackageDirectoryPathsAbsolute(
          request.rootDir,
          json,
        );
        const { relPaths, multiSource } = this.mirrorTargetsFromWorkspaceLayout(
          request.rootDir,
          layoutOutcome,
        );
        targetPackages = relPaths;
        if (!json) {
          this.mirrorReporter.mirrorProcessingMode(this.logger, {
            kind: "multi",
            source: multiSource,
          });
        }
      }

      stats.packagesFound = targetPackages.length;
      if (targetPackages.length === 0) {
        if (!json) {
          this.mirrorReporter.mirrorNoPackages(this.logger);
        }
        const elapsedEmpty = (performance.now() - startTime) / 1000;
        if (json) {
          this.logger.out(this.formatMirrorSyncJsonOutput(stats, elapsedEmpty));
        }
        return ok(stats);
      }

      let nextPackageOrdinal = 1;
      for (const pkgPath of targetPackages) {
        const pkgStats = await this.syncWorkspacePackage.syncExportsForWorkspacePackage(
          request.rootDir,
          pkgPath,
          nextPackageOrdinal++,
          targetPackages.length,
          config,
          verbose,
          stats,
          json,
        );
        stats.packageDetails.push(pkgStats);
      }

      const elapsed = (performance.now() - startTime) / 1000;
      if (!json) {
        this.mirrorReporter.mirrorSummarySeparator(this.logger);
        this.mirrorReporter.mirrorSummary(this.logger, stats, elapsed);
      } else {
        this.logger.out(this.formatMirrorSyncJsonOutput(stats, elapsed));
      }

      return ok(stats);
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
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

  private formatMirrorSyncJsonOutput(stats: GlobalStats, elapsedSeconds: number): string {
    return JSON.stringify({
      schemaVersion: 1 as const,
      ok: stats.packagesErrored === 0,
      elapsedSeconds,
      stats,
    });
  }
}

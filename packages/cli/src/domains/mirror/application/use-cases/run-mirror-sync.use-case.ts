import { inject, injectable } from "@codefast/di";
import {
  MirrorSyncReporterPortToken,
  SyncWorkspacePackagePortToken,
  WorkspaceServicePortToken,
} from "#/domains/mirror/contracts/tokens";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import type { CliFs, CliLogger } from "#/shell/application/ports/cli-io.port";
import { CliFsToken, CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { MirrorConfig } from "#/domains/config/domain/schema.domain";
import type { MirrorSyncRunRequest } from "#/domains/mirror/application/requests/mirror-sync.request";
import type { GlobalStats } from "#/domains/mirror/domain/types.domain";
import type { WorkspaceServicePort } from "#/domains/mirror/application/ports/workspace-service.port";
import type { MirrorSyncReporterPort } from "#/domains/mirror/application/ports/mirror-sync-reporter.port";
import type { SyncWorkspacePackagePort } from "#/domains/mirror/application/ports/sync-workspace-package.port";

export interface RunMirrorSyncUseCase {
  execute(request: MirrorSyncRunRequest): Promise<Result<GlobalStats, AppError>>;
}

@injectable([
  inject(CliFsToken),
  inject(CliLoggerToken),
  inject(WorkspaceServicePortToken),
  inject(MirrorSyncReporterPortToken),
  inject(SyncWorkspacePackagePortToken),
])
export class RunMirrorSyncUseCaseImpl implements RunMirrorSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly logger: CliLogger,
    private readonly workspaceService: WorkspaceServicePort,
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
        const safe = this.workspaceService.resolvePackageFilterUnderRoot(
          request.rootDir,
          request.packageFilter,
        );
        targetPackages = [safe];
        if (!json) {
          this.mirrorReporter.mirrorProcessingMode(this.logger, { kind: "single" });
        }
      } else {
        const { relPaths, multiSource } = await this.workspaceService.findWorkspacePackageRelPaths(
          request.rootDir,
          json
            ? () => {}
            : (message: string) =>
                this.mirrorReporter.logWorkspaceGlobWarning(this.logger, message),
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

  private formatMirrorSyncJsonOutput(stats: GlobalStats, elapsedSeconds: number): string {
    return JSON.stringify({
      schemaVersion: 1 as const,
      ok: stats.packagesErrored === 0,
      elapsedSeconds,
      stats,
    });
  }
}

import { injectable } from "@codefast/di";
import { appError, type AppError } from "#/lib/core/domain/errors.domain";
import { err, ok, type Result } from "#/lib/core/domain/result.model";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { MirrorConfig } from "#/lib/config/domain/schema.domain";
import type { MirrorSyncRunRequest } from "#/lib/mirror/application/requests/mirror-sync.request";
import type { GlobalStats } from "#/lib/mirror/domain/types.domain";
import type { WorkspaceServicePort } from "#/lib/mirror/application/ports/workspace-service.port";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import type { SyncWorkspacePackageService } from "#/lib/mirror/application/ports/sync-workspace-package.port";
import {
  CliFsToken,
  CliLoggerToken,
  MirrorSyncReporterPortToken,
  SyncWorkspacePackageServiceToken,
  type RunMirrorSyncUseCase,
  WorkspaceServicePortToken,
} from "#/lib/tokens";

@injectable([
  CliFsToken,
  CliLoggerToken,
  WorkspaceServicePortToken,
  MirrorSyncReporterPortToken,
  SyncWorkspacePackageServiceToken,
] as const)
export class RunMirrorSyncUseCaseImpl implements RunMirrorSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly logger: CliLogger,
    private readonly workspaceService: WorkspaceServicePort,
    private readonly mirrorReporter: MirrorSyncReporterPort,
    private readonly syncWorkspacePackage: SyncWorkspacePackageService,
  ) {}

  async execute(request: MirrorSyncRunRequest): Promise<Result<GlobalStats, AppError>> {
    const config = (request.config ?? {}) as MirrorConfig;

    this.mirrorReporter.configureMirrorColors(!!request.noColor);
    this.mirrorReporter.mirrorBanner(this.logger);

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
        this.mirrorReporter.mirrorProcessingMode(this.logger, { kind: "single" });
      } else {
        const { relPaths, multiSource } = await this.workspaceService.findWorkspacePackageRelPaths(
          request.rootDir,
          this.fs,
          (message: string) => this.mirrorReporter.logWorkspaceGlobWarning(this.logger, message),
        );
        targetPackages = relPaths;
        this.mirrorReporter.mirrorProcessingMode(this.logger, {
          kind: "multi",
          source: multiSource,
        });
      }

      stats.packagesFound = targetPackages.length;
      if (targetPackages.length === 0) {
        this.mirrorReporter.mirrorNoPackages(this.logger);
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
        );
        stats.packageDetails.push(pkgStats);
      }

      const elapsed = (performance.now() - startTime) / 1000;
      this.mirrorReporter.mirrorSummarySeparator(this.logger);
      this.mirrorReporter.mirrorSummary(this.logger, stats, elapsed);

      return ok(stats);
    } catch (caughtError: unknown) {
      return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }
}

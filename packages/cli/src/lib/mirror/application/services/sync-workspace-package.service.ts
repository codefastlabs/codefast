import { inject, injectable } from "@codefast/di";
import type { MirrorConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import { CliFsToken, CliLoggerToken, CliPathToken } from "#/lib/core/contracts/tokens";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { DIST_DIR, PACKAGE_JSON } from "#/lib/mirror/domain/constants.domain";
import {
  createPathTransform,
  generateExports,
} from "#/lib/mirror/application/use-cases/generate-mirror-exports.use-case";
import type { FileSystemServicePort } from "#/lib/mirror/application/ports/file-system-service.port";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#/lib/mirror/application/ports/package-repository.port";
import type { SyncWorkspacePackageService } from "#/lib/mirror/application/ports/sync-workspace-package.port";
import type {
  GlobalStats,
  MirrorPackageMeta,
  PackageJsonShape,
  PackageStats,
} from "#/lib/mirror/domain/types.domain";
import {
  FileSystemServicePortToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
} from "#/lib/mirror/contracts/tokens";

function resolvePackageScopedConfig<T>(
  configMap: Record<string, T> | undefined,
  pkgMeta: MirrorPackageMeta,
): T | undefined {
  if (!configMap) {
    return undefined;
  }
  return configMap[pkgMeta.packageName];
}

function isPackageSkipped(
  skipPackagesArray: string[] | undefined,
  pkgMeta: MirrorPackageMeta,
): boolean {
  if (!skipPackagesArray) {
    return false;
  }
  return skipPackagesArray.includes(pkgMeta.packageName);
}

@injectable([
  inject(CliFsToken),
  inject(CliPathToken),
  inject(PackageRepositoryPortToken),
  inject(FileSystemServicePortToken),
  inject(CliLoggerToken),
  inject(MirrorSyncReporterPortToken),
])
export class SyncWorkspacePackageServiceImpl implements SyncWorkspacePackageService {
  constructor(
    private readonly fs: CliFs,
    private readonly pathService: CliPath,
    private readonly packageRepository: PackageRepositoryPort,
    private readonly fileSystemService: FileSystemServicePort,
    private readonly logger: CliLogger,
    private readonly mirrorReporter: MirrorSyncReporterPort,
  ) {}

  async syncExportsForWorkspacePackage(
    rootDir: string,
    packagePathStr: string,
    index: number,
    total: number,
    config: MirrorConfig,
    verbose: boolean,
    stats: GlobalStats,
    suppressMirrorLogs = false,
  ): Promise<PackageStats> {
    const packageDir = this.pathService.resolve(rootDir, packagePathStr);
    const distDir = this.pathService.join(packageDir, DIST_DIR);
    const packageJsonPath = this.pathService.join(packageDir, PACKAGE_JSON);
    const folderBasename = this.pathService.basename(packageDir);

    const pkgStats: PackageStats = {
      name: folderBasename,
      path: packageDir,
      jsModules: 0,
      cssExports: 0,
      customExports: 0,
      totalExports: 0,
      hasTransform: false,
      cssConfigStatus: "",
      skipped: false,
      skipReason: "",
      error: null,
    };

    if (!this.fs.existsSync(packageJsonPath)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "package.json not found";
      stats.packagesSkipped++;
      if (!suppressMirrorLogs) {
        this.mirrorReporter.logSkippedWorkspacePackage(
          this.logger,
          index,
          total,
          folderBasename,
          pkgStats.skipReason,
        );
      }
      return pkgStats;
    }

    let packageJsonParseError: unknown;
    try {
      const pkgContent = await this.fs.readFile(packageJsonPath, "utf8");
      const raw = JSON.parse(pkgContent) as unknown;
      const parsedPackageJson = this.packageRepository.parsePackageJsonShape(
        raw,
      ) as PackageJsonShape;
      pkgStats.name = this.packageRepository.resolvePackageDisplayName(
        parsedPackageJson,
        folderBasename,
      );
    } catch (caughtError: unknown) {
      pkgStats.name = folderBasename;
      packageJsonParseError = caughtError;
    }

    const pkgMeta: MirrorPackageMeta = { packageName: pkgStats.name };

    if (isPackageSkipped(config.skipPackages, pkgMeta)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "configured to skip";
      stats.packagesSkipped++;
      if (!suppressMirrorLogs) {
        this.mirrorReporter.logSkippedWorkspacePackage(
          this.logger,
          index,
          total,
          pkgStats.name,
          pkgStats.skipReason,
        );
      }
      return pkgStats;
    }

    if (packageJsonParseError !== undefined) {
      if (!this.fs.existsSync(distDir)) {
        pkgStats.skipped = true;
        pkgStats.skipReason = "dist/ not found";
        stats.packagesSkipped++;
        if (!suppressMirrorLogs) {
          this.mirrorReporter.logSkippedWorkspacePackage(
            this.logger,
            index,
            total,
            pkgStats.name,
            pkgStats.skipReason,
          );
        }
        return pkgStats;
      }
      pkgStats.error = messageFromCaughtUnknown(packageJsonParseError);
      stats.packagesErrored++;
      if (!suppressMirrorLogs) {
        this.mirrorReporter.logPackageError(
          this.logger,
          index,
          total,
          pkgStats.name,
          packageJsonParseError,
          verbose,
        );
      }
      return pkgStats;
    }

    if (!this.fs.existsSync(distDir)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "dist/ not found";
      stats.packagesSkipped++;
      if (!suppressMirrorLogs) {
        this.mirrorReporter.logSkippedWorkspacePackage(
          this.logger,
          index,
          total,
          pkgStats.name,
          pkgStats.skipReason,
        );
      }
      return pkgStats;
    }

    try {
      const pathTransform = createPathTransform(config, pkgMeta);
      pkgStats.hasTransform = !!pathTransform;

      const cssConfig = resolvePackageScopedConfig(config.cssExports, pkgMeta);
      if (cssConfig === false) {
        pkgStats.cssConfigStatus = "disabled";
      } else if (cssConfig !== undefined) {
        pkgStats.cssConfigStatus = "configured";
      }

      const customExports = resolvePackageScopedConfig(config.customExports, pkgMeta) || {};

      const generatedExports = await generateExports(
        this.pathService,
        this.fileSystemService,
        distDir,
        pathTransform,
        cssConfig,
        customExports,
      );

      const { prunedKeys } = await this.packageRepository.writePackageJsonExportsAtomic(
        packageJsonPath,
        {
          generatedExports: generatedExports.exports,
          managedExportSpecifiers: Object.keys(generatedExports.exports),
          originalPathBySpecifier: generatedExports.originalPathBySpecifier,
        },
      );
      for (const exportSpecifier of prunedKeys) {
        if (!suppressMirrorLogs) {
          this.mirrorReporter.logPrunedStaleExport(this.logger, exportSpecifier);
        }
      }

      pkgStats.jsModules = generatedExports.jsCount;
      pkgStats.cssExports = generatedExports.cssCount;
      pkgStats.customExports = Object.keys(customExports).length;
      pkgStats.totalExports = Object.keys(generatedExports.exports).length;

      stats.packagesProcessed++;
      stats.totalExports += pkgStats.totalExports;
      stats.totalJsModules += pkgStats.jsModules;
      stats.totalCssExports += pkgStats.cssExports;

      if (!suppressMirrorLogs) {
        this.mirrorReporter.logPackageSuccess(
          this.logger,
          index,
          total,
          pkgStats,
          generatedExports,
          verbose,
        );
      }
    } catch (caughtError: unknown) {
      pkgStats.error = messageFromCaughtUnknown(caughtError);
      stats.packagesErrored++;
      if (!suppressMirrorLogs) {
        this.mirrorReporter.logPackageError(
          this.logger,
          index,
          total,
          pkgStats.name,
          caughtError,
          verbose,
        );
      }
    }
    return pkgStats;
  }
}

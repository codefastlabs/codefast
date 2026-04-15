import path from "node:path";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import type { MirrorConfig } from "#lib/config/domain/schema.domain";
import { DIST_DIR, PACKAGE_JSON } from "#lib/mirror/domain/constants.domain";
import {
  createPathTransform,
  generateExports,
} from "#lib/mirror/application/use-cases/generate-mirror-exports.use-case";
import type { FileSystemServicePort } from "#lib/mirror/application/ports/file-system-service.port";
import type { MirrorSyncReporterPort } from "#lib/mirror/application/ports/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#lib/mirror/application/ports/package-repository.port";
import type { WorkspaceServicePort } from "#lib/mirror/application/ports/workspace-service.port";
import type { MirrorSyncRunRequest } from "#lib/mirror/application/requests/mirror-sync.request";
import type {
  GlobalStats,
  MirrorPackageMeta,
  PackageJsonShape,
  PackageStats,
} from "#lib/mirror/domain/types.domain";

export type MirrorSyncRunDeps = {
  readonly fs: CliFs;
  readonly logger: CliLogger;
  readonly workspaceService: WorkspaceServicePort;
  readonly packageRepository: PackageRepositoryPort;
  readonly fileSystemService: FileSystemServicePort;
  readonly mirrorReporter: MirrorSyncReporterPort;
};

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

async function syncExportsForWorkspacePackage(
  fs: CliFs,
  packageRepository: PackageRepositoryPort,
  fileSystemService: FileSystemServicePort,
  logger: CliLogger,
  mirrorReporter: MirrorSyncReporterPort,
  rootDir: string,
  packagePathStr: string,
  index: number,
  total: number,
  config: MirrorConfig,
  verbose: boolean,
  stats: GlobalStats,
): Promise<PackageStats> {
  const packageDir = path.resolve(rootDir, packagePathStr);
  const distDir = path.join(packageDir, DIST_DIR);
  const packageJsonPath = path.join(packageDir, PACKAGE_JSON);
  const folderBasename = path.basename(packageDir);

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

  if (!fs.existsSync(packageJsonPath)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "package.json not found";
    stats.packagesSkipped++;
    mirrorReporter.logSkippedWorkspacePackage(
      logger,
      index,
      total,
      folderBasename,
      pkgStats.skipReason,
    );
    return pkgStats;
  }

  let packageJsonParseError: unknown;
  try {
    const pkgContent = await fs.readFile(packageJsonPath, "utf8");
    const raw = JSON.parse(pkgContent) as unknown;
    const parsedPackageJson = packageRepository.parsePackageJsonShape(raw) as PackageJsonShape;
    pkgStats.name = packageRepository.resolvePackageDisplayName(parsedPackageJson, folderBasename);
  } catch (caughtError: unknown) {
    pkgStats.name = folderBasename;
    packageJsonParseError = caughtError;
  }

  const pkgMeta: MirrorPackageMeta = { packageName: pkgStats.name };

  if (isPackageSkipped(config.skipPackages, pkgMeta)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "configured to skip";
    stats.packagesSkipped++;
    mirrorReporter.logSkippedWorkspacePackage(
      logger,
      index,
      total,
      pkgStats.name,
      pkgStats.skipReason,
    );
    return pkgStats;
  }

  if (packageJsonParseError !== undefined) {
    if (!fs.existsSync(distDir)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "dist/ not found";
      stats.packagesSkipped++;
      mirrorReporter.logSkippedWorkspacePackage(
        logger,
        index,
        total,
        pkgStats.name,
        pkgStats.skipReason,
      );
      return pkgStats;
    }
    pkgStats.error = messageFromCaughtUnknown(packageJsonParseError);
    stats.packagesErrored++;
    mirrorReporter.logPackageError(
      logger,
      index,
      total,
      pkgStats.name,
      packageJsonParseError,
      verbose,
    );
    return pkgStats;
  }

  if (!fs.existsSync(distDir)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "dist/ not found";
    stats.packagesSkipped++;
    mirrorReporter.logSkippedWorkspacePackage(
      logger,
      index,
      total,
      pkgStats.name,
      pkgStats.skipReason,
    );
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
      fs,
      fileSystemService,
      distDir,
      pathTransform,
      cssConfig,
      customExports,
    );

    const { prunedKeys } = await packageRepository.writePackageJsonExportsAtomic(
      fs,
      packageJsonPath,
      {
        generatedExports: generatedExports.exports,
        managedExportSpecifiers: Object.keys(generatedExports.exports),
        originalPathBySpecifier: generatedExports.originalPathBySpecifier,
      },
    );
    for (const exportSpecifier of prunedKeys) {
      mirrorReporter.logPrunedStaleExport(logger, exportSpecifier);
    }

    pkgStats.jsModules = generatedExports.jsCount;
    pkgStats.cssExports = generatedExports.cssCount;
    pkgStats.customExports = Object.keys(customExports).length;
    pkgStats.totalExports = Object.keys(generatedExports.exports).length;

    stats.packagesProcessed++;
    stats.totalExports += pkgStats.totalExports;
    stats.totalJsModules += pkgStats.jsModules;
    stats.totalCssExports += pkgStats.cssExports;

    mirrorReporter.logPackageSuccess(logger, index, total, pkgStats, generatedExports, verbose);
  } catch (caughtError: unknown) {
    pkgStats.error = messageFromCaughtUnknown(caughtError);
    stats.packagesErrored++;
    mirrorReporter.logPackageError(logger, index, total, pkgStats.name, caughtError, verbose);
  }
  return pkgStats;
}

/** @returns Process exit code (0 or 1) on success, or a structured application error. */
export async function runMirrorSync(
  request: MirrorSyncRunRequest,
  deps: MirrorSyncRunDeps,
): Promise<Result<number, AppError>> {
  const { fs, logger, workspaceService, packageRepository, fileSystemService, mirrorReporter } =
    deps;
  const config = (request.config ?? {}) as MirrorConfig;

  mirrorReporter.configureMirrorColors(!!request.noColor);
  mirrorReporter.mirrorBanner(logger);

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
      const safe = workspaceService.resolvePackageFilterUnderRoot(
        request.rootDir,
        request.packageFilter,
      );
      targetPackages = [safe];
      mirrorReporter.mirrorProcessingMode(logger, { kind: "single" });
    } else {
      const { relPaths, multiSource } = await workspaceService.findWorkspacePackageRelPaths(
        request.rootDir,
        fs,
        logger,
      );
      targetPackages = relPaths;
      mirrorReporter.mirrorProcessingMode(logger, { kind: "multi", source: multiSource });
    }

    stats.packagesFound = targetPackages.length;
    if (targetPackages.length === 0) {
      mirrorReporter.mirrorNoPackages(logger);
      return ok(0);
    }

    let nextPackageOrdinal = 1;
    for (const pkgPath of targetPackages) {
      const pkgStats = await syncExportsForWorkspacePackage(
        fs,
        packageRepository,
        fileSystemService,
        logger,
        mirrorReporter,
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
    mirrorReporter.mirrorSummarySeparator(logger);
    mirrorReporter.mirrorSummary(logger, stats, elapsed);

    return ok(stats.packagesErrored > 0 ? 1 : 0);
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}

import path from "node:path";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import type { MirrorConfig } from "#lib/config";
import { DIST_DIR, PACKAGE_JSON } from "#lib/mirror/domain/constants";
import { createPathTransform, generateExports } from "#lib/mirror/application/engine";
import { resolvePackageFilterUnderRoot } from "#lib/mirror/infra/package-filter";
import {
  configureMirrorColors,
  logPackageError,
  logPackageSuccess,
  logSkippedWorkspacePackage,
  mirrorBanner,
  mirrorFatalError,
  mirrorNoPackages,
  mirrorProcessingMode,
  mirrorSummary,
  mirrorSummarySeparator,
} from "#lib/mirror/presentation/reporter";
import type {
  GlobalStats,
  MirrorOptions,
  MirrorPackageMeta,
  PackageJsonShape,
  PackageStats,
} from "#lib/mirror/domain/types";
import {
  resolvePackageDisplayName,
  writePackageJsonExportsAtomic,
} from "#lib/mirror/infra/update-pkg";
import { findWorkspacePackageRelPaths } from "#lib/mirror/infra/workspace-packages";

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
  logger: CliLogger,
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
    logSkippedWorkspacePackage(logger, index, total, folderBasename, pkgStats.skipReason);
    return pkgStats;
  }

  let packageJsonParseError: unknown;
  try {
    const pkgContent = await fs.readFile(packageJsonPath, "utf8");
    const raw = JSON.parse(pkgContent) as unknown;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new SyntaxError("package.json root must be a JSON object");
    }
    const parsedPackageJson = raw as PackageJsonShape;
    pkgStats.name = resolvePackageDisplayName(parsedPackageJson, folderBasename);
  } catch (caughtError: unknown) {
    pkgStats.name = folderBasename;
    packageJsonParseError = caughtError;
  }

  const pkgMeta: MirrorPackageMeta = { packageName: pkgStats.name };

  if (isPackageSkipped(config.skipPackages, pkgMeta)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "configured to skip";
    stats.packagesSkipped++;
    logSkippedWorkspacePackage(logger, index, total, pkgStats.name, pkgStats.skipReason);
    return pkgStats;
  }

  if (packageJsonParseError !== undefined) {
    if (!fs.existsSync(distDir)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "dist/ not found";
      stats.packagesSkipped++;
      logSkippedWorkspacePackage(logger, index, total, pkgStats.name, pkgStats.skipReason);
      return pkgStats;
    }
    pkgStats.error = messageFromCaughtUnknown(packageJsonParseError);
    stats.packagesErrored++;
    logPackageError(logger, index, total, pkgStats.name, packageJsonParseError, verbose);
    return pkgStats;
  }

  if (!fs.existsSync(distDir)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "dist/ not found";
    stats.packagesSkipped++;
    logSkippedWorkspacePackage(logger, index, total, pkgStats.name, pkgStats.skipReason);
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
      distDir,
      pathTransform,
      cssConfig,
      customExports,
    );

    await writePackageJsonExportsAtomic(fs, packageJsonPath, generatedExports.exports);

    pkgStats.jsModules = generatedExports.jsCount;
    pkgStats.cssExports = generatedExports.cssCount;
    pkgStats.customExports = Object.keys(customExports).length;
    pkgStats.totalExports = Object.keys(generatedExports.exports).length;

    stats.packagesProcessed++;
    stats.totalExports += pkgStats.totalExports;
    stats.totalJsModules += pkgStats.jsModules;
    stats.totalCssExports += pkgStats.cssExports;

    logPackageSuccess(logger, index, total, pkgStats, generatedExports, verbose);
  } catch (caughtError: unknown) {
    pkgStats.error = messageFromCaughtUnknown(caughtError);
    stats.packagesErrored++;
    logPackageError(logger, index, total, pkgStats.name, caughtError, verbose);
  }
  return pkgStats;
}

/** @returns Process exit code (0 or 1). */
export async function runMirrorSync(opts: MirrorOptions): Promise<number> {
  const { fs, logger } = opts;
  const config = opts.config ?? {};

  configureMirrorColors(!!opts.noColor);
  mirrorBanner(logger);

  const startTime = performance.now();
  const verbose = !!opts.verbose;

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
    if (opts.packageFilter) {
      const safe = resolvePackageFilterUnderRoot(opts.rootDir, opts.packageFilter);
      targetPackages = [safe];
      mirrorProcessingMode(logger, { kind: "single" });
    } else {
      const { relPaths, multiSource } = await findWorkspacePackageRelPaths(
        opts.rootDir,
        fs,
        logger,
      );
      targetPackages = relPaths;
      mirrorProcessingMode(logger, { kind: "multi", source: multiSource });
    }

    stats.packagesFound = targetPackages.length;
    if (targetPackages.length === 0) {
      mirrorNoPackages(logger);
      return 0;
    }

    let nextPackageOrdinal = 1;
    for (const pkgPath of targetPackages) {
      const pkgStats = await syncExportsForWorkspacePackage(
        fs,
        logger,
        opts.rootDir,
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
    mirrorSummarySeparator(logger);
    mirrorSummary(logger, stats, elapsed);

    return stats.packagesErrored > 0 ? 1 : 0;
  } catch (caughtError: unknown) {
    mirrorFatalError(logger, caughtError);
    return 1;
  }
}

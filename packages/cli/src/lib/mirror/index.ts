import path from "node:path";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";
import { loadMirrorConfig } from "#lib/mirror/config";
import {
  createPathTransform,
  generateExports,
  getExportGroup,
  groupFilesByModule,
  normalizePath,
  toExportPath,
} from "#lib/mirror/engine";
import { resolvePackageFilterUnderRoot } from "#lib/mirror/package-filter";
import type { GlobalStats, MirrorConfig, MirrorOptions, PackageStats } from "#lib/mirror/types";
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
  printMirrorConfigWarnings,
} from "#lib/mirror/reporter";
import {
  readPackageJsonDisplayName,
  resolvePackageDisplayName,
  writePackageJsonExportsAtomic,
} from "#lib/mirror/update-pkg";
import { DIST_DIR, PACKAGE_JSON } from "#lib/mirror/constants";
import { findWorkspacePackageRelPaths } from "#lib/mirror/workspace-packages";

async function processPackage(
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
  const relativePath = normalizePath(path.relative(rootDir, packageDir));
  const pkgName = path.basename(packageDir);

  const pkgStats: PackageStats = {
    name: pkgName,
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

  if (config.skipPackages?.includes(relativePath)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "configured to skip";
    stats.packagesSkipped++;
    pkgStats.name = await readPackageJsonDisplayName(fs, packageJsonPath, pkgName);
    logSkippedWorkspacePackage(logger, index, total, pkgStats.name, pkgStats.skipReason);
    return pkgStats;
  }

  if (!fs.existsSync(packageJsonPath)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "package.json not found";
    stats.packagesSkipped++;
    logSkippedWorkspacePackage(logger, index, total, pkgName, pkgStats.skipReason);
    return pkgStats;
  }

  if (!fs.existsSync(distDir)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "dist/ not found";
    stats.packagesSkipped++;
    pkgStats.name = await readPackageJsonDisplayName(fs, packageJsonPath, pkgName);
    logSkippedWorkspacePackage(logger, index, total, pkgStats.name, pkgStats.skipReason);
    return pkgStats;
  }

  try {
    const pkgContent = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(pkgContent) as { name?: unknown };
    pkgStats.name = resolvePackageDisplayName(packageJson, pkgName);

    const pathTransform = createPathTransform(config, relativePath);
    pkgStats.hasTransform = !!pathTransform;

    const cssConfig = config.cssExports?.[relativePath];
    if (cssConfig === false) pkgStats.cssConfigStatus = "disabled";
    else if (cssConfig !== undefined) pkgStats.cssConfigStatus = "configured";

    const customExports = config.customExports?.[relativePath] || {};

    const generatedExports = await generateExports(
      fs,
      distDir,
      pathTransform,
      cssConfig,
      customExports,
    );
    pkgStats.jsModules = generatedExports.jsCount;
    pkgStats.cssExports = generatedExports.cssCount;
    pkgStats.customExports = Object.keys(customExports).length;
    pkgStats.totalExports = Object.keys(generatedExports.exports).length;

    await writePackageJsonExportsAtomic(fs, packageJsonPath, generatedExports.exports);

    stats.packagesProcessed++;
    stats.totalExports += pkgStats.totalExports;
    stats.totalJsModules += pkgStats.jsModules;
    stats.totalCssExports += pkgStats.cssExports;

    logPackageSuccess(logger, index, total, pkgStats, generatedExports, verbose);
  } catch (e: unknown) {
    pkgStats.error = String(e);
    stats.packagesErrored++;
    const displayName = await readPackageJsonDisplayName(fs, packageJsonPath, pkgName);
    logPackageError(logger, index, total, displayName, e, verbose);
  }
  return pkgStats;
}

/** @returns Process exit code (0 or 1). */
export async function runMirrorSync(opts: MirrorOptions): Promise<number> {
  const fs = opts.fs ?? createNodeCliFs();
  const logger = opts.logger ?? createNodeCliLogger();

  configureMirrorColors(!!opts.noColor);
  mirrorBanner(logger);

  const startTime = performance.now();
  const verbose = !!opts.verbose;

  try {
    const { config, warnings } = await loadMirrorConfig(opts.rootDir, fs);
    printMirrorConfigWarnings(logger, warnings);

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
      const pkgStats = await processPackage(
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
  } catch (e: unknown) {
    mirrorFatalError(logger, e);
    return 1;
  }
}

export type {
  ExportMap,
  ExportMapData,
  FindWorkspacePackagesResult,
  MirrorOptions,
  RunMirrorSyncOptions,
  WorkspaceMultiDiscoverySource,
} from "#lib/mirror/types";
export { MirrorError, MirrorErrorCode } from "#lib/mirror/errors";
export { resolvePackageFilterUnderRoot } from "#lib/mirror/package-filter";
export { parsePnpmWorkspaceDocument } from "#lib/mirror/workspace-packages";
export {
  createPathTransform,
  generateExports,
  getExportGroup,
  groupFilesByModule,
  normalizePath,
  toExportPath,
} from "#lib/mirror/engine";

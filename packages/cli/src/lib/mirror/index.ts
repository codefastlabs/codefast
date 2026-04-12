import path from "node:path";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { isDirentList } from "#lib/shared/utils";
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

async function findWorkspacePackages(fs: CliFs, rootDir: string): Promise<string[]> {
  const packagesDir = path.join(rootDir, "packages");
  try {
    const raw = await fs.readdir(packagesDir, { withFileTypes: true });
    if (!isDirentList(raw)) return [];
    return raw
      .filter((f) => f.isDirectory())
      .map((f) => normalizePath(path.relative(rootDir, path.join(packagesDir, f.name))));
  } catch {
    return [];
  }
}

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

    const res = await generateExports(fs, distDir, pathTransform, cssConfig, customExports);
    pkgStats.jsModules = res.jsCount;
    pkgStats.cssExports = res.cssCount;
    pkgStats.customExports = Object.keys(customExports).length;
    pkgStats.totalExports = Object.keys(res.exports).length;

    await writePackageJsonExportsAtomic(fs, packageJsonPath, res.exports);

    stats.packagesProcessed++;
    stats.totalExports += pkgStats.totalExports;
    stats.totalJsModules += pkgStats.jsModules;
    stats.totalCssExports += pkgStats.cssExports;

    logPackageSuccess(logger, index, total, pkgStats, res, verbose);
  } catch (e: unknown) {
    pkgStats.error = String(e);
    stats.packagesErrored++;
    logPackageError(logger, index, total, pkgName, e, verbose);
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
      targetPackages = [opts.packageFilter];
      mirrorProcessingMode(logger, true);
    } else {
      targetPackages = await findWorkspacePackages(fs, opts.rootDir);
      mirrorProcessingMode(logger, false);
    }

    stats.packagesFound = targetPackages.length;
    if (targetPackages.length === 0) {
      mirrorNoPackages(logger);
      return 0;
    }

    let i = 1;
    for (const pkgPath of targetPackages) {
      const pkgStats = await processPackage(
        fs,
        logger,
        opts.rootDir,
        pkgPath,
        i++,
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
  MirrorOptions,
  RunMirrorSyncOptions,
} from "#lib/mirror/types";
export { MirrorError, MirrorErrorCode } from "#lib/mirror/errors";
export {
  createPathTransform,
  generateExports,
  getExportGroup,
  groupFilesByModule,
  normalizePath,
  toExportPath,
} from "#lib/mirror/engine";

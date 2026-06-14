import path from "node:path";

import type { MirrorConfig } from "#/core/config/schema";
import { messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import { createMirrorDistFilesystem } from "#/mirror/dist-filesystem-impl";
import { DIST_DIR, PACKAGE_JSON } from "#/mirror/domain/constants";
import { createPathTransform, generateExports } from "#/mirror/domain/exports";
import { resolvePackageDisplayName } from "#/mirror/domain/package-display-name";
import type { PackageJsonShape, PackageStats } from "#/mirror/domain/types";
import { buildSourcePathResolver, supplementExportsInPackageJson } from "#/mirror/supplement-exports";
import { writePackageJsonExportsAtomic } from "#/mirror/write-exports";

/**
 * @since 0.3.16-canary.0
 */
export async function syncExportsForWorkspacePackage(
  fs: FilesystemPort,
  rootDir: string,
  packagePathStr: string,
  config: MirrorConfig,
  write = true,
): Promise<PackageStats> {
  const pathJoin = path.join;
  const pathResolve = path.resolve;
  const pathBasename = path.basename;

  const packageDir = pathResolve(rootDir, packagePathStr);
  const distDir = pathJoin(packageDir, DIST_DIR);
  const packageJsonPath = pathJoin(packageDir, PACKAGE_JSON);
  const folderBasename = pathBasename(packageDir);

  const distFilesystem = createMirrorDistFilesystem(fs);

  const pkgStats: PackageStats = {
    name: folderBasename,
    path: packageDir,
    jsModules: 0,
    cssExports: 0,
    extraExports: 0,
    totalExports: 0,
    hasTransform: false,
    cssConfigStatus: "",
    skipped: false,
    skipReason: "",
    error: null,
    prunedExportKeys: [],
  };

  if (!fs.existsSync(packageJsonPath)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "package.json not found";
    return pkgStats;
  }

  let packageJsonParseError: unknown;
  let parsedPackageJson: PackageJsonShape;
  try {
    const packageContent = await fs.readFile(packageJsonPath, "utf8");
    const rawPackageJson = JSON.parse(packageContent) as unknown;
    if (rawPackageJson === null || typeof rawPackageJson !== "object" || Array.isArray(rawPackageJson)) {
      throw new SyntaxError("package.json root must be a JSON object");
    }
    parsedPackageJson = rawPackageJson as PackageJsonShape;
    pkgStats.name = resolvePackageDisplayName(parsedPackageJson, folderBasename);
  } catch (caughtError: unknown) {
    pkgStats.name = folderBasename;
    packageJsonParseError = caughtError;
  }

  const packageName = pkgStats.name;
  const pkgConfig = config[packageName];

  if (pkgConfig === false) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "configured to skip";
    return pkgStats;
  }

  if (packageJsonParseError !== undefined) {
    if (!fs.existsSync(distDir)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "dist/ not found";
      return pkgStats;
    }
    pkgStats.error = messageFrom(packageJsonParseError);
    return pkgStats;
  }

  if (!fs.existsSync(distDir)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "dist/ not found";
    return pkgStats;
  }

  try {
    const resolveSourcePath = buildSourcePathResolver(fs, packageDir);
    const exportOptions = {
      source: pkgConfig?.source ?? true,
      types: pkgConfig?.types ?? true,
      import: pkgConfig?.import ?? true,
      resolveSourcePath,
    };

    if (pkgConfig?.preserve) {
      const { supplementedSpecifiers } = await supplementExportsInPackageJson(
        fs,
        packageJsonPath,
        packageDir,
        exportOptions,
        write,
      );
      pkgStats.totalExports = supplementedSpecifiers.length;
    } else {
      const pathTransform = createPathTransform(pkgConfig?.strip);
      pkgStats.hasTransform = !!pathTransform;

      const cssConfig = pkgConfig?.css;
      if (cssConfig === false) {
        pkgStats.cssConfigStatus = "disabled";
      } else if (cssConfig !== undefined) {
        pkgStats.cssConfigStatus = "configured";
      }

      const extraExports = pkgConfig?.exports ?? {};

      const generatedExports = await generateExports(
        distFilesystem,
        distDir,
        pathTransform,
        cssConfig,
        extraExports,
        exportOptions,
      );

      const { prunedKeys } = await writePackageJsonExportsAtomic(
        fs,
        packageJsonPath,
        {
          generatedExports: generatedExports.exports,
          managedExportSpecifiers: Object.keys(generatedExports.exports),
          originalPathBySpecifier: generatedExports.originalPathBySpecifier,
        },
        write,
      );

      pkgStats.jsModules = generatedExports.jsCount;
      pkgStats.cssExports = generatedExports.cssCount;
      pkgStats.extraExports = Object.keys(extraExports).length;
      pkgStats.totalExports = Object.keys(generatedExports.exports).length;
      pkgStats.prunedExportKeys = prunedKeys;
    }
  } catch (caughtError: unknown) {
    pkgStats.error = messageFrom(caughtError);
  }

  return pkgStats;
}

import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem";
import { messageFrom } from "#/core/errors";
import type { MirrorConfig } from "#/config/schema";
import { createPathTransform, generateExports } from "#/mirror/domain/exports";
import { DIST_DIR, PACKAGE_JSON } from "#/mirror/domain/constants";
import type { MirrorPackageMeta, PackageJsonShape, PackageStats } from "#/mirror/domain/types";
import { resolvePackageDisplayName } from "#/mirror/domain/package-display-name";
import { writePackageJsonExportsAtomic } from "#/mirror/write-package-json-exports";
import { createMirrorDistFilesystem } from "#/mirror/dist-filesystem-impl";

export async function syncExportsForWorkspacePackage(
  fs: FilesystemPort,
  rootDir: string,
  packagePathStr: string,
  config: MirrorConfig,
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
    customExports: 0,
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
    if (
      rawPackageJson === null ||
      typeof rawPackageJson !== "object" ||
      Array.isArray(rawPackageJson)
    ) {
      throw new SyntaxError("package.json root must be a JSON object");
    }
    parsedPackageJson = rawPackageJson as PackageJsonShape;
    pkgStats.name = resolvePackageDisplayName(parsedPackageJson, folderBasename);
  } catch (caughtError: unknown) {
    pkgStats.name = folderBasename;
    packageJsonParseError = caughtError;
  }

  const packageMeta: MirrorPackageMeta = { packageName: pkgStats.name };

  if (isPackageSkipped(config.skipPackages, packageMeta)) {
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
    const pathTransform = createPathTransform(config, packageMeta);
    pkgStats.hasTransform = !!pathTransform;

    const cssConfig = resolvePackageScopedConfig(config.cssExports, packageMeta);
    if (cssConfig === false) {
      pkgStats.cssConfigStatus = "disabled";
    } else if (cssConfig !== undefined) {
      pkgStats.cssConfigStatus = "configured";
    }

    const customExports = resolvePackageScopedConfig(config.customExports, packageMeta) || {};

    const generatedExports = await generateExports(
      distFilesystem,
      distDir,
      pathTransform,
      cssConfig,
      customExports,
    );

    const { prunedKeys } = await writePackageJsonExportsAtomic(fs, packageJsonPath, {
      generatedExports: generatedExports.exports,
      managedExportSpecifiers: Object.keys(generatedExports.exports),
      originalPathBySpecifier: generatedExports.originalPathBySpecifier,
    });

    pkgStats.jsModules = generatedExports.jsCount;
    pkgStats.cssExports = generatedExports.cssCount;
    pkgStats.customExports = Object.keys(customExports).length;
    pkgStats.totalExports = Object.keys(generatedExports.exports).length;
    pkgStats.prunedExportKeys = prunedKeys;
  } catch (caughtError: unknown) {
    pkgStats.error = messageFrom(caughtError);
  }

  return pkgStats;
}

function resolvePackageScopedConfig<Value>(
  configMap: Record<string, Value> | undefined,
  packageMeta: MirrorPackageMeta,
): Value | undefined {
  if (!configMap) {
    return undefined;
  }
  return configMap[packageMeta.packageName];
}

function isPackageSkipped(
  skipPackagesList: string[] | undefined,
  packageMeta: MirrorPackageMeta,
): boolean {
  return !!skipPackagesList?.includes(packageMeta.packageName);
}

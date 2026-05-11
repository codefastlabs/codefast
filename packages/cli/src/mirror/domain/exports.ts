import * as nodePath from "node:path";
import type { DistFilesystem } from "#/mirror/domain/dist-filesystem";
import type { MirrorConfig } from "#/core/config/schema";
import {
  PACKAGE_JSON_EXPORT,
  VALID_DTS_EXTENSIONS,
  VALID_JS_EXTENSIONS,
} from "#/mirror/domain/constants";
import type {
  DistModule,
  ExportEntry,
  ExportOriginalPathBySpecifier,
  GenerateExportsResult,
  MirrorPackageMeta,
} from "#/mirror/domain/types";

function resolvePackageScopedConfig<T>(
  configMap: Record<string, T> | undefined,
  pkgMeta: MirrorPackageMeta,
): T | undefined {
  if (!configMap) {
    return undefined;
  }
  return configMap[pkgMeta.packageName];
}

function groupDistFilesByModule(relativeDistFiles: Array<string>): Map<string, DistModule> {
  const distModulesByPath = new Map<string, DistModule>();

  for (const relativeDistFile of relativeDistFiles) {
    let fileExt: string;
    let modulePath: string;

    const declarationExt = Array.from(VALID_DTS_EXTENSIONS).find((candidate) =>
      relativeDistFile.endsWith(candidate),
    );
    if (declarationExt) {
      fileExt = declarationExt;
      modulePath = relativeDistFile.slice(0, -declarationExt.length);
    } else {
      fileExt = nodePath.extname(relativeDistFile);
      if (!VALID_JS_EXTENSIONS.has(fileExt)) {
        continue;
      }
      modulePath = relativeDistFile.slice(0, -fileExt.length);
    }

    if (!nodePath.basename(modulePath)) {
      continue;
    }

    let distModule = distModulesByPath.get(modulePath);
    if (!distModule) {
      distModule = { path: modulePath, files: { js: null, mjs: null, cjs: null, dts: null } };
      distModulesByPath.set(modulePath, distModule);
    }

    if (fileExt === ".js") {
      distModule.files.js = relativeDistFile;
    } else if (fileExt === ".mjs") {
      distModule.files.mjs = relativeDistFile;
    } else if (fileExt === ".cjs") {
      distModule.files.cjs = relativeDistFile;
    } else if (VALID_DTS_EXTENSIONS.has(fileExt)) {
      distModule.files.dts = relativeDistFile;
    }
  }

  return distModulesByPath;
}

function toExportPath(distPath: string): string {
  if (distPath === "index") {
    return ".";
  }
  if (distPath.endsWith("/index")) {
    return `./${distPath.slice(0, -6)}`;
  }
  return `./${distPath}`;
}

function isBundlerChunkPath(distPath: string): boolean {
  return distPath.split("/").includes("chunks");
}

const EXPORT_GROUP_ORDER: Record<string, number> = {
  components: 100,
  hooks: 200,
  primitives: 300,
  core: 400,
  loaders: 500,
  utils: 600,
  adapters: 700,
  script: 750,
  css: 900,
};

type ExportSortGroup = [groupName: string, subpath: string, groupOrder: number, indexRank: number];
type ExportSortKey = [groupOrder: number, groupName: string, indexRank: number, subpath: string];

function getExportSortGroup(
  exportPath: string,
  pathTransform: ((pathString: string) => string) | null,
): ExportSortGroup {
  if (exportPath === ".") {
    return [".", "", 0, 0];
  }

  const specifierPath = exportPath.startsWith("./") ? exportPath.slice(2) : exportPath;

  if (specifierPath.endsWith("/*")) {
    const dirName = specifierPath.slice(0, -2);
    return [dirName, "", dirName === "css" ? 900 : 100, 0];
  }

  const parts = specifierPath.split("/");
  if (parts.length === 1) {
    const name = parts[0];
    if (name === undefined) {
      throw new Error("invariant: export path segment missing");
    }
    if (name in EXPORT_GROUP_ORDER) {
      return [name, "", EXPORT_GROUP_ORDER[name] ?? 0, 0];
    }
    if (pathTransform) {
      return ["components", name, 100, 1];
    }
    return ["", name, 800, 1];
  }

  const group = parts[0] ?? "";
  const subpath = parts.slice(1).join("/");
  return [group, subpath, EXPORT_GROUP_ORDER[group] ?? 700, 1];
}

/**
 * @since 0.3.16-canary.0
 */
export function createPathTransform(
  config: MirrorConfig | undefined,
  pkgMeta: MirrorPackageMeta,
): ((pathString: string) => string) | null {
  const pathConfig = resolvePackageScopedConfig(config?.pathTransformations, pkgMeta);
  if (!pathConfig) {
    return null;
  }
  const { removePrefix } = pathConfig;
  if (!removePrefix) {
    return null;
  }

  return (exportPath: string) => {
    if (!exportPath.startsWith(removePrefix)) {
      return exportPath;
    }
    const trimmedExportPath = exportPath.slice(removePrefix.length);
    if (trimmedExportPath && trimmedExportPath !== "." && !trimmedExportPath.startsWith("./")) {
      return `./${trimmedExportPath}`;
    }
    return trimmedExportPath;
  };
}

function getExportSortKey(
  exportPath: string,
  pathTransform: ((pathString: string) => string) | null,
): ExportSortKey {
  const [groupName, subpath, groupOrder, indexRank] = getExportSortGroup(exportPath, pathTransform);
  return [groupOrder, groupName, indexRank, subpath];
}

function compareExportSortKeys(left: ExportSortKey, right: ExportSortKey): number {
  if (left[0] !== right[0]) {
    return left[0] - right[0];
  }
  if (left[1] !== right[1]) {
    return left[1] < right[1] ? -1 : 1;
  }
  if (left[2] !== right[2]) {
    return left[2] - right[2];
  }
  if (left[3] !== right[3]) {
    return left[3] < right[3] ? -1 : 1;
  }
  return 0;
}

async function generateCssExports(
  fileSystemService: DistFilesystem,
  distDir: string,
  cssConfig: Record<string, unknown> | boolean | undefined,
): Promise<Record<string, string>> {
  if (cssConfig === false) {
    return {};
  }
  if (cssConfig === true) {
    cssConfig = { enabled: true };
  }
  if (!cssConfig || (cssConfig as Record<string, unknown>).enabled === false) {
    return {};
  }

  const relativeDistFiles = await fileSystemService.listRelativeFilesRecursively(distDir);
  const cssFiles = relativeDistFiles.filter((relativeDistPath) =>
    relativeDistPath.endsWith(".css"),
  );
  if (!cssFiles.length) {
    return {};
  }

  const cssExports: Record<string, string> = {
    ...((cssConfig as Record<string, unknown>).customExports as Record<string, string>),
  };
  const cssFilesByDir = new Map<string, Array<string>>();
  const rootCssFiles: Array<string> = [];

  for (const cssFile of cssFiles) {
    const dirName = nodePath.dirname(cssFile).split(nodePath.sep).join("/");
    if (dirName === ".") {
      rootCssFiles.push(cssFile);
    } else {
      const dirCssFiles = cssFilesByDir.get(dirName) || [];
      dirCssFiles.push(cssFile);
      cssFilesByDir.set(dirName, dirCssFiles);
    }
  }

  for (const cssFile of rootCssFiles) {
    const exportPath = `./${cssFile}`;
    if (!(exportPath in cssExports)) {
      cssExports[exportPath] = `./dist/${cssFile}`;
    }
  }

  for (const [dirName, dirCssFiles] of cssFilesByDir.entries()) {
    if (
      (await fileSystemService.isDirectoryCssOnly(distDir, dirName)) &&
      !(cssConfig as Record<string, unknown>).forceExportFiles
    ) {
      const wildcardExport = `./${dirName}/*`;
      if (!(wildcardExport in cssExports)) {
        cssExports[wildcardExport] = `./dist/${dirName}/*`;
      }
    } else {
      for (const cssFile of dirCssFiles) {
        const exportPath = `./${cssFile}`;
        if (!(exportPath in cssExports)) {
          cssExports[exportPath] = `./dist/${cssFile}`;
        }
      }
    }
  }

  return cssExports;
}

/**
 * Compute `package.json#exports` from a built `dist/` tree. No logging; no writes.
 *
 * @since 0.3.16-canary.0
 */
export async function generateExports(
  fileSystemService: DistFilesystem,
  distDir: string,
  pathTransform: ((pathString: string) => string) | null,
  cssConfig: Record<string, unknown> | boolean | undefined,
  customExports: Record<string, string>,
): Promise<GenerateExportsResult> {
  const relativeDistFiles = await fileSystemService.listRelativeFilesRecursively(distDir);
  if (!relativeDistFiles.length) {
    return {
      exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      originalPathBySpecifier: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      jsCount: 0,
      cssCount: 0,
    };
  }

  const distModulesByPath = groupDistFilesByModule(relativeDistFiles);
  const exportableModules = Array.from(distModulesByPath.values()).filter(
    (moduleEntry) =>
      (moduleEntry.files.js || moduleEntry.files.mjs) && !isBundlerChunkPath(moduleEntry.path),
  );

  if (!exportableModules.length) {
    return {
      exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      originalPathBySpecifier: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      jsCount: 0,
      cssCount: 0,
    };
  }

  const moduleExportsBySpecifier: Record<string, ExportEntry> = {};
  const originalPathBySpecifier: ExportOriginalPathBySpecifier = {};
  for (const distModuleEntry of exportableModules) {
    const originalExportPath = toExportPath(distModuleEntry.path);
    let exportPath = originalExportPath;
    if (pathTransform) {
      exportPath = pathTransform(exportPath);
    }

    const exportEntry: ExportEntry = {};
    const declarationFile = distModuleEntry.files.dts;
    if (declarationFile) {
      exportEntry.types = `./dist/${declarationFile}`;
    }
    if (distModuleEntry.files.mjs) {
      exportEntry.import = `./dist/${distModuleEntry.files.mjs}`;
    } else if (distModuleEntry.files.js) {
      exportEntry.import = `./dist/${distModuleEntry.files.js}`;
    }
    if (distModuleEntry.files.cjs) {
      exportEntry.require = `./dist/${distModuleEntry.files.cjs}`;
    }

    moduleExportsBySpecifier[exportPath] = exportEntry;
    originalPathBySpecifier[exportPath] = originalExportPath;
  }

  let sortedSpecifiers = Object.keys(moduleExportsBySpecifier).sort(
    (leftSpecifier, rightSpecifier) =>
      compareExportSortKeys(
        getExportSortKey(leftSpecifier, pathTransform),
        getExportSortKey(rightSpecifier, pathTransform),
      ),
  );
  const sortedExports: Record<string, ExportEntry | string> = {};
  for (const exportKey of sortedSpecifiers) {
    sortedExports[exportKey] = moduleExportsBySpecifier[exportKey] as ExportEntry;
  }

  const cssExports = await generateCssExports(
    fileSystemService,
    distDir,
    cssConfig ?? { enabled: true },
  );

  Object.assign(sortedExports, cssExports);
  for (const [specifier, mappedPath] of Object.entries(customExports || {})) {
    if (specifier !== PACKAGE_JSON_EXPORT) {
      sortedExports[specifier] = mappedPath;
    }
  }

  for (const cssSpecifier of Object.keys(cssExports)) {
    if (!(cssSpecifier in originalPathBySpecifier)) {
      originalPathBySpecifier[cssSpecifier] = cssSpecifier;
    }
  }
  for (const customSpecifier of Object.keys(customExports || {})) {
    if (customSpecifier !== PACKAGE_JSON_EXPORT && !(customSpecifier in originalPathBySpecifier)) {
      originalPathBySpecifier[customSpecifier] = customSpecifier;
    }
  }

  sortedSpecifiers = Object.keys(sortedExports)
    .filter((exportKey) => exportKey !== PACKAGE_JSON_EXPORT)
    .sort((leftSpecifier, rightSpecifier) =>
      compareExportSortKeys(
        getExportSortKey(leftSpecifier, pathTransform),
        getExportSortKey(rightSpecifier, pathTransform),
      ),
    );

  const finalExports: Record<string, ExportEntry | string> = {};
  for (const exportKey of sortedSpecifiers) {
    finalExports[exportKey] = sortedExports[exportKey] as ExportEntry | string;
  }
  finalExports[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT;
  originalPathBySpecifier[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT;

  return {
    exports: finalExports,
    originalPathBySpecifier,
    jsCount: Object.keys(moduleExportsBySpecifier).length,
    cssCount: Object.keys(cssExports).length,
  };
}

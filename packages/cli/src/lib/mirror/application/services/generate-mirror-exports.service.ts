import type { CliPath } from "#/lib/core/application/ports/path.port";
import type { FileSystemServicePort } from "#/lib/mirror/application/ports/file-system-service.port";
import type { MirrorConfig } from "#/lib/config/domain/schema.domain";
import {
  PACKAGE_JSON_EXPORT,
  VALID_DTS_EXTENSIONS,
  VALID_JS_EXTENSIONS,
} from "#/lib/mirror/domain/constants.domain";
import type {
  ExportEntry,
  ExportOriginalPathBySpecifier,
  GenerateExportsResult,
  MirrorPackageMeta,
  Module,
} from "#/lib/mirror/domain/types.domain";

function resolvePackageScopedConfig<T>(
  configMap: Record<string, T> | undefined,
  pkgMeta: MirrorPackageMeta,
): T | undefined {
  if (!configMap) {
    return undefined;
  }
  return configMap[pkgMeta.packageName];
}

function groupFilesByModule(files: string[], pathService: CliPath): Map<string, Module> {
  const modules = new Map<string, Module>();

  for (const file of files) {
    let ext: string;
    let modulePath: string;

    const dtsExt = Array.from(VALID_DTS_EXTENSIONS).find((candidate) => file.endsWith(candidate));
    if (dtsExt) {
      ext = dtsExt;
      modulePath = file.slice(0, -dtsExt.length);
    } else {
      ext = pathService.extname(file);
      if (!VALID_JS_EXTENSIONS.has(ext)) {
        continue;
      }
      modulePath = file.slice(0, -ext.length);
    }

    if (!pathService.basename(modulePath)) {
      continue;
    }

    let distModule = modules.get(modulePath);
    if (!distModule) {
      distModule = { path: modulePath, files: { js: null, mjs: null, cjs: null, dts: null } };
      modules.set(modulePath, distModule);
    }

    if (ext === ".js") {
      distModule.files.js = file;
    } else if (ext === ".mjs") {
      distModule.files.mjs = file;
    } else if (ext === ".cjs") {
      distModule.files.cjs = file;
    } else if (VALID_DTS_EXTENSIONS.has(ext)) {
      distModule.files.dts = file;
    }
  }

  return modules;
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

const GROUP_ORDER: Record<string, number> = {
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

function getExportGroup(
  exportPath: string,
  pathTransform: ((pathString: string) => string) | null,
): [string, string, number, number] {
  if (exportPath === ".") {
    return [".", "", 0, 0];
  }

  const cleanPath = exportPath.startsWith("./") ? exportPath.slice(2) : exportPath;

  if (cleanPath.endsWith("/*")) {
    const dirName = cleanPath.slice(0, -2);
    return [dirName, "", dirName === "css" ? 900 : 100, 0];
  }

  const parts = cleanPath.split("/");
  if (parts.length === 1) {
    const name = parts[0];
    if (name === undefined) {
      throw new Error("invariant: export path segment missing");
    }
    if (name in GROUP_ORDER) {
      return [name, "", GROUP_ORDER[name] ?? 0, 0];
    }
    if (pathTransform) {
      return ["components", name, 100, 1];
    }
    return ["", name, 800, 1];
  }

  const group = parts[0] ?? "";
  const subpath = parts.slice(1).join("/");
  return [group, subpath, GROUP_ORDER[group] ?? 700, 1];
}

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
    const result = exportPath.slice(removePrefix.length);
    if (result && result !== "." && !result.startsWith("./")) {
      return `./${result}`;
    }
    return result;
  };
}

type SortTuple = [number, string, number, string];

function getSortTuple(
  exportPath: string,
  pathTransform: ((pathString: string) => string) | null,
): SortTuple {
  const [group, subpath, order, isIndex] = getExportGroup(exportPath, pathTransform);
  return [order, group, isIndex, subpath];
}

function compareTuples(left: SortTuple, right: SortTuple): number {
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
  pathService: CliPath,
  fileSystemService: FileSystemServicePort,
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

  const files = await fileSystemService.listRelativeFilesRecursively(distDir);
  const cssFiles = files.filter((relativeDistPath) => relativeDistPath.endsWith(".css"));
  if (!cssFiles.length) {
    return {};
  }

  const cssExports: Record<string, string> = {
    ...((cssConfig as Record<string, unknown>).customExports as Record<string, string>),
  };
  const cssByDir = new Map<string, string[]>();
  const rootCss: string[] = [];

  for (const file of cssFiles) {
    const dirName = pathService.dirname(file).split(pathService.separator).join("/");
    if (dirName === ".") {
      rootCss.push(file);
    } else {
      const arr = cssByDir.get(dirName) || [];
      arr.push(file);
      cssByDir.set(dirName, arr);
    }
  }

  for (const file of rootCss) {
    const exportPath = `./${file}`;
    if (!(exportPath in cssExports)) {
      cssExports[exportPath] = `./dist/${file}`;
    }
  }

  for (const [dirName, dirFiles] of cssByDir.entries()) {
    if (
      (await fileSystemService.isDirectoryCssOnly(distDir, dirName)) &&
      !(cssConfig as Record<string, unknown>).forceExportFiles
    ) {
      const wildcardExport = `./${dirName}/*`;
      if (!(wildcardExport in cssExports)) {
        cssExports[wildcardExport] = `./dist/${dirName}/*`;
      }
    } else {
      for (const file of dirFiles) {
        const exportPath = `./${file}`;
        if (!(exportPath in cssExports)) {
          cssExports[exportPath] = `./dist/${file}`;
        }
      }
    }
  }

  return cssExports;
}

/**
 * Compute `package.json#exports` from a built `dist/` tree. No logging; no writes.
 */
export async function generateExports(
  pathService: CliPath,
  fileSystemService: FileSystemServicePort,
  distDir: string,
  pathTransform: ((pathString: string) => string) | null,
  cssConfig: Record<string, unknown> | boolean | undefined,
  customExports: Record<string, string>,
): Promise<GenerateExportsResult> {
  const files = await fileSystemService.listRelativeFilesRecursively(distDir);
  if (!files.length) {
    return {
      exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      originalPathBySpecifier: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      jsCount: 0,
      cssCount: 0,
    };
  }

  const modules = groupFilesByModule(files, pathService);
  const validModules = Array.from(modules.values()).filter(
    (moduleEntry) => (moduleEntry.files.js || moduleEntry.files.mjs) && moduleEntry.files.dts,
  );

  if (!validModules.length) {
    return {
      exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      originalPathBySpecifier: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      jsCount: 0,
      cssCount: 0,
    };
  }

  const exportsObj: Record<string, ExportEntry> = {};
  const originalPathBySpecifier: ExportOriginalPathBySpecifier = {};
  for (const distModuleEntry of validModules) {
    const originalExportPath = toExportPath(distModuleEntry.path);
    let exportPath = originalExportPath;
    if (pathTransform) {
      exportPath = pathTransform(exportPath);
    }

    const dtsFile = distModuleEntry.files.dts;
    if (dtsFile === undefined) {
      throw new Error(`mirror exports: missing .d.ts for ${distModuleEntry.path}`);
    }
    const entry: ExportEntry = { types: `./dist/${dtsFile}` };
    if (distModuleEntry.files.mjs) {
      entry.import = `./dist/${distModuleEntry.files.mjs}`;
    } else if (distModuleEntry.files.js) {
      entry.import = `./dist/${distModuleEntry.files.js}`;
    }
    if (distModuleEntry.files.cjs) {
      entry.require = `./dist/${distModuleEntry.files.cjs}`;
    }

    exportsObj[exportPath] = entry;
    originalPathBySpecifier[exportPath] = originalExportPath;
  }

  let sortedKeys = Object.keys(exportsObj).sort((pathA, pathB) =>
    compareTuples(getSortTuple(pathA, pathTransform), getSortTuple(pathB, pathTransform)),
  );
  const sortedExports: Record<string, ExportEntry | string> = {};
  for (const exportKey of sortedKeys) {
    sortedExports[exportKey] = exportsObj[exportKey] as ExportEntry;
  }

  const cssExports = await generateCssExports(
    pathService,
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

  sortedKeys = Object.keys(sortedExports)
    .filter((exportKey) => exportKey !== PACKAGE_JSON_EXPORT)
    .sort((pathA, pathB) =>
      compareTuples(getSortTuple(pathA, pathTransform), getSortTuple(pathB, pathTransform)),
    );

  const finalExports: Record<string, ExportEntry | string> = {};
  for (const exportKey of sortedKeys) {
    finalExports[exportKey] = sortedExports[exportKey] as ExportEntry | string;
  }
  finalExports[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT;
  originalPathBySpecifier[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT;

  return {
    exports: finalExports,
    originalPathBySpecifier,
    jsCount: Object.keys(exportsObj).length,
    cssCount: Object.keys(cssExports).length,
  };
}

import path from "node:path";
import type { CliFs } from "#lib/infra/fs-contract";
import { isDirentList } from "#lib/shared/utils";
import type { MirrorConfig } from "#lib/config/schema";
import { DTS_EXTENSION, PACKAGE_JSON_EXPORT, VALID_JS_EXTENSIONS } from "#lib/mirror/constants";
import type {
  ExportEntry,
  GenerateExportsResult,
  MirrorPackageMeta,
  Module,
} from "#lib/mirror/types";

function resolvePackageScopedConfig<T>(
  configMap: Record<string, T> | undefined,
  pkgMeta: MirrorPackageMeta,
): T | undefined {
  if (!configMap) return undefined;
  return configMap[pkgMeta.packageName];
}

export function normalizePath(relPath: string): string {
  return relPath.split(path.sep).join("/").replace(/\\/g, "/");
}

async function scanDirectoryFiles(
  fs: CliFs,
  dir: string,
  baseDir: string = dir,
): Promise<string[]> {
  try {
    const raw = await fs.readdir(dir, { recursive: true, withFileTypes: true });
    if (!isDirentList(raw)) return [];
    return raw
      .filter((dirent) => dirent.isFile())
      .map((dirent) => {
        const fullPath = path.join(dirent.parentPath, dirent.name);
        const relPath = path.relative(baseDir, fullPath);
        return normalizePath(relPath);
      });
  } catch (caughtError: unknown) {
    if (caughtError && typeof caughtError === "object" && "code" in caughtError) {
      if (caughtError.code === "ENOENT" || caughtError.code === "EACCES") return [];
    }
    throw caughtError;
  }
}

async function isDirectoryCssOnly(fs: CliFs, distDir: string, dirPath: string): Promise<boolean> {
  try {
    const raw = await fs.readdir(path.join(distDir, dirPath), { withFileTypes: true });
    if (!isDirentList(raw)) return false;
    if (raw.length === 0) return true;
    return raw.every((dirent) => dirent.isFile() && dirent.name.endsWith(".css"));
  } catch {
    return false;
  }
}

function groupFilesByModule(files: string[]): Map<string, Module> {
  const modules = new Map<string, Module>();

  for (const file of files) {
    let ext: string;
    let modulePath: string;

    if (file.endsWith(DTS_EXTENSION)) {
      ext = DTS_EXTENSION;
      modulePath = file.slice(0, -DTS_EXTENSION.length);
    } else {
      ext = path.extname(file);
      if (!VALID_JS_EXTENSIONS.has(ext)) continue;
      modulePath = file.slice(0, -ext.length);
    }

    if (!path.basename(modulePath)) continue;

    let distModule = modules.get(modulePath);
    if (!distModule) {
      distModule = { path: modulePath, files: { js: null, cjs: null, dts: null } };
      modules.set(modulePath, distModule);
    }

    if (ext === ".js") distModule.files.js = file;
    else if (ext === ".cjs") distModule.files.cjs = file;
    else if (ext === DTS_EXTENSION) distModule.files.dts = file;
  }

  return modules;
}

function toExportPath(distPath: string): string {
  if (distPath === "index") return ".";
  if (distPath.endsWith("/index")) return `./${distPath.slice(0, -6)}`;
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
  if (exportPath === ".") return [".", "", 0, 0];

  const cleanPath = exportPath.startsWith("./") ? exportPath.slice(2) : exportPath;

  if (cleanPath.endsWith("/*")) {
    const dirName = cleanPath.slice(0, -2);
    return [dirName, "", dirName === "css" ? 900 : 100, 0];
  }

  const parts = cleanPath.split("/");
  if (parts.length === 1) {
    const name = parts[0];
    if (name in GROUP_ORDER) return [name, "", GROUP_ORDER[name] ?? 0, 0];
    if (pathTransform) return ["components", name, 100, 1];
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
  if (!pathConfig) return null;
  const { removePrefix } = pathConfig;
  if (!removePrefix) return null;

  return (exportPath: string) => {
    if (!exportPath.startsWith(removePrefix)) return exportPath;
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
  if (left[0] !== right[0]) return left[0] - right[0];
  if (left[1] !== right[1]) return left[1] < right[1] ? -1 : 1;
  if (left[2] !== right[2]) return left[2] - right[2];
  if (left[3] !== right[3]) return left[3] < right[3] ? -1 : 1;
  return 0;
}

async function generateCssExports(
  fs: CliFs,
  distDir: string,
  cssConfig: Record<string, unknown> | boolean | undefined,
): Promise<Record<string, string>> {
  if (cssConfig === false) return {};
  if (cssConfig === true) cssConfig = { enabled: true };
  if (!cssConfig || (cssConfig as Record<string, unknown>).enabled === false) return {};

  const files = await scanDirectoryFiles(fs, distDir);
  const cssFiles = files.filter((relativeDistPath) => relativeDistPath.endsWith(".css"));
  if (!cssFiles.length) return {};

  const cssExports: Record<string, string> = {
    ...((cssConfig as Record<string, unknown>).customExports as Record<string, string>),
  };
  const cssByDir = new Map<string, string[]>();
  const rootCss: string[] = [];

  for (const file of cssFiles) {
    const dirName = normalizePath(path.dirname(file));
    if (dirName === ".") rootCss.push(file);
    else {
      const arr = cssByDir.get(dirName) || [];
      arr.push(file);
      cssByDir.set(dirName, arr);
    }
  }

  for (const file of rootCss) {
    const exportPath = `./${file}`;
    if (!(exportPath in cssExports)) cssExports[exportPath] = `./dist/${file}`;
  }

  for (const [dirName, dirFiles] of cssByDir.entries()) {
    if (
      (await isDirectoryCssOnly(fs, distDir, dirName)) &&
      !(cssConfig as Record<string, unknown>).forceExportFiles
    ) {
      const wildcardExport = `./${dirName}/*`;
      if (!(wildcardExport in cssExports)) {
        cssExports[wildcardExport] = `./dist/${dirName}/*`;
      }
    } else {
      for (const file of dirFiles) {
        const exportPath = `./${file}`;
        if (!(exportPath in cssExports)) cssExports[exportPath] = `./dist/${file}`;
      }
    }
  }

  return cssExports;
}

/**
 * Compute `package.json#exports` from a built `dist/` tree. No logging; no writes.
 */
export async function generateExports(
  fs: CliFs,
  distDir: string,
  pathTransform: ((pathString: string) => string) | null,
  cssConfig: Record<string, unknown> | boolean | undefined,
  customExports: Record<string, string>,
): Promise<GenerateExportsResult> {
  const files = await scanDirectoryFiles(fs, distDir);
  if (!files.length)
    return {
      // Keep "./package.json" self-mapped as the standard Node.js exports fallback for package metadata.
      exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      jsCount: 0,
      cssCount: 0,
    };

  const modules = groupFilesByModule(files);
  const validModules = Array.from(modules.values()).filter((mod) => mod.files.js && mod.files.dts);

  if (!validModules.length)
    return {
      // Keep "./package.json" self-mapped as the standard Node.js exports fallback for package metadata.
      exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT },
      jsCount: 0,
      cssCount: 0,
    };

  const exportsObj: Record<string, ExportEntry> = {};
  for (const distModuleEntry of validModules) {
    let exportPath = toExportPath(distModuleEntry.path);
    if (pathTransform) exportPath = pathTransform(exportPath);

    const distPath = `./dist/${distModuleEntry.path}`;
    const entry: ExportEntry = { types: `${distPath}.d.ts` };
    if (distModuleEntry.files.js) entry.import = `${distPath}.js`;
    if (distModuleEntry.files.cjs) entry.require = `${distPath}.cjs`;

    exportsObj[exportPath] = entry;
  }

  let sortedKeys = Object.keys(exportsObj).sort((pathA, pathB) =>
    compareTuples(getSortTuple(pathA, pathTransform), getSortTuple(pathB, pathTransform)),
  );
  const sortedExports: Record<string, ExportEntry | string> = {};
  for (const exportKey of sortedKeys)
    sortedExports[exportKey] = exportsObj[exportKey] as ExportEntry;

  const cssExports = await generateCssExports(fs, distDir, cssConfig ?? { enabled: true });

  Object.assign(sortedExports, cssExports);
  for (const [specifier, mappedPath] of Object.entries(customExports || {})) {
    if (specifier !== PACKAGE_JSON_EXPORT) sortedExports[specifier] = mappedPath;
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

  return {
    exports: finalExports,
    jsCount: Object.keys(exportsObj).length,
    cssCount: Object.keys(cssExports).length,
  };
}

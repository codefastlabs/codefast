import path from "node:path";
import type { CliFs } from "#lib/infra/fs-contract";
import { isDirentList } from "#lib/shared/utils";
import { DTS_EXTENSION, PACKAGE_JSON_EXPORT, VALID_JS_EXTENSIONS } from "#lib/mirror/constants";
import type { ExportEntry, GenerateExportsResult, MirrorConfig, Module } from "#lib/mirror/types";

export function normalizePath(p: string): string {
  return p.split(path.sep).join("/").replace(/\\/g, "/");
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
      .filter((f) => f.isFile())
      .map((f) => {
        const fullPath = path.join(f.parentPath, f.name);
        const relPath = path.relative(baseDir, fullPath);
        return normalizePath(relPath);
      });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      if (err.code === "ENOENT" || err.code === "EACCES") return [];
    }
    throw err;
  }
}

async function isDirectoryCssOnly(fs: CliFs, distDir: string, dirPath: string): Promise<boolean> {
  try {
    const raw = await fs.readdir(path.join(distDir, dirPath), { withFileTypes: true });
    if (!isDirentList(raw)) return false;
    if (raw.length === 0) return true;
    return raw.every((f) => f.isFile() && f.name.endsWith(".css"));
  } catch {
    return false;
  }
}

export function groupFilesByModule(files: string[]): Map<string, Module> {
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

    let mod = modules.get(modulePath);
    if (!mod) {
      mod = { path: modulePath, files: { js: null, cjs: null, dts: null } };
      modules.set(modulePath, mod);
    }

    if (ext === ".js") mod.files.js = file;
    else if (ext === ".cjs") mod.files.cjs = file;
    else if (ext === DTS_EXTENSION) mod.files.dts = file;
  }

  return modules;
}

export function toExportPath(distPath: string): string {
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

export function getExportGroup(
  p: string,
  pathTransform: ((s: string) => string) | null,
): [string, string, number, number] {
  if (p === ".") return [".", "", 0, 0];

  const cleanPath = p.startsWith("./") ? p.slice(2) : p;

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
  packagePath: string,
): ((p: string) => string) | null {
  if (!config?.pathTransformations?.[packagePath]) return null;
  const { removePrefix } = config.pathTransformations[packagePath];
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

function getSortTuple(p: string, pathTransform: ((s: string) => string) | null): SortTuple {
  const [group, subpath, order, isIndex] = getExportGroup(p, pathTransform);
  return [order, group, isIndex, subpath];
}

function compareTuples(a: SortTuple, b: SortTuple): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
  if (a[2] !== b[2]) return a[2] - b[2];
  if (a[3] !== b[3]) return a[3] < b[3] ? -1 : 1;
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
  const cssFiles = files.filter((f) => f.endsWith(".css"));
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
  pathTransform: ((s: string) => string) | null,
  cssConfig: Record<string, unknown> | boolean | undefined,
  customExports: Record<string, string>,
): Promise<GenerateExportsResult> {
  const files = await scanDirectoryFiles(fs, distDir);
  if (!files.length)
    return { exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT }, jsCount: 0, cssCount: 0 };

  const modules = groupFilesByModule(files);
  const validModules = Array.from(modules.values()).filter((m) => m.files.js && m.files.dts);

  if (!validModules.length)
    return { exports: { [PACKAGE_JSON_EXPORT]: PACKAGE_JSON_EXPORT }, jsCount: 0, cssCount: 0 };

  const exportsObj: Record<string, ExportEntry> = {};
  for (const mod of validModules) {
    let exportPath = toExportPath(mod.path);
    if (pathTransform) exportPath = pathTransform(exportPath);

    const distPath = `./dist/${mod.path}`;
    const entry: ExportEntry = { types: `${distPath}.d.ts` };
    if (mod.files.js) entry.import = `${distPath}.js`;
    if (mod.files.cjs) entry.require = `${distPath}.cjs`;

    exportsObj[exportPath] = entry;
  }

  let sortedKeys = Object.keys(exportsObj).sort((a, b) =>
    compareTuples(getSortTuple(a, pathTransform), getSortTuple(b, pathTransform)),
  );
  const sortedExports: Record<string, ExportEntry | string> = {};
  for (const k of sortedKeys) sortedExports[k] = exportsObj[k] as ExportEntry;

  const cssExports = await generateCssExports(fs, distDir, cssConfig ?? { enabled: true });

  Object.assign(sortedExports, cssExports);
  for (const [k, v] of Object.entries(customExports || {})) {
    if (k !== PACKAGE_JSON_EXPORT) sortedExports[k] = v;
  }

  sortedKeys = Object.keys(sortedExports)
    .filter((k) => k !== PACKAGE_JSON_EXPORT)
    .sort((a, b) => compareTuples(getSortTuple(a, pathTransform), getSortTuple(b, pathTransform)));

  const finalExports: Record<string, ExportEntry | string> = {};
  for (const k of sortedKeys) finalExports[k] = sortedExports[k] as ExportEntry | string;
  finalExports[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT;

  return {
    exports: finalExports,
    jsCount: Object.keys(exportsObj).length,
    cssCount: Object.keys(cssExports).length,
  };
}

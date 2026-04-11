/**
 * Mirror — sync `package.json` `exports` from each package’s built `dist/` tree.
 *
 * Usage:
 *   pnpm cli:mirror-sync                    # Process all packages (repo root)
 *   pnpm exec codefast mirror sync        # Same via binary
 *   pnpm exec codefast mirror sync [path] # Single package path
 *
 * Config: `codefast.config.js` (or `.mjs` / `.cjs` / `.json`) with a `mirror` section;
 * legacy `generate-exports.config.js` / `.json` is still read if present.
 *
 * ## Algorithm Overview
 *
 * 1. Scan Dist Directory: Recursively reads the dist/ directory structure and filters files
 *    with valid extensions (.js, .cjs, .d.ts), excluding non-entry point files.
 * 2. Group Files by Module: Groups files by their base name (without extension). Each module
 *    should have three files: .js, .cjs, and .d.ts.
 * 3. Create Export Paths: Converts file paths to export paths by removing the "dist/" prefix.
 * 4. Validate Modules: Only creates exports for modules that have at least .js and .d.ts files.
 * 5. Generate Exports Object: Creates structural exports matching package structure.
 *    "./package.json" is always included.
 * 6. Update package.json: Reads current package.json, overrides exports block preserving
 *    other fields, and writes the file back.
 */

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

function err(line: string): void {
  process.stderr.write(`${line}\n`);
}

// ── Colors ───────────────────────────────────────────────────────────────────

const Colors = {
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  GRAY: "\x1b[90m",
  BRIGHT_GREEN: "\x1b[92m",
  BRIGHT_YELLOW: "\x1b[93m",
  BRIGHT_CYAN: "\x1b[96m",
  disable() {
    for (const key of Object.keys(this)) {
      if (typeof this[key as keyof typeof Colors] === "string") {
        (this as Record<string, unknown>)[key] = "";
      }
    }
  },
};

function configureColors(noColor: boolean): void {
  if (!process.stdout.isTTY || noColor) {
    Colors.disable();
  }
}

function logSkippedWorkspacePackage(
  index: number,
  total: number,
  displayName: string,
  reason: string,
): void {
  const progress = `${Colors.DIM}[${index}/${total}]${Colors.RESET}`;
  out(`${progress} ${Colors.GRAY}○${Colors.RESET} ${Colors.DIM}${displayName}${Colors.RESET}`);
  out(`  ${Colors.DIM}└─${Colors.RESET} ${Colors.GRAY}Skipped: ${reason}${Colors.RESET}`);
  out("");
}

/** Shared rule: show `package.json#name` when it is a non-empty string; else folder basename. */
function resolvePackageDisplayName(
  packageJson: { name?: unknown },
  folderBasename: string,
): string {
  const n = packageJson.name;
  return typeof n === "string" && n.length > 0 ? n : folderBasename;
}

async function readPackageJsonDisplayName(
  packageJsonPath: string,
  folderBasename: string,
): Promise<string> {
  if (!existsSync(packageJsonPath)) return folderBasename;
  try {
    const raw = await fs.readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(raw) as { name?: unknown };
    return resolvePackageDisplayName(parsed, folderBasename);
  } catch {
    return folderBasename;
  }
}

// ── Constants & Utilities ────────────────────────────────────────────────────

const DIST_DIR = "dist";
const PACKAGE_JSON = "package.json";

const CODEFAST_CONFIG_JS = [
  "codefast.config.js",
  "codefast.config.mjs",
  "codefast.config.cjs",
] as const;
const CODEFAST_CONFIG_JSON = "codefast.config.json";
const LEGACY_CONFIG_JS = "generate-exports.config.js";
const LEGACY_CONFIG_JSON = "generate-exports.config.json";

const VALID_JS_EXTENSIONS = new Set([".js", ".cjs"]);
const DTS_EXTENSION = ".d.ts";
const PACKAGE_JSON_EXPORT = "./package.json";

export function normalizePath(p: string): string {
  return p.split(path.sep).join("/").replace(/\\/g, "/");
}

// ── Type Definitions ─────────────────────────────────────────────────────────

interface ModuleFiles {
  js: string | null;
  cjs: string | null;
  dts: string | null;
}

interface Module {
  path: string;
  files: ModuleFiles;
}

interface PackageStats {
  name: string;
  path: string;
  jsModules: number;
  cssExports: number;
  customExports: number;
  totalExports: number;
  hasTransform: boolean;
  cssConfigStatus: "disabled" | "configured" | "";
  skipped: boolean;
  skipReason: string;
  error: string | null;
}

interface GlobalStats {
  packagesFound: number;
  packagesProcessed: number;
  packagesSkipped: number;
  packagesErrored: number;
  totalExports: number;
  totalJsModules: number;
  totalCssExports: number;
  packageDetails: PackageStats[];
}

interface Config {
  skipPackages?: string[];
  pathTransformations?: Record<string, { removePrefix?: string }>;
  customExports?: Record<string, Record<string, string>>;
  cssExports?: Record<
    string,
    | boolean
    | { enabled?: boolean; customExports?: Record<string, string>; forceExportFiles?: boolean }
  >;
}

// ── Configuration ────────────────────────────────────────────────────────────

function configImportUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

function normalizeLoadedConfig(raw: unknown): Config {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  if ("mirror" in o && o.mirror && typeof o.mirror === "object" && !Array.isArray(o.mirror)) {
    return o.mirror as Config;
  }
  return raw as Config;
}

async function loadConfig(rootDir: string): Promise<Config> {
  for (const name of CODEFAST_CONFIG_JS) {
    const filePath = path.join(rootDir, name);
    if (!existsSync(filePath)) continue;
    try {
      const mod = await import(configImportUrl(filePath));
      return normalizeLoadedConfig(mod.default ?? mod);
    } catch {
      out(`${Colors.YELLOW}⚠ Could not load ${name}. Trying other config files…${Colors.RESET}`);
    }
  }

  const codefastJson = path.join(rootDir, CODEFAST_CONFIG_JSON);
  if (existsSync(codefastJson)) {
    try {
      const content = await fs.readFile(codefastJson, "utf-8");
      return normalizeLoadedConfig(JSON.parse(content));
    } catch (error) {
      out(
        `${Colors.YELLOW}⚠ Could not parse ${CODEFAST_CONFIG_JSON}: ${String(error)}${Colors.RESET}`,
      );
    }
  }

  const legacyJs = path.join(rootDir, LEGACY_CONFIG_JS);
  if (existsSync(legacyJs)) {
    try {
      const mod = await import(configImportUrl(legacyJs));
      return normalizeLoadedConfig(mod.default ?? mod);
    } catch {
      out(
        `${Colors.YELLOW}⚠ Could not load ${LEGACY_CONFIG_JS}. Falling back to .json${Colors.RESET}`,
      );
    }
  }

  const legacyJson = path.join(rootDir, LEGACY_CONFIG_JSON);
  if (existsSync(legacyJson)) {
    try {
      const content = await fs.readFile(legacyJson, "utf-8");
      return normalizeLoadedConfig(JSON.parse(content));
    } catch (error) {
      out(
        `${Colors.YELLOW}⚠ Could not parse ${LEGACY_CONFIG_JSON}: ${String(error)}${Colors.RESET}`,
      );
    }
  }

  return {};
}

export function createPathTransform(
  config: Config | undefined,
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

// ── File Scanning ────────────────────────────────────────────────────────────

async function scanDirectoryFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  try {
    const files = await fs.readdir(dir, { recursive: true, withFileTypes: true });
    return files
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

async function isDirectoryCssOnly(distDir: string, dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readdir(path.join(distDir, dirPath), { withFileTypes: true });
    if (files.length === 0) return true;
    return files.every((f) => f.isFile() && f.name.endsWith(".css"));
  } catch {
    return false;
  }
}

// ── Export Generation Logic ──────────────────────────────────────────────────

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

async function generateCssExports(
  distDir: string,
  cssConfig: Record<string, unknown> | boolean | undefined,
): Promise<Record<string, string>> {
  if (cssConfig === false) return {};
  if (cssConfig === true) cssConfig = { enabled: true };
  if (!cssConfig || (cssConfig as Record<string, unknown>).enabled === false) return {};

  const files = await scanDirectoryFiles(distDir);
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
      (await isDirectoryCssOnly(distDir, dirName)) &&
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

// ── Main Package Controller ──────────────────────────────────────────────────

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

interface ExportEntry {
  types: string;
  import?: string;
  require?: string;
}

async function generateExports(
  distDir: string,
  pathTransform: ((s: string) => string) | null,
  cssConfig: Record<string, unknown> | boolean | undefined,
  customExports: Record<string, string>,
) {
  const files = await scanDirectoryFiles(distDir);
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

  // Sorting
  let sortedKeys = Object.keys(exportsObj).sort((a, b) =>
    compareTuples(getSortTuple(a, pathTransform), getSortTuple(b, pathTransform)),
  );
  const sortedExports: Record<string, ExportEntry | string> = {};
  for (const k of sortedKeys) sortedExports[k] = exportsObj[k] as ExportEntry;

  const cssExports = await generateCssExports(distDir, cssConfig ?? { enabled: true });

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

async function processPackage(
  rootDir: string,
  packagePathStr: string,
  index: number,
  total: number,
  config: Config,
  args: Record<string, unknown>,
  stats: GlobalStats,
) {
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
    pkgStats.name = await readPackageJsonDisplayName(packageJsonPath, pkgName);
    logSkippedWorkspacePackage(index, total, pkgStats.name, pkgStats.skipReason);
    return pkgStats;
  }

  if (!existsSync(packageJsonPath)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "package.json not found";
    stats.packagesSkipped++;
    logSkippedWorkspacePackage(index, total, pkgName, pkgStats.skipReason);
    return pkgStats;
  }

  if (!existsSync(distDir)) {
    pkgStats.skipped = true;
    pkgStats.skipReason = "dist/ not found";
    stats.packagesSkipped++;
    pkgStats.name = await readPackageJsonDisplayName(packageJsonPath, pkgName);
    logSkippedWorkspacePackage(index, total, pkgStats.name, pkgStats.skipReason);
    return pkgStats;
  }

  try {
    const pkgContent = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(pkgContent);
    pkgStats.name = resolvePackageDisplayName(packageJson, pkgName);

    const pathTransform = createPathTransform(config, relativePath);
    pkgStats.hasTransform = !!pathTransform;

    const cssConfig = config.cssExports?.[relativePath];
    if (cssConfig === false) pkgStats.cssConfigStatus = "disabled";
    else if (cssConfig !== undefined) pkgStats.cssConfigStatus = "configured";

    const customExports = config.customExports?.[relativePath] || {};

    const res = await generateExports(distDir, pathTransform, cssConfig, customExports);
    pkgStats.jsModules = res.jsCount;
    pkgStats.cssExports = res.cssCount;
    pkgStats.customExports = Object.keys(customExports).length;
    pkgStats.totalExports = Object.keys(res.exports).length;

    packageJson.exports = res.exports;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

    stats.packagesProcessed++;
    stats.totalExports += pkgStats.totalExports;
    stats.totalJsModules += pkgStats.jsModules;
    stats.totalCssExports += pkgStats.cssExports;

    const progress = `${Colors.DIM}[${index}/${total}]${Colors.RESET}`;
    out(
      `${progress} ${Colors.BRIGHT_GREEN}✓${Colors.RESET} ${Colors.BOLD}${pkgStats.name}${Colors.RESET}`,
    );

    if (args.verbose) {
      out(`  ${Colors.DIM}├─${Colors.RESET} Path: ${packageDir}`);
      if (pkgStats.hasTransform)
        out(
          `  ${Colors.DIM}├─${Colors.RESET} ${Colors.CYAN}Custom path transformation${Colors.RESET}`,
        );
      if (pkgStats.cssConfigStatus)
        out(
          `  ${Colors.DIM}├─${Colors.RESET} ${Colors.CYAN}${pkgStats.cssConfigStatus === "disabled" ? "CSS disabled" : "CSS configured"}${Colors.RESET}`,
        );
    }

    const breakdown: string[] = [];
    if (res.jsCount > 0) breakdown.push(`${Colors.GREEN}${res.jsCount} modules${Colors.RESET}`);
    if (res.cssCount > 0) breakdown.push(`${Colors.MAGENTA}${res.cssCount} CSS${Colors.RESET}`);
    if (pkgStats.customExports > 0)
      breakdown.push(`${Colors.YELLOW}${pkgStats.customExports} custom${Colors.RESET}`);

    if (breakdown.length > 0) {
      out(
        `  ${Colors.DIM}└─${Colors.RESET} ${breakdown.join(" + ")} = ${Colors.BRIGHT_CYAN}${pkgStats.totalExports} exports${Colors.RESET}`,
      );
    } else {
      out(
        `  ${Colors.DIM}└─${Colors.RESET} ${Colors.BRIGHT_CYAN}${pkgStats.totalExports} exports${Colors.RESET}`,
      );
    }
    out(""); // blank line
  } catch (e: unknown) {
    pkgStats.error = String(e);
    stats.packagesErrored++;
    out(
      `${Colors.DIM}[${index}/${total}]${Colors.RESET} ${Colors.YELLOW}✗${Colors.RESET} ${Colors.BOLD}${pkgName}${Colors.RESET}`,
    );
    out(`  ${Colors.DIM}└─${Colors.RESET} ${Colors.YELLOW}Error: ${String(e)}${Colors.RESET}\n`);
    if (args.verbose) err(e instanceof Error && e.stack ? e.stack : String(e));
  }
  return pkgStats;
}

async function findPackages(rootDir: string): Promise<string[]> {
  const packagesDir = path.join(rootDir, "packages");
  try {
    const files = await fs.readdir(packagesDir, { withFileTypes: true });
    return files
      .filter((f) => f.isDirectory())
      .map((f) => normalizePath(path.relative(rootDir, path.join(packagesDir, f.name))));
  } catch {
    return [];
  }
}

export interface RunMirrorSyncOptions {
  rootDir: string;
  verbose?: boolean;
  noColor?: boolean;
  /** Relative to `rootDir`, e.g. `packages/ui` */
  packageFilter?: string;
}

/** @returns Process exit code (0 or 1). */
export async function runMirrorSync(opts: RunMirrorSyncOptions): Promise<number> {
  configureColors(!!opts.noColor);

  out(`\n${Colors.BOLD}${Colors.CYAN}📦 Mirror — package exports${Colors.RESET}`);
  out(`${Colors.DIM}${"═".repeat(60)}${Colors.RESET}\n`);

  const startTime = performance.now();
  const values = { verbose: !!opts.verbose, "no-color": !!opts.noColor };

  try {
    const config = await loadConfig(opts.rootDir);
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
      out(`${Colors.DIM}Processing single package...${Colors.RESET}\n`);
    } else {
      targetPackages = await findPackages(opts.rootDir);
      out(`${Colors.DIM}Discovering packages under packages/...${Colors.RESET}\n`);
    }

    stats.packagesFound = targetPackages.length;
    if (targetPackages.length === 0) {
      out(`${Colors.YELLOW}⚠ No packages found${Colors.RESET}`);
      return 0;
    }

    let i = 1;
    for (const pkgPath of targetPackages) {
      const pkgStats = await processPackage(
        opts.rootDir,
        pkgPath,
        i++,
        targetPackages.length,
        config,
        values,
        stats,
      );
      stats.packageDetails.push(pkgStats);
    }

    const elapsed = (performance.now() - startTime) / 1000;
    out(`${Colors.DIM}${"═".repeat(60)}${Colors.RESET}`);
    out(
      `${Colors.BOLD}📊 Summary${Colors.RESET} ${Colors.DIM}(completed in ${elapsed.toFixed(2)}s)${Colors.RESET}\n`,
    );

    out(`  ${Colors.BOLD}Packages:${Colors.RESET}`);
    out(
      `  ${Colors.DIM}├─${Colors.RESET} Processed: ${Colors.GREEN}${stats.packagesProcessed}${Colors.RESET}`,
    );
    if (stats.packagesSkipped > 0)
      out(
        `  ${Colors.DIM}├─${Colors.RESET} Skipped: ${Colors.GRAY}${stats.packagesSkipped}${Colors.RESET}`,
      );
    if (stats.packagesErrored > 0)
      out(
        `  ${Colors.DIM}├─${Colors.RESET} Errors: ${Colors.YELLOW}${stats.packagesErrored}${Colors.RESET}`,
      );
    out(`  ${Colors.DIM}└─${Colors.RESET} Total found: ${stats.packagesFound}\n`);

    out(`  ${Colors.BOLD}Exports:${Colors.RESET}`);
    out(
      `  ${Colors.DIM}├─${Colors.RESET} JS Modules: ${Colors.CYAN}${stats.totalJsModules}${Colors.RESET}`,
    );
    out(
      `  ${Colors.DIM}├─${Colors.RESET} CSS Files: ${Colors.MAGENTA}${stats.totalCssExports}${Colors.RESET}`,
    );
    out(
      `  ${Colors.DIM}└─${Colors.RESET} Total: ${Colors.BRIGHT_CYAN}${stats.totalExports}${Colors.RESET}\n`,
    );

    out(`${Colors.DIM}${"═".repeat(60)}${Colors.RESET}\n`);

    return stats.packagesErrored > 0 ? 1 : 0;
  } catch (e: unknown) {
    out(`${Colors.YELLOW}Fatal error: ${String(e)}${Colors.RESET}`);
    err(e instanceof Error && e.stack ? e.stack : String(e));
    return 1;
  }
}

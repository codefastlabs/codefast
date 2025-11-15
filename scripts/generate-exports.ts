#!/usr/bin/env tsx

/**
 * Thuật toán tự động generate exports trong package.json từ thư mục dist
 *
 * Usage:
 *   tsx scripts/generate-exports.ts [package-path]
 *
 * Examples:
 *   tsx scripts/generate-exports.ts packages/image-loader
 *   tsx scripts/generate-exports.ts packages/ui
 *   tsx scripts/generate-exports.ts  (uses current directory)
 *
 * ALGORITHM:
 * ==========
 *
 * 1. SCAN THỨ MỤC DIST
 *    - Đọc cấu trúc thư mục dist/ (recursively)
 *    - Lọc các file có extension: .js, .cjs, .d.ts
 *    - Bỏ qua các file không phải là entry points
 *
 * 2. PHÂN LOẠI FILES
 *    - Nhóm files theo base name (bỏ extension)
 *    - Mỗi module cần có 3 files: .js, .cjs, .d.ts
 *    - Ví dụ: index.js, index.cjs, index.d.ts → module "index"
 *
 * 3. TẠO EXPORT PATHS
 *    - Root entry (index): "." → "./dist/index.*"
 *    - Subpath entries: "./{relative-path}" → "./dist/{relative-path}.*"
 *    - Loại bỏ "dist/" prefix trong export path
 *    - Convert file path thành export path:
 *      * dist/index.* → "."
 *      * dist/loaders/cloudinary.* → "./loaders/cloudinary"
 *      * dist/core/types.* → "./core/types"
 *
 * 4. VALIDATE MODULES
 *    - Chỉ tạo export nếu module có đủ 3 files (.js, .cjs, .d.ts)
 *    - Hoặc ít nhất có .js và .d.ts (cho ESM-only)
 *    - Bỏ qua các file không đủ điều kiện
 *
 * 5. GENERATE EXPORTS OBJECT
 *    - Tạo object với structure:
 *      {
 *        "{export-path}": {
 *          "types": "./dist/{path}.d.ts",
 *          "import": "./dist/{path}.js",
 *          "require": "./dist/{path}.cjs"
 *        }
 *      }
 *    - Sắp xếp exports theo thứ tự alphabet
 *    - Luôn thêm "./package.json" export
 *
 * 6. UPDATE PACKAGE.JSON
 *    - Đọc package.json hiện tại
 *    - Merge exports mới vào (giữ nguyên các fields khác)
 *    - Write lại file với formatting đẹp
 */

import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join, relative, dirname, basename, extname, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = "dist";
const PACKAGE_JSON = "package.json";
const CONFIG_FILE_JS = "generate-exports.config.js";
const CONFIG_FILE_JSON = "generate-exports.config.json";

/**
 * CSS export configuration
 */
interface CSSExportConfig {
  /** Enable automatic CSS exports (default: true - auto-detect) */
  enabled?: boolean;
  /** Force export individual files even if directory only contains CSS (default: false - auto-detect) */
  forceExportFiles?: boolean;
  /** Custom export mappings: { exportPath: distPath } */
  customExports?: Record<string, string>;
}

/**
 * Configuration interface
 */
export interface GenerateExportsConfig {
  skipPackages?: string[];
  pathTransformations?: Record<string, { removePrefix?: string }>;
  cssExports?: Record<string, CSSExportConfig | boolean>;
}

/**
 * Module file structure
 */
interface ModuleFiles {
  js: string | null;
  cjs: string | null;
  dts: string | null;
}

/**
 * Module information
 */
interface Module {
  path: string;
  files: ModuleFiles;
}

/**
 * Export entry structure
 */
interface ExportEntry {
  types: string;
  import?: string;
  require?: string;
}

/**
 * Package.json structure
 */
interface PackageJson {
  name?: string;
  exports?: Record<string, ExportEntry | string>;
  [key: string]: unknown;
}

/**
 * Scan thư mục recursively để tìm tất cả files
 */
async function scanDirectory(dir: string, baseDir: string = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const relativePath = normalize(relative(baseDir, fullPath)).replace(/\\/g, "/");
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Phân loại files theo module name (bỏ extension)
 */
function groupFilesByModule(files: string[]): Map<string, Module> {
  const modules = new Map<string, Module>();

  for (const file of files) {
    // Handle .d.ts first (special case - double extension)
    let ext: string;
    let modulePath: string;

    if (file.endsWith(".d.ts")) {
      ext = ".d.ts";
      modulePath = file.slice(0, -5); // Remove ".d.ts"
    } else {
      ext = extname(file);
      // Chỉ xử lý các file có extension hợp lệ
      if (![".js", ".cjs"].includes(ext)) {
        continue;
      }
      modulePath = file.slice(0, -ext.length); // Remove extension
    }

    const name = basename(modulePath);

    // Bỏ qua nếu là file trong thư mục con không có tên file
    if (!name) {
      continue;
    }

    const key = modulePath;

    if (!modules.has(key)) {
      modules.set(key, {
        path: modulePath,
        files: {
          js: null,
          cjs: null,
          dts: null,
        },
      });
    }

    const module = modules.get(key)!;

    if (ext === ".js") {
      module.files.js = file;
    } else if (ext === ".cjs") {
      module.files.cjs = file;
    } else if (ext === ".d.ts") {
      module.files.dts = file;
    }
  }

  return modules;
}

/**
 * Validate module có đủ files cần thiết
 */
function isValidModule(module: Module): boolean {
  const { files } = module;

  // Phải có ít nhất .js và .d.ts
  // .cjs là optional nhưng nên có để support CommonJS
  return files.js !== null && files.dts !== null;
}

/**
 * Convert dist path thành export path
 */
function toExportPath(distPath: string): string {
  // dist/index → "."
  if (distPath === "index") {
    return ".";
  }

  // dist/loaders/cloudinary → "./loaders/cloudinary"
  return `./${distPath}`;
}

/**
 * Tạo export object cho một module
 */
function createExportEntry(
  module: Module,
  pathTransform?: (exportPath: string) => string
): { exportPath: string; entry: ExportEntry } {
  const { path, files } = module;
  let exportPath = toExportPath(path);

  // Apply path transformation if provided
  if (pathTransform) {
    exportPath = pathTransform(exportPath);
  }

  const distPath = `./dist/${path}`;

  const entry: ExportEntry = {
    types: `${distPath}.d.ts`,
  };

  if (files.js) {
    entry.import = `${distPath}.js`;
  }

  if (files.cjs) {
    entry.require = `${distPath}.cjs`;
  }

  return { exportPath, entry };
}

/**
 * Load configuration file
 * Supports both .js and .json files, with .js taking priority
 */
async function loadConfig(rootDir: string): Promise<GenerateExportsConfig> {
  const configPathJs = resolve(rootDir, CONFIG_FILE_JS);
  const configPathJson = resolve(rootDir, CONFIG_FILE_JSON);

  // Try to load .js config first (has priority)
  try {
    await access(configPathJs);
    // Dynamic import for .js config file
    const config = await import(`file://${configPathJs}`);
    return (config.default || config) as GenerateExportsConfig;
  } catch {
    // If .js doesn't exist, try .json
    try {
      await access(configPathJson);
      const content = await readFile(configPathJson, "utf-8");
      return JSON.parse(content) as GenerateExportsConfig;
    } catch {
      // Return default config if neither file exists
      return {};
    }
  }
}

/**
 * Create path transformation function from config
 */
function createPathTransform(
  config: GenerateExportsConfig["pathTransformations"],
  packagePath: string
): ((exportPath: string) => string) | undefined {
  const transform = config?.[packagePath];
  if (!transform) {
    return undefined;
  }

  if (transform.removePrefix) {
    return (exportPath: string) => {
      if (exportPath.startsWith(transform.removePrefix!)) {
        const result = exportPath.slice(transform.removePrefix!.length);
        // Ensure result starts with "./" (except for root entry ".")
        if (result && result !== "." && !result.startsWith("./")) {
          return `./${result}`;
        }
        return result;
      }
      return exportPath;
    };
  }

  return undefined;
}

/**
 * Scan CSS files recursively in dist directory
 * Returns array of relative paths from dist/ (e.g., "css/amber.css", "style.css")
 */
async function scanCSSFiles(distDir: string, baseDir: string = distDir): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(distDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = resolve(distDir, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanCSSFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".css")) {
        // Get relative path from baseDir (dist/)
        const relativePath = normalize(relative(baseDir, fullPath)).replace(/\\/g, "/");
        files.push(relativePath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read, return empty array
  }

  return files;
}

/**
 * Check if a directory contains only CSS files
 */
async function isDirectoryCSSOnly(distDir: string, dirPath: string): Promise<boolean> {
  const fullPath = resolve(distDir, dirPath);
  
  try {
    const entries = await readdir(fullPath, { withFileTypes: true });
    
    // If directory is empty, consider it CSS-only (will use wildcard)
    if (entries.length === 0) {
      return true;
    }
    
    // Check if all files in directory are CSS files
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // If there's a subdirectory, it's not CSS-only
        return false;
      }
      if (entry.isFile() && !entry.name.endsWith(".css")) {
        // If there's a non-CSS file, it's not CSS-only
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate CSS exports based on auto-detected CSS files
 */
async function generateCSSExports(
  distDir: string,
  cssConfig: CSSExportConfig | boolean | undefined
): Promise<Record<string, string>> {
  const cssExports: Record<string, string> = {};

  // If config is boolean, use it as enabled flag
  if (typeof cssConfig === "boolean") {
    if (!cssConfig) {
      return cssExports;
    }
    cssConfig = { enabled: true };
  }

  if (!cssConfig || cssConfig.enabled === false) {
    return cssExports;
  }

  // Auto-detect all CSS files recursively
  const cssFiles = await scanCSSFiles(distDir);

  if (cssFiles.length === 0) {
    return cssExports;
  }

  // Add custom exports first (highest priority)
  if (cssConfig.customExports) {
    Object.assign(cssExports, cssConfig.customExports);
  }

  // Group CSS files by directory
  const cssByDir = new Map<string, string[]>();
  const rootCSS: string[] = [];

  for (const file of cssFiles) {
    const dir = dirname(file);
    if (dir === ".") {
      // Root CSS files (e.g., "style.css")
      rootCSS.push(file);
    } else {
      if (!cssByDir.has(dir)) {
        cssByDir.set(dir, []);
      }
      cssByDir.get(dir)!.push(file);
    }
  }

  // Export root CSS files individually
  for (const file of rootCSS) {
    const exportPath = `./${file}`;
    if (!cssConfig.customExports?.[exportPath]) {
      cssExports[exportPath] = `./dist/${file}`;
    }
  }

  // Process directories
  for (const [dir, files] of cssByDir.entries()) {
    if (files.length === 0) {
      continue;
    }

    // Check if directory contains only CSS files
    const isCSSOnly = await isDirectoryCSSOnly(distDir, dir);
    const forceFiles = cssConfig.forceExportFiles === true;

    if (isCSSOnly && !forceFiles) {
      // Directory only contains CSS files → use wildcard
      const wildcardExport = `./${dir}/*`;
      const wildcardPath = `./dist/${dir}/*`;

      if (!cssConfig.customExports?.[wildcardExport]) {
        cssExports[wildcardExport] = wildcardPath;
      }
    } else {
      // Directory has mixed files or forceExportFiles is true → export individual files
      for (const file of files) {
        const exportPath = `./${file}`;
        if (!cssConfig.customExports?.[exportPath]) {
          cssExports[exportPath] = `./dist/${file}`;
        }
      }
    }
  }

  return cssExports;
}

/**
 * Generate exports từ thư mục dist
 */
async function generateExports(
  distDir: string,
  pathTransform?: (exportPath: string) => string,
  cssConfig?: CSSExportConfig | boolean
): Promise<Record<string, ExportEntry | string>> {
  // 1. Scan thư mục dist
  const files = await scanDirectory(distDir);

  if (files.length === 0) {
    console.warn("⚠️  No files found in dist directory");
    return { "./package.json": "./package.json" };
  }

  // 2. Phân loại files theo module
  const modules = groupFilesByModule(files);

  if (modules.size === 0) {
    console.warn("⚠️  No valid modules found (need .js and .d.ts files)");
    return { "./package.json": "./package.json" };
  }

  // 3. Filter và validate modules
  const validModules = Array.from(modules.values()).filter(isValidModule);

  if (validModules.length === 0) {
    console.warn("⚠️  No valid modules after validation");
    return { "./package.json": "./package.json" };
  }

  // 4. Tạo exports object
  const exports: Record<string, ExportEntry> = {};

  for (const module of validModules) {
    const { exportPath, entry } = createExportEntry(module, pathTransform);
    exports[exportPath] = entry;
  }

  // 5. Sắp xếp exports theo nhóm thư mục
  const sortedExports: Record<string, ExportEntry | string> = {};
  
  /**
   * Extract directory group from export path for sorting
   * Returns: [group, subpath, sortOrder] where:
   * - group: directory name or special group
   * - subpath: remaining path after group
   * - sortOrder: numeric order for consistent grouping
   */
  function getExportGroup(path: string, pathTransform?: (p: string) => string): [string, string, number] {
    if (path === ".") {
      return [".", "", 0];
    }
    
    // Remove leading "./"
    const cleanPath = path.startsWith("./") ? path.slice(2) : path;
    
    // Check if it's a wildcard pattern
    if (cleanPath.endsWith("/*")) {
      const dir = cleanPath.slice(0, -2);
      // CSS exports come after JS exports
      const order = dir === "css" ? 900 : 100;
      return [dir, "", order];
    }
    
    // Extract first directory level
    const parts = cleanPath.split("/");
    if (parts.length === 1) {
      // Root level file - could be transformed component or actual root file
      // If pathTransform exists, check if it removes "./components/" prefix
      // In that case, these are components and should be grouped together
      const isTransformedComponent = pathTransform !== undefined;
      const order = isTransformedComponent ? 100 : 800; // Components: 100, other root files: 800
      const group = isTransformedComponent ? "components" : "";
      return [group, parts[0], order];
    }
    
    const group = parts[0];
    const subpath = parts.slice(1).join("/");
    
    // Define sort order for known groups
    const groupOrder: Record<string, number> = {
      "components": 100,
      "hooks": 200,
      "primitives": 300,
      "core": 400,
      "loaders": 500,
      "utils": 600,
      "css": 900,
    };
    
    const order = groupOrder[group] || 700; // Unknown groups come after known ones
    
    return [group, subpath, order];
  }
  
  /**
   * Sort comparator for export paths
   * Groups exports by directory and sorts alphabetically within each group
   */
  function sortExports(a: string, b: string): number {
    // "." luôn đứng đầu
    if (a === ".") return -1;
    if (b === ".") return 1;
    
    const [groupA, subpathA, orderA] = getExportGroup(a, pathTransform);
    const [groupB, subpathB, orderB] = getExportGroup(b, pathTransform);
    
    // Sort by order first (groups)
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Same order, sort by group name
    if (groupA !== groupB) {
      // Empty group (root files) comes after directories
      if (groupA === "") return 1;
      if (groupB === "") return -1;
      return groupA.localeCompare(groupB);
    }
    
    // Same group, sort by subpath
    return subpathA.localeCompare(subpathB);
  }
  
  const exportKeys = Object.keys(exports).sort(sortExports);

  for (const key of exportKeys) {
    sortedExports[key] = exports[key];
  }

  // 6. Auto-detect and generate CSS exports
  let cssExportsToAdd: Record<string, string> = {};
  if (cssConfig !== undefined) {
    // Use provided config
    cssExportsToAdd = await generateCSSExports(distDir, cssConfig);
  } else {
    // Auto-detect: scan for all CSS files and generate exports
    const cssFiles = await scanCSSFiles(distDir);
    
    if (cssFiles.length > 0) {
      // Auto-add CSS exports with defaults
      cssExportsToAdd = await generateCSSExports(distDir, { enabled: true });
    }
  }
  
  // Merge CSS exports and re-sort
  Object.assign(sortedExports, cssExportsToAdd);
  
  // Re-sort after adding CSS exports to maintain group order
  const allKeys = Object.keys(sortedExports).sort(sortExports);
  
  // Rebuild sorted exports
  const finalSortedExports: Record<string, ExportEntry | string> = {};
  for (const key of allKeys) {
    finalSortedExports[key] = sortedExports[key];
  }

  // 7. Luôn thêm package.json export ở cuối
  finalSortedExports["./package.json"] = "./package.json";

  return finalSortedExports;
}

/**
 * Update package.json với exports mới
 */
async function updatePackageJson(
  packageJsonPath: string,
  newExports: Record<string, ExportEntry | string>
): Promise<PackageJson> {
  const content = await readFile(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(content) as PackageJson;

  // Merge exports mới
  packageJson.exports = newExports;

  // Write lại với formatting
  const updated = JSON.stringify(packageJson, null, 2);
  await writeFile(packageJsonPath, updated + "\n", "utf-8");

  return packageJson;
}

/**
 * Process a single package
 */
async function processPackage(
  packageDir: string,
  rootDir: string,
  config: GenerateExportsConfig
): Promise<void> {
  const distDir = resolve(packageDir, DIST_DIR);
  const packageJsonPath = resolve(packageDir, PACKAGE_JSON);

  // Get relative path from root for config matching
  const relativePath = relative(rootDir, packageDir).replace(/\\/g, "/");

  // Check if package should be skipped
  if (config.skipPackages?.includes(relativePath)) {
    console.log(`⏭️  Skipping ${basename(packageDir)} (configured to skip)`);
    return;
  }

  // Validate paths
  try {
    await access(packageJsonPath);
    await access(distDir);
  } catch (error) {
    console.warn(`⚠️  Skipping ${packageDir}: package.json or dist/ not found`);
    return;
  }

  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent) as PackageJson;
    const packageName = packageJson.name || basename(packageDir);

    // Get path transformation for this package
    const pathTransform = createPathTransform(config.pathTransformations, relativePath);

    // Get CSS export config for this package
    const cssConfig = config.cssExports?.[relativePath];

    console.log(`\n📦 Processing package: ${packageName}`);
    console.log(`📁 Package directory: ${packageDir}`);
    if (pathTransform) {
      console.log("🔧 Using custom path transformation");
    }
    if (cssConfig !== undefined) {
      if (cssConfig === false) {
        console.log("🚫 CSS exports disabled");
      } else {
        console.log("🎨 CSS exports configured");
      }
    }
    console.log("🔍 Scanning dist directory...");

    const exports = await generateExports(distDir, pathTransform, cssConfig);

    console.log(`✅ Found ${Object.keys(exports).length} export entries`);
    console.log("📝 Updating package.json...");

    await updatePackageJson(packageJsonPath, exports);

    console.log("✨ Done! package.json exports updated.");
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Error processing ${packageDir}:`, err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    throw error;
  }
}

/**
 * Find all packages with dist/ directory
 */
async function findAllPackages(
  packagesDir: string,
  rootDir: string,
  config: GenerateExportsConfig
): Promise<string[]> {
  const packages: string[] = [];

  try {
    const entries = await readdir(packagesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packagePath = resolve(packagesDir, entry.name);
      const relativePath = relative(rootDir, packagePath).replace(/\\/g, "/");

      // Skip packages in config
      if (config.skipPackages?.includes(relativePath)) {
        continue;
      }

      const distPath = resolve(packagePath, DIST_DIR);
      const packageJsonPath = resolve(packagePath, PACKAGE_JSON);

      try {
        // Check if package has both package.json and dist/
        await access(packageJsonPath);
        await access(distPath);
        packages.push(packagePath);
      } catch {
        // Skip packages without dist/ or package.json
        continue;
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning packages directory: ${error}`);
  }

  return packages;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  // Get workspace root (parent of scripts directory)
  const scriptPath = fileURLToPath(import.meta.url);
  const scriptsDir = dirname(scriptPath);
  const rootDir = resolve(scriptsDir, "..");

  const args = process.argv.slice(2);

  try {
    // Load configuration
    const config = await loadConfig(rootDir);

    if (args.length > 0) {
      // Process single package
      const packageDir = resolve(rootDir, args[0]);
      await processPackage(packageDir, rootDir, config);
    } else {
      // Process all packages
      const packagesDir = resolve(rootDir, "packages");
      console.log("🔍 Scanning for packages with dist/ directory...");

      const packages = await findAllPackages(packagesDir, rootDir, config);

      if (packages.length === 0) {
        console.warn("⚠️  No packages with dist/ directory found");
        return;
      }

      console.log(`📦 Found ${packages.length} package(s) to process:\n`);
      for (const pkg of packages) {
        console.log(`  - ${basename(pkg)}`);
      }

      let successCount = 0;
      let errorCount = 0;

      for (const packageDir of packages) {
        try {
          await processPackage(packageDir, rootDir, config);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      console.log(`\n📊 Summary:`);
      console.log(`  ✅ Success: ${successCount}`);
      if (errorCount > 0) {
        console.log(`  ❌ Errors: ${errorCount}`);
      }
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run script
await main();


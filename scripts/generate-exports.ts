#!/usr/bin/env tsx

/**
 * Automatically generate package.json exports from the dist directory.
 *
 * This script scans the dist directory recursively, identifies valid module files,
 * and generates the appropriate export paths for both ESM and CommonJS formats.
 *
 * @usage
 *   tsx scripts/generate-exports.ts [package-path]
 *
 * @examples
 *   tsx scripts/generate-exports.ts packages/image-loader
 *   tsx scripts/generate-exports.ts packages/ui
 *   tsx scripts/generate-exports.ts  (uses current directory)
 *
 * ## Algorithm Overview
 *
 * ### 1. Scan Dist Directory
 *    Recursively reads the dist/ directory structure and filters files with
 *    valid extensions (.js, .cjs, .d.ts), excluding non-entry point files.
 *
 * ### 2. Group Files by Module
 *    Groups files by their base name (without extension). Each module should
 *    have three files: .js, .cjs, and .d.ts. For example, index.js, index.cjs,
 *    and index.d.ts form the "index" module.
 *
 * ### 3. Create Export Paths
 *    Converts file paths to export paths by removing the "dist/" prefix:
 *    - dist/index.* → "."
 *    - dist/loaders/cloudinary.* → "./loaders/cloudinary"
 *    - dist/core/types.* → "./core/types"
 *
 * ### 4. Validate Modules
 *    Only creates exports for modules that have at least .js and .d.ts files.
 *    The .cjs file is optional but recommended for CommonJS support.
 *
 * ### 5. Generate Exports Object
 *    Creates an exports object with the following structure:
 *    {
 *      "{export-path}": {
 *        "types": "./dist/{path}.d.ts",
 *        "import": "./dist/{path}.js",
 *        "require": "./dist/{path}.cjs"
 *      }
 *    }
 *    Exports are sorted alphabetically and "./package.json" is always included.
 *
 * ### 6. Update package.json
 *    Reads the current package.json, merges the new exports (preserving other
 *    fields), and writes the file back with proper formatting.
 */

import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, relative, dirname, basename, extname, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST_DIR = 'dist';
const PACKAGE_JSON = 'package.json';
const CONFIG_FILE_JS = 'generate-exports.config.js';
const CONFIG_FILE_JSON = 'generate-exports.config.json';

/**
 * Configuration options for CSS file exports.
 */
interface CSSExportConfig {
  /** Whether to enable automatic CSS exports. Defaults to true (auto-detect). */
  enabled?: boolean;
  /**
   * Force export individual files even if directory only contains CSS files.
   * Defaults to false (auto-detect).
   */
  forceExportFiles?: boolean;
  /** Custom export path mappings in the format: { exportPath: distPath } */
  customExports?: Record<string, string>;
}

/**
 * Main configuration interface for the export generation script.
 */
export interface GenerateExportsConfig {
  /** List of package paths to skip during processing. */
  skipPackages?: string[];
  /**
   * Path transformation rules for specific packages.
   * Allows removing prefixes from export paths.
   */
  pathTransformations?: Record<string, { removePrefix?: string }>;
  /**
   * CSS export configuration per package.
   * Can be a boolean (enable/disable) or a detailed CSSExportConfig object.
   */
  cssExports?: Record<string, CSSExportConfig | boolean>;
}

/**
 * Represents the file structure of a module.
 * Each module may have JavaScript, CommonJS, and TypeScript declaration files.
 */
interface ModuleFiles {
  js: string | null;
  cjs: string | null;
  dts: string | null;
}

/**
 * Represents a complete module with its path and associated files.
 */
interface Module {
  path: string;
  files: ModuleFiles;
}

/**
 * Represents an export entry in package.json.
 * Defines the paths for types, ESM imports, and CommonJS requires.
 */
interface ExportEntry {
  types: string;
  import?: string;
  require?: string;
}

/**
 * Structure of package.json file.
 * Extends the base structure to include exports field.
 */
interface PackageJson {
  name?: string;
  exports?: Record<string, ExportEntry | string>;
  [key: string]: unknown;
}

/**
 * Recursively scan a directory to find all files.
 *
 * @param dir - The directory to scan
 * @param baseDir - The base directory for calculating relative paths. Defaults to dir.
 * @returns An array of relative file paths from the base directory
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
      const relativePath = normalize(relative(baseDir, fullPath)).replace(/\\/g, '/');
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Group files by their module name (without extension).
 *
 * Files are grouped by their base name, so index.js, index.cjs, and index.d.ts
 * are all considered part of the same "index" module.
 *
 * @param files - Array of file paths to group
 * @returns A map of module paths to Module objects
 */
function groupFilesByModule(files: string[]): Map<string, Module> {
  const modules = new Map<string, Module>();

  for (const file of files) {
    // Handle .d.ts first (special case - double extension)
    let ext: string;
    let modulePath: string;

    if (file.endsWith('.d.ts')) {
      ext = '.d.ts';
      modulePath = file.slice(0, -5); // Remove ".d.ts"
    } else {
      ext = extname(file);
      // Only process files with valid extensions
      if (!['.js', '.cjs'].includes(ext)) {
        continue;
      }
      modulePath = file.slice(0, -ext.length); // Remove extension
    }

    const name = basename(modulePath);

    // Skip if file is in a subdirectory without a filename
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

    if (ext === '.js') {
      module.files.js = file;
    } else if (ext === '.cjs') {
      module.files.cjs = file;
    } else if (ext === '.d.ts') {
      module.files.dts = file;
    }
  }

  return modules;
}

/**
 * Validate that a module has the required files.
 *
 * A module is considered valid if it has at least .js and .d.ts files.
 * The .cjs file is optional but recommended for CommonJS support.
 *
 * @param module - The module to validate
 * @returns True if the module is valid, false otherwise
 */
function isValidModule(module: Module): boolean {
  const { files } = module;

  // Must have at least .js and .d.ts files
  // .cjs is optional but recommended for CommonJS support
  return files.js !== null && files.dts !== null;
}

/**
 * Convert a dist path to an export path.
 *
 * The root index file becomes ".", while other paths are prefixed with "./".
 *
 * @param distPath - The path within the dist directory
 * @returns The export path for package.json
 */
function toExportPath(distPath: string): string {
  // dist/index → "."
  if (distPath === 'index') {
    return '.';
  }

  // dist/loaders/cloudinary → "./loaders/cloudinary"
  return `./${distPath}`;
}

/**
 * Create an export entry object for a module.
 *
 * @param module - The module to create an export entry for
 * @param pathTransform - Optional function to transform the export path
 * @returns An object containing the export path and entry definition
 */
function createExportEntry(
  module: Module,
  pathTransform?: (exportPath: string) => string,
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
 * Load configuration file from the root directory.
 *
 * Supports both .js and .json configuration files, with .js taking priority.
 * If neither file exists, returns an empty configuration object.
 *
 * @param rootDir - The root directory to search for configuration files
 * @returns The loaded configuration object
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
      const content = await readFile(configPathJson, 'utf-8');
      return JSON.parse(content) as GenerateExportsConfig;
    } catch {
      // Return default config if neither file exists
      return {};
    }
  }
}

/**
 * Create a path transformation function from configuration.
 *
 * @param config - The path transformations configuration
 * @param packagePath - The package path to get transformation for
 * @returns A transformation function if configured, undefined otherwise
 */
function createPathTransform(
  config: GenerateExportsConfig['pathTransformations'],
  packagePath: string,
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
        if (result && result !== '.' && !result.startsWith('./')) {
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
 * Recursively scan for CSS files in the dist directory.
 *
 * @param distDir - The dist directory to scan
 * @param baseDir - The base directory for calculating relative paths. Defaults to distDir.
 * @returns An array of relative paths from dist/ (e.g., "css/amber.css", "style.css")
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
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        // Get relative path from baseDir (dist/)
        const relativePath = normalize(relative(baseDir, fullPath)).replace(/\\/g, '/');
        files.push(relativePath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read, return empty array
  }

  return files;
}

/**
 * Check if a directory contains only CSS files.
 *
 * An empty directory is considered CSS-only and will use a wildcard export.
 *
 * @param distDir - The base dist directory
 * @param dirPath - The directory path to check (relative to distDir)
 * @returns True if the directory contains only CSS files or is empty
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
      if (entry.isFile() && !entry.name.endsWith('.css')) {
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
 * Generate CSS exports based on auto-detected CSS files.
 *
 * Automatically detects CSS files in the dist directory and generates appropriate
 * export paths. Supports wildcard exports for CSS-only directories and individual
 * file exports when needed.
 *
 * @param distDir - The dist directory to scan for CSS files
 * @param cssConfig - CSS export configuration (boolean or detailed config object)
 * @returns A record of export paths to CSS file paths
 */
async function generateCSSExports(
  distDir: string,
  cssConfig: CSSExportConfig | boolean | undefined,
): Promise<Record<string, string>> {
  const cssExports: Record<string, string> = {};

  // If config is boolean, use it as enabled flag
  if (typeof cssConfig === 'boolean') {
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
    if (dir === '.') {
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
 * Generate exports from the dist directory.
 *
 * This is the main function that orchestrates the entire export generation process:
 * scanning files, grouping by module, validating, creating export entries, and
 * optionally generating CSS exports.
 *
 * @param distDir - The dist directory to scan
 * @param pathTransform - Optional function to transform export paths
 * @param cssConfig - Optional CSS export configuration
 * @returns A record of export paths to export entries or CSS file paths
 */
async function generateExports(
  distDir: string,
  pathTransform?: (exportPath: string) => string,
  cssConfig?: CSSExportConfig | boolean,
): Promise<Record<string, ExportEntry | string>> {
  // 1. Scan the dist directory
  const files = await scanDirectory(distDir);

  if (files.length === 0) {
    console.warn('⚠️  No files found in dist directory');
    return { './package.json': './package.json' };
  }

  // 2. Group files by module
  const modules = groupFilesByModule(files);

  if (modules.size === 0) {
    console.warn('⚠️  No valid modules found (need .js and .d.ts files)');
    return { './package.json': './package.json' };
  }

  // 3. Filter and validate modules
  const validModules = Array.from(modules.values()).filter(isValidModule);

  if (validModules.length === 0) {
    console.warn('⚠️  No valid modules after validation');
    return { './package.json': './package.json' };
  }

  // 4. Create exports object
  const exports: Record<string, ExportEntry> = {};

  for (const module of validModules) {
    const { exportPath, entry } = createExportEntry(module, pathTransform);
    exports[exportPath] = entry;
  }

  // 5. Sort exports by directory groups
  const sortedExports: Record<string, ExportEntry | string> = {};

  /**
   * Extract directory group from export path for sorting purposes.
   *
   * @param path - The export path to analyze
   * @param pathTransform - Optional path transformation function
   * @returns A tuple containing [group, subpath, sortOrder] where:
   *          - group: directory name or special group identifier
   *          - subpath: remaining path after the group
   *          - sortOrder: numeric order for consistent grouping
   */
  function getExportGroup(path: string, pathTransform?: (p: string) => string): [string, string, number] {
    if (path === '.') {
      return ['.', '', 0];
    }

    // Remove leading "./"
    const cleanPath = path.startsWith('./') ? path.slice(2) : path;

    // Check if it's a wildcard pattern
    if (cleanPath.endsWith('/*')) {
      const dir = cleanPath.slice(0, -2);
      // CSS exports come after JS exports
      const order = dir === 'css' ? 900 : 100;
      return [dir, '', order];
    }

    // Extract first directory level
    const parts = cleanPath.split('/');
    if (parts.length === 1) {
      // Root level file - could be transformed component or actual root file
      // If pathTransform exists, check if it removes "./components/" prefix
      // In that case, these are components and should be grouped together
      const isTransformedComponent = pathTransform !== undefined;
      const order = isTransformedComponent ? 100 : 800; // Components: 100, other root files: 800
      const group = isTransformedComponent ? 'components' : '';
      return [group, parts[0], order];
    }

    const group = parts[0];
    const subpath = parts.slice(1).join('/');

    // Define sort order for known groups
    const groupOrder: Record<string, number> = {
      components: 100,
      hooks: 200,
      primitives: 300,
      core: 400,
      loaders: 500,
      utils: 600,
      css: 900,
    };

    const order = groupOrder[group] || 700; // Unknown groups come after known ones

    return [group, subpath, order];
  }

  /**
   * Sort comparator for export paths.
   *
   * Groups exports by directory and sorts alphabetically within each group.
   * The root entry "." always comes first.
   *
   * @param a - First export path to compare
   * @param b - Second export path to compare
   * @returns Comparison result for sorting
   */
  function sortExports(a: string, b: string): number {
    // "." always comes first
    if (a === '.') return -1;
    if (b === '.') return 1;

    const [groupA, subpathA, orderA] = getExportGroup(a, pathTransform);
    const [groupB, subpathB, orderB] = getExportGroup(b, pathTransform);

    // Sort by order first (groups)
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Same order, sort by group name
    if (groupA !== groupB) {
      // Empty group (root files) comes after directories
      if (groupA === '') return 1;
      if (groupB === '') return -1;
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

  // 7. Always add package.json export at the end
  finalSortedExports['./package.json'] = './package.json';

  return finalSortedExports;
}

/**
 * Update package.json with new exports.
 *
 * Reads the existing package.json, merges the new exports (preserving other fields),
 * and writes the file back with proper formatting.
 *
 * @param packageJsonPath - Path to the package.json file
 * @param newExports - The new exports to merge into package.json
 * @returns The updated package.json object
 */
async function updatePackageJson(
  packageJsonPath: string,
  newExports: Record<string, ExportEntry | string>,
): Promise<PackageJson> {
  const content = await readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content) as PackageJson;

  // Merge new exports
  packageJson.exports = newExports;

  // Write back with formatting
  const updated = JSON.stringify(packageJson, null, 2);
  await writeFile(packageJsonPath, updated + '\n', 'utf-8');

  return packageJson;
}

/**
 * Process a single package to generate and update its exports.
 *
 * Validates the package structure, applies configuration, generates exports,
 * and updates the package.json file.
 *
 * @param packageDir - The directory of the package to process
 * @param rootDir - The root directory of the workspace
 * @param config - The configuration object
 */
async function processPackage(packageDir: string, rootDir: string, config: GenerateExportsConfig): Promise<void> {
  const distDir = resolve(packageDir, DIST_DIR);
  const packageJsonPath = resolve(packageDir, PACKAGE_JSON);

  // Get relative path from root for config matching
  const relativePath = relative(rootDir, packageDir).replace(/\\/g, '/');

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
    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent) as PackageJson;
    const packageName = packageJson.name || basename(packageDir);

    // Get path transformation for this package
    const pathTransform = createPathTransform(config.pathTransformations, relativePath);

    // Get CSS export config for this package
    const cssConfig = config.cssExports?.[relativePath];

    console.log(`\n📦 Processing package: ${packageName}`);
    console.log(`📁 Package directory: ${packageDir}`);
    if (pathTransform) {
      console.log('🔧 Using custom path transformation');
    }
    if (cssConfig !== undefined) {
      if (cssConfig === false) {
        console.log('🚫 CSS exports disabled');
      } else {
        console.log('🎨 CSS exports configured');
      }
    }
    console.log('🔍 Scanning dist directory...');

    const exports = await generateExports(distDir, pathTransform, cssConfig);

    console.log(`✅ Found ${Object.keys(exports).length} export entries`);
    console.log('📝 Updating package.json...');

    await updatePackageJson(packageJsonPath, exports);

    console.log('✨ Done! package.json exports updated.');
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
 * Find all packages with a dist/ directory.
 *
 * Scans the packages directory and returns all packages that have both
 * a package.json file and a dist/ directory, excluding packages configured
 * to be skipped.
 *
 * @param packagesDir - The directory containing packages
 * @param rootDir - The root directory of the workspace
 * @param config - The configuration object
 * @returns An array of package directory paths
 */
async function findAllPackages(packagesDir: string, rootDir: string, config: GenerateExportsConfig): Promise<string[]> {
  const packages: string[] = [];

  try {
    const entries = await readdir(packagesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packagePath = resolve(packagesDir, entry.name);
      const relativePath = relative(rootDir, packagePath).replace(/\\/g, '/');

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
 * Main entry point for the export generation script.
 *
 * Handles command-line arguments, loads configuration, and processes
 * either a single package or all packages in the workspace.
 */
async function main(): Promise<void> {
  // Get workspace root (parent of scripts directory)
  const scriptPath = fileURLToPath(import.meta.url);
  const scriptsDir = dirname(scriptPath);
  const rootDir = resolve(scriptsDir, '..');

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
      const packagesDir = resolve(rootDir, 'packages');
      console.log('🔍 Scanning for packages with dist/ directory...');

      const packages = await findAllPackages(packagesDir, rootDir, config);

      if (packages.length === 0) {
        console.warn('⚠️  No packages with dist/ directory found');
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
    console.error('❌ Error:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run script
await main();

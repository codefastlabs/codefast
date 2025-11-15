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
function createExportEntry(module: Module): { exportPath: string; entry: ExportEntry } {
  const { path, files } = module;
  const exportPath = toExportPath(path);
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
 * Generate exports từ thư mục dist
 */
async function generateExports(distDir: string): Promise<Record<string, ExportEntry | string>> {
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
    const { exportPath, entry } = createExportEntry(module);
    exports[exportPath] = entry;
  }
  
  // 5. Sắp xếp exports (root entry đầu tiên, sau đó alphabet)
  const sortedExports: Record<string, ExportEntry | string> = {};
  const exportKeys = Object.keys(exports).sort((a, b) => {
    // "." luôn đứng đầu
    if (a === ".") return -1;
    if (b === ".") return 1;
    return a.localeCompare(b);
  });
  
  for (const key of exportKeys) {
    sortedExports[key] = exports[key];
  }
  
  // 6. Luôn thêm package.json export
  sortedExports["./package.json"] = "./package.json";
  
  return sortedExports;
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
async function processPackage(packageDir: string): Promise<void> {
  const distDir = resolve(packageDir, DIST_DIR);
  const packageJsonPath = resolve(packageDir, PACKAGE_JSON);
  
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
    
    console.log(`\n📦 Processing package: ${packageName}`);
    console.log(`📁 Package directory: ${packageDir}`);
    console.log("🔍 Scanning dist directory...");
    
    const exports = await generateExports(distDir);
    
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
async function findAllPackages(packagesDir: string): Promise<string[]> {
  const packages: string[] = [];
  
  try {
    const entries = await readdir(packagesDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      
      const packagePath = resolve(packagesDir, entry.name);
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
    if (args.length > 0) {
      // Process single package
      const packageDir = resolve(rootDir, args[0]);
      await processPackage(packageDir);
    } else {
      // Process all packages
      const packagesDir = resolve(rootDir, "packages");
      console.log("🔍 Scanning for packages with dist/ directory...");
      
      const packages = await findAllPackages(packagesDir);
      
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
          await processPackage(packageDir);
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
main();


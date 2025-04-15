import type { Command } from "commander";
import type { SourceFile } from "ts-morph";

import { glob } from "glob";
import { merge } from "lodash-es";
import fs from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";
import { z } from "zod";

import { Logger } from "@/lib/logger";

export const PackageConfigSchema = z.interface({
  // Pattern đường dẫn output cho các module CommonJS (CJS).
  // Ví dụ: "dist/cjs/*.js" để xác định nơi xuất file CJS.
  cjsOutputPattern: z.string(),
  // Pattern đường dẫn output cho các module ES Modules (ESM).
  // Ví dụ: "dist/esm/*.js" để xác định nơi xuất file ESM.
  esmOutputPattern: z.string(),
  // Đường dẫn đến file package.json của package.
  // Dùng để đọc hoặc cập nhật thông tin package (ví dụ: version, exports).
  packageJsonPath: z.string(),
  // Đường dẫn đến file src/index.ts của package.
  // Đây là entry point chính để phân tích exports hoặc build.
  srcIndexPath: z.string(),
  // Pattern đường dẫn output cho các type definitions dùng trong CJS.
  // Ví dụ: "dist/cjs/*.d.ts" để xuất type definitions tương ứng.
  typesOutputCjsPattern: z.string(),
  // Pattern đường dẫn output chung cho các type definitions.
  // Ví dụ: "dist/types/*.d.ts" để xuất type definitions cho cả CJS và ESM.
  typesOutputPattern: z.string(),
  // Prefix to be removed from the path when exporting.
  // Example: "components" to remove "components" from the export path
  "exportPathPrefixesToRemove?": z.array(z.string()),
});
export const ScriptConfigSchema = z.interface({
  // The Record contains custom configurations for each package.
  // Key is the package name, value is the partial configuration to override defaultPackageConfig.
  // Example: { "my-package": { cjsOutputPattern: "dist/custom/*.js" } }.
  customPackageConfigs: z.record(z.string(), PackageConfigSchema.partial()),
  // Default configuration applies to all packages.
  // Ensures all packages have valid configuration if not customized.
  defaultPackageConfig: PackageConfigSchema,
  // Glob pattern to find packages in the project.
  // Example: "packages/*" to find all package folders in the packages folder.
  packagesGlob: z.string(),
});
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type ScriptConfig = z.infer<typeof ScriptConfigSchema>;
let cachedConfig: null | ScriptConfig = null;

/**
 * Đọc file cấu hình từ đường dẫn
 */
function loadConfigFile(configPath?: string): Partial<ScriptConfig> {
  if (!configPath) {
    return {};
  }

  try {
    const fullPath = path.resolve(configPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Không tìm thấy file cấu hình tại ${fullPath}`);

      return {};
    }

    const configContent = fs.readFileSync(fullPath, "utf8");
    const config = JSON.parse(configContent);

    // Validate schema
    return ScriptConfigSchema.parse(config);
  } catch (error) {
    console.error("Lỗi khi đọc file cấu hình:", error);

    return {};
  }
}

/**
 * Lấy cấu hình kết hợp
 */
export function getConfig(configPath?: string): ScriptConfig {
  if (cachedConfig && !configPath) {
    return cachedConfig;
  }

  const userConfig = loadConfigFile(configPath);
  const config = merge({}, defaultConfig, userConfig) as ScriptConfig;

  // Cache nếu không truyền configPath
  if (!configPath) {
    cachedConfig = config;
  }

  return config;
}

/**
 * Lấy cấu hình cho một package dựa trên package name
 */
export function getPackageConfig(packageName: string, config?: ScriptConfig): PackageConfig {
  const configObj = config ?? getConfig();
  const customConfig = configObj.customPackageConfigs[packageName] ?? {};

  return {
    ...configObj.defaultPackageConfig,
    ...customConfig,
  };
}

function makeRegexPrefixesToRemove(prefixes: string[]): RegExp {
  // Xây dựng regex để khớp với bất kỳ prefix nào trong danh sách
  // Format: ^\.?\/?(prefix1|prefix2)\/(.*)
  // - ^\.?\/?          : Bắt đầu với ./ hoặc / tùy chọn
  // - (prefix1|prefix2): Bất kỳ prefix nào trong danh sách
  // - \/(.*)           : Đường dẫn còn lại sau prefix
  const prefixPattern = prefixes.join("|");

  return new RegExp(`^.?\\/?(?:${prefixPattern})\\/(.*)$`);
}

function processExportPath(modulePath: string, regexPattern: RegExp): string {
  let processedPath = modulePath;

  const match = processedPath.match(regexPattern);

  if (match) {
    // Lấy phần sau các prefixes cần loại bỏ
    const remainingPath = match[1];

    // Đảm bảo đường dẫn bắt đầu bằng ./
    processedPath = remainingPath.startsWith("./") ? remainingPath : `./${remainingPath}`;
  }

  return processedPath;
}

export interface ImportPath {
  // Thư mục chứa module (ví dụ: 'components')
  directory: string;
  // Export path cho package.json (ví dụ: './button' hoặc './lib/utils')
  exportPath: string;
  // Tên module (ví dụ: 'Button')
  name: string;
  // Đường dẫn import gốc (ví dụ: './components/Button')
  originalPath: string;
}

export interface AnalysisResult {
  // Tất cả các đường dẫn import đã phân tích
  imports: ImportPath[];
}

/**
 * Phân tích import từ file index.ts
 */
export function analyzeImports(indexFilePath: string, packageConfig: PackageConfig): AnalysisResult {
  const project = new Project();
  let sourceFile: SourceFile;

  try {
    sourceFile = project.addSourceFileAtPath(indexFilePath);
  } catch (error) {
    console.error(`Error loading source file at ${indexFilePath}:`, error);

    return { imports: [] };
  }

  const imports: ImportPath[] = [];
  const prefixesToRemove = packageConfig.exportPathPrefixesToRemove ?? [];

  const regexPattern = makeRegexPrefixesToRemove(prefixesToRemove);

  for (const exportDecl of sourceFile.getExportDeclarations()) {
    let moduleSpecifier = exportDecl.getModuleSpecifierValue();

    if (!moduleSpecifier) {
      continue;
    }

    // Chuẩn hóa @/ thành ./
    if (moduleSpecifier.startsWith("@/")) {
      moduleSpecifier = `./${moduleSpecifier.slice(2)}`; // Thay @/ bằng ./
    }

    const isExternal = !moduleSpecifier.startsWith(".");

    if (isExternal) {
      continue;
    }

    const parts = moduleSpecifier.split("/").filter(Boolean); // Loại bỏ phần rỗng

    if (parts.length < 2) {
      continue;
    }

    let directory;

    if (parts.length <= 1) {
      directory = ".";
    } else {
      directory = parts.slice(0, -1).join("/");

      // Loại bỏ "./" ở đầu nếu có
      if (directory.startsWith("./")) {
        directory = directory.slice(2);
      }
    }

    const name = parts.at(-1) ?? "";

    const importPath: ImportPath = {
      originalPath: moduleSpecifier,
      directory,
      name,
      exportPath: processExportPath(moduleSpecifier, regexPattern),
    };

    imports.push(importPath);
  }

  return { imports };
}

function formatOutputPath(pattern: string, directory: string, name: string): string {
  const dirPart = directory === "." ? "" : `${directory}/`;

  return pattern.replace("{dir}/", dirPart).replace("{dir}", directory).replace("{name}", name);
}

// Định nghĩa interface cho cấu hình export của một module trong package
export interface ExportConfig {
  // Cấu hình cho kiểu import (ESM - ES Modules)
  import: {
    // Đường dẫn đến file default cho ESM import
    // Ví dụ: "./dist/esm/index.js"
    default: string;
    // Đường dẫn đến file type definitions cho ESM import
    // Ví dụ: "./dist/types/index.d.ts"
    types: string;
  };
  // Cấu hình cho kiểu require (CJS - CommonJS)
  require: {
    // Đường dẫn đến file default cho CJS require
    // Ví dụ: "./dist/cjs/index.js"
    default: string;
    // Đường dẫn đến file type definitions cho CJS require
    // Ví dụ: "./dist/types/index.d.ts"
    types: string;
  };
}

export type ExportTarget = ExportConfig | string;
// Định nghĩa type cho exports của package, ánh xạ từ key đến cấu hình export
// Key là tên export path (ví dụ: ".", "./submodule"), value có thể là string hoặc ExportConfig
// Ví dụ: { ".": { import: { default: "./dist/esm/index.js", types: "./dist/types/index.d.ts" }, ... } }
export type PackageExports = Record<string, ExportTarget>;

export interface PackageJson {
  [key: string]: unknown;
  name: string;
  version: string;

  exports?: PackageExports;
}

/**
 * Tạo cấu trúc exports cho package.json
 */
export function generateExports(
  packageName: string,
  imports: ImportPath[],
  existingExports: PackageExports = {},
  config?: ScriptConfig,
): PackageExports {
  const packageConfig = getPackageConfig(packageName, config);

  // Sao chép cấu trúc exports hiện tại
  const exports: PackageExports = {
    ".": existingExports["."] ?? {
      import: {
        types: "./dist/types/index.d.ts",
        default: "./dist/esm/index.js",
      },
      require: {
        types: "./dist/types/index.d.cts",
        default: "./dist/cjs/index.cjs",
      },
    },
  };

  // CSS exports (giữ nguyên nếu đã tồn tại)
  if (existingExports["./styles.css"]) {
    exports["./styles.css"] = existingExports["./styles.css"];
  }

  // Thêm exports cho từng import path
  for (const importPath of imports) {
    const { directory, name, exportPath } = importPath;

    // Tạo đường dẫn output dựa theo cấu hình package
    const esmOutput = formatOutputPath(packageConfig.esmOutputPattern, directory, name);
    const cjsOutput = formatOutputPath(packageConfig.cjsOutputPattern, directory, name);
    const typesOutput = formatOutputPath(packageConfig.typesOutputPattern, directory, name);
    const typesCjsOutput = formatOutputPath(packageConfig.typesOutputCjsPattern, directory, name);

    // Thêm vào exports
    exports[exportPath] = {
      import: {
        types: typesOutput,
        default: esmOutput,
      },
      require: {
        types: typesCjsOutput,
        default: cjsOutput,
      },
    };
  }

  return exports;
}

// Constants
const EXPORTS_ANALYSIS_DIR = ".exports-analysis";
const ENCODING = "utf8";
const JSON_INDENT = 2;
const DEFAULT_IGNORE_PATTERN = ["**/node_modules/**"];
/**
 * Utilities for file and directory operations
 */
const FileUtils = {
  /**
   * Check if a file exists
   */
  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  },

  /**
   * Ensure a directory exists, create it if necessary
   */
  ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  /**
   * Read and parse a JSON file
   */
  readJsonFile<T>(filePath: string): null | T {
    try {
      const content = fs.readFileSync(filePath, ENCODING);

      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`Error reading JSON file at ${filePath}:`, error);

      return null;
    }
  },

  /**
   * Write content to a JSON file
   */
  writeJsonFile<T>(filePath: string, content: T): boolean {
    try {
      fs.writeFileSync(filePath, `${JSON.stringify(content, null, JSON_INDENT)}\n`, ENCODING);

      return true;
    } catch (error) {
      console.error(`Error writing JSON file at ${filePath}:`, error);

      return false;
    }
  },

  /**
   * Get the path to the exports analysis directory
   */
  getAnalysisDir(packageDir: string): string {
    const outputDir = path.join(packageDir, EXPORTS_ANALYSIS_DIR);

    this.ensureDirectoryExists(outputDir);

    return outputDir;
  },

  /**
   * Create a timestamped backup filename
   */
  createBackupFilename(baseFilename: string): string {
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");

    return `${baseFilename}.backup.${timestamp}`;
  },
};

/**
 * Find all package.json files in the workspace
 */
export async function findAllPackages(config?: ScriptConfig): Promise<string[]> {
  const configObj = config ?? getConfig();

  return await glob(configObj.packagesGlob, {
    ignore: DEFAULT_IGNORE_PATTERN,
  });
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return FileUtils.exists(filePath);
}

/**
 * Read and parse package.json content
 */
export function readPackageJson(filePath: string): null | PackageJson {
  return FileUtils.readJsonFile<PackageJson>(filePath);
}

/**
 * Create a backup of package.json
 */
export function backupPackageJson(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, ENCODING);
    const dir = path.dirname(filePath);
    const backupDir = path.join(dir, EXPORTS_ANALYSIS_DIR);

    FileUtils.ensureDirectoryExists(backupDir);

    const baseName = path.basename(filePath);
    const backupPath = path.join(backupDir, FileUtils.createBackupFilename(baseName));

    fs.writeFileSync(backupPath, content, ENCODING);

    return true;
  } catch (error) {
    console.error(`Error backing up package.json at ${filePath}:`, error);

    return false;
  }
}

/**
 * Save updated package.json content
 */
export function savePackageJson(filePath: string, content: PackageJson): boolean {
  return FileUtils.writeJsonFile(filePath, content);
}

/**
 * Save exports analysis result
 */
export function saveExportsAnalysis(packageDir: string, analysis: AnalysisResult): void {
  const outputDir = FileUtils.getAnalysisDir(packageDir);

  FileUtils.writeJsonFile(path.join(outputDir, "exports-analysis.json"), analysis);
}

/**
 * Save exports preview data
 */
export function saveExportsPreview(packageDir: string, exports: PackageExports): void {
  const outputDir = FileUtils.getAnalysisDir(packageDir);

  FileUtils.writeJsonFile(path.join(outputDir, "exports-preview.json"), exports);
}

export interface ProcessOptions {
  dryRun: boolean;
  verbose: boolean;
  configPath?: string;
  packageFilter?: string;
}

/**
 * Xử lý một package đơn lẻ
 */
export function processPackage(packageJsonPath: string, options: ProcessOptions, logger: Logger): boolean {
  const packageDir = path.dirname(packageJsonPath);
  const packageJson = readPackageJson(packageJsonPath);

  if (!packageJson) {
    logger.error(`Không thể đọc ${packageJsonPath}`);

    return false;
  }

  const packageName = packageJson.name;

  // Kiểm tra nếu có filter package cụ thể
  if (options.packageFilter && packageName !== options.packageFilter) {
    logger.debug(`Bỏ qua ${packageName} (không khớp với filter)`);

    return false;
  }

  logger.info(`\n📦 Xử lý package: ${packageName}`);

  const config = getConfig(options.configPath);
  const packageConfig = getPackageConfig(packageName, config);
  const srcIndexPath = path.join(packageDir, packageConfig.srcIndexPath);

  if (!fileExists(srcIndexPath)) {
    logger.error(`Không tìm thấy file nguồn tại ${srcIndexPath}`);

    return false;
  }

  // Phân tích imports
  logger.info(`🔍 Phân tích imports từ ${srcIndexPath}...`);
  const { imports } = analyzeImports(srcIndexPath, packageConfig);

  if (imports.length === 0) {
    logger.warn(`Không tìm thấy imports nào để phân tích trong ${packageName}`);

    return false;
  }

  logger.success(`Phân tích hoàn tất. Tìm thấy ${imports.length} subpath exports.`);

  // Lưu kết quả phân tích
  saveExportsAnalysis(packageDir, { imports });

  // Tạo cấu trúc exports mới
  const newExports = generateExports(packageName, imports, packageJson.exports, config);

  // So sánh với exports hiện tại
  const currentExportsCount = packageJson.exports ? Object.keys(packageJson.exports).length : 0;
  const newExportsCount = Object.keys(newExports).length;

  logger.info(`📊 Exports: ${currentExportsCount} -> ${newExportsCount}`);

  if (options.dryRun) {
    saveExportsPreview(packageDir, newExports);
    logger.warn(`🧪 📄 Đã lưu bản preview exports vào .exports-analysis`);
    logger.warn(`🧪 🚫 Dry run: không lưu thay đổi cho ${packageName}`);

    return true;
  }

  // Backup package.json
  if (backupPackageJson(packageJsonPath)) {
    logger.success(`Đã sao lưu ${packageJsonPath}`);
  }

  // Cập nhật package.json
  const updatedPackageJson = { ...packageJson, exports: newExports };

  if (savePackageJson(packageJsonPath, updatedPackageJson)) {
    logger.success(`Đã cập nhật exports cho ${packageName}`);

    return true;
  }

  logger.error(`Không thể cập nhật ${packageJsonPath}`);

  return false;
}

/**
 * Xử lý tất cả các package trong workspace
 */
export async function processAllPackages(options: ProcessOptions, logger: Logger): Promise<void> {
  try {
    logger.info("🔍 Tìm kiếm packages...");
    const config = getConfig(options.configPath);
    const packageJsonPaths = await findAllPackages(config);

    if (packageJsonPaths.length === 0) {
      logger.warn("⚠️ Không tìm thấy package nào.");

      return;
    }

    logger.success(`✅ Tìm thấy ${packageJsonPaths.length} packages.`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const packageJsonPath of packageJsonPaths) {
      const result = processPackage(packageJsonPath, options, logger);

      if (result) {
        successCount++;
      } else if (options.packageFilter) {
        skipCount++;
      } else {
        errorCount++;
      }
    }

    logger.success("\n✅ Đã hoàn tất cập nhật exports.");
    logger.info(`📊 Thống kê: ${successCount} thành công, ${skipCount} bỏ qua, ${errorCount} lỗi`);
  } catch (error) {
    logger.error("❌ Lỗi khi xử lý packages:", error);
    throw error;
  }
}

export function createUpdateExportsCommand(program: Command): void {
  program
    .command("update-exports")
    .description("Cập nhật exports cho tất cả các package")
    .option("-p, --package <package>", "Lọc theo tên package")
    .option("-d, --dry-run", "Chạy mà không thực hiện các thay đổi")
    .option("-v, --verbose", "Hiển thị thông tin chi tiết")
    .option("-c, --config <path>", "Đường dẫn tới file cấu hình")
    .action(async (options) => {
      // Chuyển đổi options từ commander sang định dạng phù hợp
      const processorOptions = {
        packageFilter: options.package,
        dryRun: Boolean(options.dryRun),
        verbose: Boolean(options.verbose),
        configPath: options.config,
      };

      const logger = new Logger({ verbose: processorOptions.verbose });

      try {
        await processAllPackages(processorOptions, logger);
      } catch (error) {
        logger.error("Lỗi khi xử lý packages:", error);
        process.exit(1);
      }
    });
} // Cấu hình mặc định

export const defaultConfig: ScriptConfig = {
  packagesGlob: "./packages/**/package.json",
  defaultPackageConfig: {
    cjsOutputPattern: "./dist/cjs/{dir}/{name}.cjs",
    esmOutputPattern: "./dist/esm/{dir}/{name}.js",
    packageJsonPath: "package.json",
    srcIndexPath: "src/index.ts",
    typesOutputCjsPattern: "./dist/types/{dir}/{name}.d.ts",
    typesOutputPattern: "./dist/types/{dir}/{name}.d.ts",
  },
  customPackageConfigs: {
    "@codefast/ui": {
      exportPathPrefixesToRemove: ["components"],
    },
    "@codefast/style-guide": {
      exportPathPrefixesToRemove: ["configs"],
    },
  },
};

import path from "node:path";

import type { ProcessOptions } from "@/types/config";
import type { Logger } from "@/utils/logger";

import { getConfig, getPackageConfig } from "@/config";
import { analyzeImports } from "@/core/analyzer";
import { generateExports } from "@/core/exporter";
import {
  backupPackageJson,
  fileExists,
  findAllPackages,
  readPackageJson,
  saveExportsAnalysis,
  savePackageJson,
} from "@/utils/file-utils";

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
  const { imports, importsByDir } = analyzeImports(srcIndexPath);

  if (imports.length === 0) {
    logger.warn(`Không tìm thấy imports nào để phân tích trong ${packageName}`);

    return false;
  }

  logger.success(`Phân tích hoàn tất. Tìm thấy ${imports.length} subpath exports.`);

  // Log chi tiết thư mục nếu verbose mode
  for (const [dir, dirImports] of Object.entries(importsByDir)) {
    logger.debug(`📁 ${dir}: ${dirImports.length} modules`);

    for (const imp of dirImports) {
      logger.debug(`- ${imp.originalPath} -> ${imp.exportPath}`);
    }
  }

  // Lưu kết quả phân tích
  saveExportsAnalysis(packageDir, { imports, importsByDir });

  // Tạo cấu trúc exports mới
  const newExports = generateExports(packageName, imports, packageJson.exports, config);

  // So sánh với exports hiện tại
  const currentExportsCount = packageJson.exports ? Object.keys(packageJson.exports).length : 0;
  const newExportsCount = Object.keys(newExports).length;

  logger.info(`📊 Exports: ${currentExportsCount} -> ${newExportsCount}`);

  if (options.dryRun) {
    logger.warn(`🔍 Dry run mode: không lưu thay đổi cho ${packageName}`);

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

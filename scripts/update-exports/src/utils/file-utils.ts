import { glob } from "glob";
import * as fs from "node:fs";
import * as path from "node:path";

import type { ScriptConfig } from "@/config/schema";
import type { PackageExports, PackageJson } from "@/types/exports";
import type { AnalysisResult } from "@/types/imports";

import { getConfig } from "@/config";

/**
 * Tìm tất cả package.json trong workspace
 */
export async function findAllPackages(config?: ScriptConfig): Promise<string[]> {
  const configObj = config ?? getConfig();

  return await glob(configObj.packagesGlob, {
    ignore: ["**/node_modules/**"],
  });
}

/**
 * Kiểm tra một file có tồn tại không
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Đọc nội dung package.json
 */
export function readPackageJson(filePath: string): null | PackageJson {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading package.json at ${filePath}:`, error);

    return null;
  }
}

/**
 * Tạo bản sao lưu của package.json
 */
export function backupPackageJson(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
    const dir = path.dirname(filePath);
    const backupDir = path.join(dir, ".exports-analysis");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const baseName = path.basename(filePath);
    const backupPath = path.join(backupDir, `${baseName}.backup.${timestamp}`);

    fs.writeFileSync(backupPath, content, "utf8");

    return true;
  } catch (error) {
    console.error(`Error backing up package.json at ${filePath}:`, error);

    return false;
  }
}

/**
 * Lưu package.json với nội dung mới
 */
export function savePackageJson(filePath: string, content: PackageJson): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");

    return true;
  } catch (error) {
    console.error(`Error saving package.json at ${filePath}:`, error);

    return false;
  }
}

/**
 * Lưu cấu trúc exports đã phân tích
 */
export function saveExportsAnalysis(packageDir: string, analysis: AnalysisResult): void {
  const outputDir = path.join(packageDir, ".exports-analysis");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, "exports-analysis.json"), JSON.stringify(analysis, null, 2), "utf8");
}

export function saveExportsPreview(packageDir: string, exports: PackageExports): void {
  const outputDir = path.join(packageDir, ".exports-analysis");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const previewPath = path.join(outputDir, "exports-preview.json");

  fs.writeFileSync(previewPath, JSON.stringify(exports, null, 2), "utf8");
}

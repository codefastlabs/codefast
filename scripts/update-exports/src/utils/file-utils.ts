import { glob } from "glob";
import fs from "node:fs";
import path from "node:path";

import type { ScriptConfig } from "@/types/config";

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
export function readPackageJson(filePath: string): any {
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
    const backupPath = `${filePath}.backup`;

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
export function savePackageJson(filePath: string, content: any): boolean {
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
export function saveExportsAnalysis(packageDir: string, analysis: any): void {
  const outputDir = path.join(packageDir, ".exports-analysis");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, "exports-analysis.json"), JSON.stringify(analysis, null, 2), "utf8");
}

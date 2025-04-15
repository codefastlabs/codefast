import fs from "node:fs";
import path from "node:path";

import type { AnalysisResult, PackageExports, PackageJson } from "@/commands/update-exports/types";

// Constants for file operations
const EXPORTS_ANALYSIS_DIR = ".exports-analysis";
const EXPORTS_PREVIEW_FILE = "exports-preview.json";
const EXPORTS_ANALYSIS_FILE = "exports-analysis.json";
const ENCODING = "utf8";
const JSON_INDENT = 2;
/**
 * Utility functions for file and directory operations
 */
const FileUtils = {
  /**
   * Checks if a file exists
   * @param filePath - Path to check
   * @returns True if a file exists
   */
  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  },

  /**
   * Creates a directory if it doesn't exist
   * @param dirPath - Directory path
   */
  ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  /**
   * Reads and parses a JSON file
   * @param filePath - Path to JSON file
   * @returns Parsed content or null if error
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
   * Writes content to a JSON file
   * @param filePath - Path to write
   * @param content - Content to write
   * @returns True if successful
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
   * Gets the exports analysis directory path
   * @param packageDir - Package directory
   * @returns Analysis directory path
   */
  getAnalysisDir(packageDir: string): string {
    const outputDir = path.join(packageDir, EXPORTS_ANALYSIS_DIR);

    this.ensureDirectoryExists(outputDir);

    return outputDir;
  },

  /**
   * Creates a timestamped backup filename
   * @param baseFilename - Original filename
   * @returns Backup filename with timestamp
   */
  createBackupFilename(baseFilename: string): string {
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");

    return `${baseFilename}.backup.${timestamp}`;
  },
};

/**
 * Checks if a file exists
 * @param filePath - Path to check
 * @returns True if a file exists
 */
export function fileExists(filePath: string): boolean {
  return FileUtils.exists(filePath);
}

/**
 * Reads and parses package.json content
 * @param filePath - Path to package.json
 * @returns Parsed PackageJson or null if error
 */
export function readPackageJson(filePath: string): null | PackageJson {
  return FileUtils.readJsonFile<PackageJson>(filePath);
}

/**
 * Creates a backup of package.json
 * @param filePath - Path to package.json
 * @returns True if backup was successful
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
 * Saves updated package.json content
 * @param filePath - Path to package.json
 * @param content - Updated content
 * @returns True if save was successful
 */
export function savePackageJson(filePath: string, content: PackageJson): boolean {
  return FileUtils.writeJsonFile(filePath, content);
}

/**
 * Saves the given JSON content to a specified file within the analysis directory.
 *
 * @param packageDir - The root directory where the analysis directory resides.
 * @param fileName - The name of the file to which the JSON content will be written.
 * @param content - The JSON content to save to the file.
 */
export function saveJsonToFile<T>(packageDir: string, fileName: string, content: T): void {
  const outputDir = FileUtils.getAnalysisDir(packageDir);

  FileUtils.writeJsonFile(path.join(outputDir, fileName), content);
}

/**
 * Saves exports analysis results
 * @param packageDir - Package directory
 * @param analysis - Analysis results
 */
export function saveExportsAnalysis(packageDir: string, analysis: AnalysisResult): void {
  saveJsonToFile(packageDir, EXPORTS_ANALYSIS_FILE, analysis);
}

/**
 * Saves preview of generated exports
 * @param packageDir - Package directory
 * @param exports - Generated exports
 */
export function saveExportsPreview(packageDir: string, exports: PackageExports): void {
  saveJsonToFile(packageDir, EXPORTS_PREVIEW_FILE, exports);
}

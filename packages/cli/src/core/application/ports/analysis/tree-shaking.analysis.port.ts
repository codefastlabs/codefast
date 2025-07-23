/**
 * Tree Shaking Analysis Service Port
 *
 * Interface for TypeScript tree-shaking analysis following explicit architecture guidelines.
 * This port abstracts tree-shaking specific analysis operations from the infrastructure implementation.
 */

export interface ExportInfo {
  /**
   * Type of export
   */
  type: "default" | "named" | "namespace" | "wildcard";

  /**
   * Export name (for named exports)
   */
  name?: string;

  /**
   * Module specifier (for re-exports)
   */
  moduleSpecifier?: string;

  /**
   * Whether this is a re-export
   */
  isReexport: boolean;

  /**
   * Whether this is a type-only export
   */
  isTypeOnly: boolean;

  /**
   * Line number in the source file
   */
  line: number;

  /**
   * Column number in the source file
   */
  column: number;
}

export interface FileAnalysis {
  /**
   * File path
   */
  filePath: string;

  /**
   * All exports found in the file
   */
  exports: ExportInfo[];

  /**
   * Whether this file only contains re-exports (intermediate file)
   */
  isIntermediateFile: boolean;

  /**
   * Whether this file has any actual implementation
   */
  hasImplementation: boolean;

  /**
   * Re-export depth from this file
   */
  reexportDepth: number;
}

export interface TreeShakingFixOptions {
  /**
   * Target index file to flatten exports to
   */
  targetIndexFile: string;

  /**
   * Whether to remove intermediate files after flattening
   */
  removeIntermediateFiles?: boolean;

  /**
   * Whether to preserve type-only exports separately
   */
  preserveTypeExports?: boolean;

  /**
   * Whether to create backup files before modification
   */
  createBackup?: boolean;
}

export interface ComprehensiveAutoFixOptions {
  /**
   * Whether to create backup files before modification
   */
  createBackup?: boolean;

  /**
   * Whether to preserve type-only exports separately
   */
  preserveTypeExports?: boolean;

  /**
   * Whether to remove intermediate files after flattening
   */
  removeIntermediateFiles?: boolean;

  /**
   * Maximum depth for re-export chains before flagging as an issue
   */
  maxReexportDepth?: number;

  /**
   * Maximum number of wildcard exports before flagging as an issue
   */
  maxWildcardExports?: number;

  /**
   * Whether to show a preview of changes before applying
   */
  preview?: boolean;

  /**
   * Directories to exclude from scanning
   */
  excludeDirectories?: string[];

  /**
   * File patterns to exclude from processing
   */
  excludePatterns?: string[];
}

export interface LeafDirectory {
  /**
   * Full path to the directory
   */
  path: string;

  /**
   * Directory name
   */
  name: string;

  /**
   * TypeScript/JavaScript files in the directory
   */
  files: string[];

  /**
   * Whether the directory has an index.ts file
   */
  hasIndexFile: boolean;

  /**
   * Parent directory path
   */
  parentPath: string;
}

export interface AutoFixPreview {
  /**
   * Files that'll be created
   */
  filesToCreate: string[];

  /**
   * Files that'll be modified
   */
  filesToModify: string[];

  /**
   * Files that'll be deleted
   */
  filesToDelete: string[];

  /**
   * Backup files that'll be created
   */
  backupFiles: string[];

  /**
   * Summary of changes
   */
  summary: {
    indexFilesCreated: number;
    wildcardExportsConverted: number;
    intermediateFilesFlattened: number;
    deepReexportChainsFixed: number;
  };
}

export interface BackupInfo {
  /**
   * Original file path
   */
  originalPath: string;

  /**
   * Backup file path
   */
  backupPath: string;

  /**
   * Timestamp when backup was created
   */
  timestamp: number;

  /**
   * Whether the backup is still valid
   */
  isValid: boolean;
}

export interface TreeShakingAnalysisPort {
  /**
   * Analyze a TypeScript file for export patterns
   */
  analyzeFile: (filePath: string) => Promise<FileAnalysis>;

  /**
   * Analyze multiple files for export patterns
   */
  analyzeFiles: (filePaths: string[]) => Promise<FileAnalysis[]>;

  /**
   * Check if a file is an intermediate index file (only contains re-exports)
   */
  isIntermediateIndexFile: (filePath: string) => Promise<boolean>;

  /**
   * Calculate the re-export depth from a given file
   */
  calculateReexportDepth: (filePath: string, visited?: Set<string>) => Promise<number>;

  /**
   * Get all files that are re-exported from a given file
   */
  getReexportedFiles: (filePath: string) => Promise<string[]>;

  /**
   * Flatten exports from intermediate files to a target index file
   */
  flattenExports: (intermediateFiles: string[], options: TreeShakingFixOptions) => Promise<void>;

  /**
   * Convert wildcard exports to named exports
   */
  convertWildcardToNamed: (filePath: string, moduleSpecifier: string) => string[];

  /**
   * Get all exported symbols from a file
   */
  getExportedSymbols: (filePath: string) => string[];

  /**
   * Check if a file exists and is a TypeScript file
   */
  isTypeScriptFile: (filePath: string) => boolean;

  /**
   * Create a backup of a file before modification
   */
  createBackup: (filePath: string) => string;

  /**
   * Write content to a file
   */
  writeFile: (filePath: string, content: string) => void;

  // Comprehensive Auto-Fix Methods

  /**
   * Scan a directory tree to identify leaf directories that contain modules/components
   */
  scanLeafDirectories: (
    rootPath: string,
    options?: ComprehensiveAutoFixOptions,
  ) => Promise<LeafDirectory[]>;

  /**
   * Create an index.ts file for a leaf directory with proper named exports
   */
  createIndexFileForLeafDirectory: (
    leafDirectory: LeafDirectory,
    options?: ComprehensiveAutoFixOptions,
  ) => string;

  /**
   * Convert wildcard exports to named exports in a file
   */
  convertWildcardExportsToNamed: (filePath: string, options?: ComprehensiveAutoFixOptions) => void;

  /**
   * Generate a preview of comprehensive auto-fix changes
   */
  generateAutoFixPreview: (
    packagePath: string,
    options?: ComprehensiveAutoFixOptions,
  ) => Promise<AutoFixPreview>;

  /**
   * Apply a comprehensive auto-fix to a package
   */
  applyComprehensiveAutoFix: (
    packagePath: string,
    options?: ComprehensiveAutoFixOptions,
  ) => Promise<BackupInfo[]>;

  /**
   * Restore files from backup
   */
  restoreFromBackup: (backupInfos: BackupInfo[]) => void;

  /**
   * Clean up old backup files
   */
  cleanupBackups: (packagePath: string, olderThanDays?: number) => void;

  /**
   * Check if a directory is a leaf directory (contains modules but no subdirectories with modules)
   */
  isLeafDirectory: (directoryPath: string) => boolean;

  /**
   * Get all TypeScript/JavaScript files in a directory (non-recursive)
   */
  getModuleFilesInDirectory: (directoryPath: string) => string[];

  /**
   * Generate index.ts content for a set of module files
   */
  generateIndexContent: (moduleFiles: string[], options?: ComprehensiveAutoFixOptions) => string;

  /**
   * Validate that generated exports are correct and don't break existing functionality
   */
  validateGeneratedExports: (indexFilePath: string, moduleFiles: string[]) => boolean;
}

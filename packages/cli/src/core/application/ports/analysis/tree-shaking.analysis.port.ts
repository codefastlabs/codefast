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
}

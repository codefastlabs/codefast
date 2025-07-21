/**
 * File Finder Service Port
 *
 * Interface for efficient file scanning operations following explicit architecture guidelines.
 * This port abstracts file finding operations from the infrastructure implementation.
 */

export interface FileFinderOptions {
  /**
   * Base directory to search from
   */
  cwd?: string;

  /**
   * Whether to return absolute paths
   */
  absolute?: boolean;

  /**
   * Whether to follow symbolic links
   */
  followSymbolicLinks?: boolean;

  /**
   * Maximum depth to search
   */
  deep?: number;

  /**
   * Whether to include directories in results
   */
  onlyFiles?: boolean;
}

export interface FileFinderServicePort {
  /**
   * Find files matching the given glob patterns
   */
  findFiles: (patterns: string | string[], options?: FileFinderOptions) => Promise<string[]>;

  /**
   * Find files matching the given glob patterns synchronously
   */
  findFilesSync: (patterns: string | string[], options?: FileFinderOptions) => string[];

  /**
   * Check if any files match the given pattern
   */
  hasFiles: (pattern: string, options?: FileFinderOptions) => Promise<boolean>;
}

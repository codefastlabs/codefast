/**
 * File System Service Port
 *
 * Interface for file system operations following explicit architecture guidelines.
 * This port abstracts file system interactions from the infrastructure implementation.
 */

export interface FileSystemService {
  /**
   * Find files matching a glob pattern
   */
  findFiles: (pattern: string, options?: {
    ignore?: string[];
  }) => Promise<string[]>;

  /**
   * Check if a path exists using glob patterns
   */
  pathExists: (pattern: string) => Promise<boolean>;

  /**
   * Format file size in human readable format
   */
  formatFileSize: (bytes: number) => string;

  /**
   * Create a progress indicator for file operations
   */
  createProgressIndicator: (total: number) => {
    increment: () => void;
    finish: () => void;
  };
}

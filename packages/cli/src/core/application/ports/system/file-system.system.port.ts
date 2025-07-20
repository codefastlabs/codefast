/**
 * Filesystem System Port
 *
 * Interface for file system operations following explicit architecture guidelines.
 * This port abstracts file system interactions from the infrastructure implementation.
 */

export interface StatsBase<T> {
  atime: Date;
  atimeMs: T;
  birthtime: Date;
  birthtimeMs: T;
  blksize: T;
  blocks: T;
  ctime: Date;
  ctimeMs: T;
  dev: T;
  gid: T;
  ino: T;
  mode: T;
  mtime: Date;
  mtimeMs: T;
  nlink: T;
  rdev: T;
  size: T;
  uid: T;

  isBlockDevice: () => boolean;
  isCharacterDevice: () => boolean;
  isDirectory: () => boolean;
  isFIFO: () => boolean;
  isFile: () => boolean;
  isSocket: () => boolean;
  isSymbolicLink: () => boolean;
}

export type Stats = StatsBase<number>;

export interface FileSystemSystemPort {
  /**
   * Find files matching a glob pattern
   */
  findFiles: (
    pattern: string,
    options?: {
      ignore?: string[];
    },
  ) => Promise<string[]>;

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

  /**
   * Read file content synchronously
   */
  readFileSync: (path: string, encoding?: BufferEncoding) => string;

  /**
   * Read directory contents synchronously
   */
  readdirSync: (path: string) => string[];

  /**
   * Get file/directory stats synchronously
   */
  statSync: (path: string) => Stats;

  /**
   * Check if a file or directory exists synchronously
   */
  existsSync: (path: string) => boolean;
}

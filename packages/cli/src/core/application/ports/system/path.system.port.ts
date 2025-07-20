/**
 * Path System Port
 *
 * Interface for path operations following explicit architecture guidelines.
 * This port abstracts path operations from the infrastructure implementation.
 */

export interface PathSystemPort {
  /**
   * Join path segments together
   */
  join: (...paths: string[]) => string;

  /**
   * Get the directory name of a path
   */
  dirname: (path: string) => string;

  /**
   * Get the base name of a path
   */
  basename: (path: string, suffix?: string) => string;

  /**
   * Get the extension of a path
   */
  extname: (path: string) => string;

  /**
   * Resolve a path to an absolute path
   */
  resolve: (...paths: string[]) => string;

  /**
   * Get the relative path from one path to another
   */
  relative: (from: string, to: string) => string;

  /**
   * Check if a path is absolute
   */
  isAbsolute: (path: string) => boolean;

  /**
   * Normalize a path
   */
  normalize: (path: string) => string;

  /**
   * Parse a path into its components
   */
  parse: (path: string) => {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  };

  /**
   * Format a path object into a path string
   */
  format: (pathObject: {
    root?: string;
    dir?: string;
    base?: string;
    ext?: string;
    name?: string;
  }) => string;
}

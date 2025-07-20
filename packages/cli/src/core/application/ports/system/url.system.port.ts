/**
 * URL System Port
 *
 * Interface for URL operations following explicit architecture guidelines.
 * This port abstracts URL operations from the infrastructure implementation.
 */

export interface UrlSystemPort {
  /**
   * Convert a file URL to a file path
   */
  fileURLToPath: (url: string | URL) => string;

  /**
   * Convert a file path to a file URL
   */
  pathToFileURL: (path: string) => URL;

  /**
   * Parse a URL string into a URL object
   */
  parse: (urlString: string, base?: string | URL) => URL;

  /**
   * Format a URL object into a URL string
   */
  format: (url: URL) => string;

  /**
   * Resolve a URL relative to a base URL
   */
  resolve: (base: string | URL, relative: string) => string;
}

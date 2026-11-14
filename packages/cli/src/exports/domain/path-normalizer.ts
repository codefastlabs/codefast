import path from "node:path";

/**
 * Converts a path's separators to forward slashes.
 *
 * @since 0.3.16-canary.0
 */
export function normalizePath(pathString: string): string {
  return pathString.split(path.sep).join("/").replace(/\\/g, "/");
}

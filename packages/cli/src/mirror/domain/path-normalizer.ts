import path from "node:path";

/**
 * @since 0.3.16-canary.0
 */
export function normalizePath(pathString: string): string {
  return pathString.split(path.sep).join("/").replace(/\\/g, "/");
}

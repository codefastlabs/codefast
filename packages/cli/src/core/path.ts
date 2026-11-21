import path from "node:path";

/**
 * Converts a native path to POSIX separators, the form every report and allowlist entry uses.
 *
 * @since 0.16.0
 */
export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

/**
 * Returns the POSIX path of `filePath` relative to `rootDir`, or `"."` for the root itself.
 *
 * @since 0.16.0
 */
export function relativePosixPath(rootDir: string, filePath: string): string {
  return toPosixPath(path.relative(rootDir, filePath)) || ".";
}

/**
 * Whether `candidatePath` is `directory` itself or lies beneath it.
 *
 * @since 0.16.0
 */
export function isWithinDirectory(directory: string, candidatePath: string): boolean {
  const relative = path.relative(directory, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem/port";

const defaultSkipDirectoryNames = new Set([
  "node_modules",
  "dist",
  ".git",
  ".turbo",
  ".next",
  ".cache",
  "out",
  "build",
  "coverage",
  ".vercel",
  ".output",
]);

/**
 * @since 0.3.16-canary.0
 */
export function walkTsxFiles(rootDirectoryPath: string, fs: FilesystemPort): string[] {
  const result: string[] = [];
  visitTsxPaths(result, rootDirectoryPath, fs);
  return result;
}

function visitTsxPaths(result: string[], entryPath: string, fs: FilesystemPort): void {
  const entryStats = fs.statSync(entryPath);
  if (entryStats.isDirectory()) {
    for (const childName of fs.readdirSync(entryPath)) {
      if (defaultSkipDirectoryNames.has(childName)) {
        continue;
      }
      visitTsxPaths(result, path.join(entryPath, childName), fs);
    }
    return;
  }
  if (entryPath.endsWith(".d.ts")) {
    return;
  }
  if (entryPath.endsWith(".tsx") || entryPath.endsWith(".ts")) {
    result.push(entryPath);
  }
}

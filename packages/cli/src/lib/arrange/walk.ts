import path from "node:path";
import type { CliFs } from "#lib/infra/fs-contract";

export const DEFAULT_SKIP_DIRS = new Set([
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

export function walkTsxFiles(rootDirectoryPath: string, fs: CliFs): string[] {
  const result: string[] = [];
  const visit = (entryPath: string) => {
    const entryStats = fs.statSync(entryPath);
    if (entryStats.isDirectory()) {
      for (const childName of fs.readdirSync(entryPath)) {
        if (DEFAULT_SKIP_DIRS.has(childName)) continue;
        visit(path.join(entryPath, childName));
      }
      return;
    }
    if (entryPath.endsWith(".d.ts")) return;
    if (entryPath.endsWith(".tsx") || entryPath.endsWith(".ts")) result.push(entryPath);
  };
  visit(rootDirectoryPath);
  return result;
}

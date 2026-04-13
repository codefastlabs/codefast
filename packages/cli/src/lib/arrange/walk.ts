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

export function walkTsxFiles(root: string, fs: CliFs): string[] {
  const result: string[] = [];
  const visit = (entryPath: string) => {
    const entryStats = fs.statSync(entryPath);
    if (entryStats.isDirectory()) {
      for (const name of fs.readdirSync(entryPath)) {
        if (DEFAULT_SKIP_DIRS.has(name)) continue;
        visit(path.join(entryPath, name));
      }
      return;
    }
    if (entryPath.endsWith(".d.ts")) return;
    if (entryPath.endsWith(".tsx") || entryPath.endsWith(".ts")) result.push(entryPath);
  };
  visit(root);
  return result;
}

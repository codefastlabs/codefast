import path from "node:path";
import type { ArrangeFs } from "#lib/arrange/fs-contract";

const SKIP_DIRS = new Set([
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

export function walkTsxFiles(root: string, fs: ArrangeFs): string[] {
  const result: string[] = [];
  const visit = (p: string) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(p)) {
        if (SKIP_DIRS.has(name)) continue;
        visit(path.join(p, name));
      }
      return;
    }
    if (p.endsWith(".tsx") || p.endsWith(".ts")) result.push(p);
  };
  visit(root);
  return result;
}

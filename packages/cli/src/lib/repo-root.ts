import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve the monorepo root (directory containing `pnpm-workspace.yaml`).
 * Tries the compiled package location first, then `process.cwd()`.
 */
export function findRepoRoot(): string {
  const candidates = [path.dirname(fileURLToPath(import.meta.url)), process.cwd()];

  for (const start of candidates) {
    let dir = path.resolve(start);
    for (;;) {
      if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }

  throw new Error("Could not locate monorepo root (missing pnpm-workspace.yaml).");
}

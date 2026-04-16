import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CliFs } from "#lib/infra/fs-contract.port";

/**
 * Resolve the monorepo root (directory containing `pnpm-workspace.yaml`).
 * Tries the compiled package location first, then the provided `startDir`.
 */
export function findRepoRoot(fs: CliFs, startDir: string): string {
  const candidates = [path.dirname(fileURLToPath(import.meta.url)), startDir];

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

  throw new Error(
    `Could not locate monorepo root (missing pnpm-workspace.yaml). Searched from: ${candidates.join(", ")}`,
  );
}

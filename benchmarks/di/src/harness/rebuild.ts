/** Rebuilds `@codefast/di` from `src`, so a pass measures the tree it runs in rather than a stale `dist`. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CODEFAST_DI } from "#harness/config";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Rebuilds the subject package and returns the wall time it took, in milliseconds.
 *
 * @since 0.10.4
 */
export function rebuildCodefastDiPackage(): number {
  console.log(`Rebuilding ${CODEFAST_DI.libraryName} before bench…`);
  const startedAtMs = performance.now();
  const result = spawnSync("pnpm", ["--filter", CODEFAST_DI.libraryName, "build"], {
    cwd: packageRootDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error(`Build failed for ${CODEFAST_DI.libraryName}, exit ${String(result.status)}`);
  }
  const elapsedMs = performance.now() - startedAtMs;
  console.log(`Finished rebuild of ${CODEFAST_DI.libraryName} (${(elapsedMs / 1000).toFixed(1)}s wall).`);
  return elapsedMs;
}

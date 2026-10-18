/** Rebuilds a suite's subject from `src`, so a pass measures the tree it runs in rather than a stale `dist`. */
import { spawnSync } from "node:child_process";

/**
 * Rebuilds the named workspace package and returns the wall time it took, in milliseconds.
 *
 * @throws Error when pnpm cannot be run or the build fails.
 */
export function rebuildSubjectPackage(libraryName: string, cwd: string): number {
  console.log(`Rebuilding ${libraryName} before bench…`);
  const startedAtMs = performance.now();
  const result = spawnSync("pnpm", ["--filter", libraryName, "build"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  if (result.error !== undefined) {
    throw new Error(`Build failed for ${libraryName}: pnpm could not be run (${result.error.message})`, {
      cause: result.error,
    });
  }
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    const outcome = result.signal === null ? `exit ${String(result.status)}` : `signal ${result.signal}`;
    throw new Error(`Build failed for ${libraryName}, ${outcome}`);
  }
  const elapsedMs = performance.now() - startedAtMs;
  console.log(`Finished rebuild of ${libraryName} (${(elapsedMs / 1000).toFixed(1)}s wall).`);
  return elapsedMs;
}

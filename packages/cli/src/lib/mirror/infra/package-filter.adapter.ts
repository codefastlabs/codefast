import { realpathSync } from "node:fs";
import path from "node:path";
import { normalizePath } from "#lib/mirror/infra/path-normalizer.adapter";

function tryRealpath(entryPath: string): string {
  try {
    return realpathSync.native(entryPath);
  } catch {
    return path.resolve(entryPath);
  }
}

/**
 * Resolve `packageFilter` to a POSIX-ish path relative to `rootDir`, without using
 * `process.cwd()`. Use for programmatic `runMirrorSync` calls.
 *
 * @throws If the resolved path is not a strict subdirectory of `rootDir`.
 */
export function resolvePackageFilterUnderRoot(rootDir: string, packageFilter: string): string {
  const rootResolved = path.resolve(rootDir);
  const rootReal = tryRealpath(rootResolved);
  const resolved = path.isAbsolute(packageFilter)
    ? tryRealpath(path.resolve(packageFilter))
    : tryRealpath(path.join(rootReal, packageFilter));
  const rel = path.relative(rootReal, resolved);
  const normalized = normalizePath(rel);
  if (
    normalized.startsWith("..") ||
    path.isAbsolute(normalized) ||
    normalized === "" ||
    normalized === "."
  ) {
    throw new Error(`Package path must be a subdirectory under monorepo root: ${rootDir}`);
  }
  return normalized;
}

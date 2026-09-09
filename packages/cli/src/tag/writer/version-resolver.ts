import type { Filesystem } from "#/core/filesystem/filesystem";
import { findNearestPackageVersion } from "#/core/workspace/package-version";

/**
 * Returns the `version` of the nearest enclosing `package.json` above a target path.
 *
 * @since 0.3.16-canary.0
 */
export function resolveNearestPackageVersion(fs: Filesystem, targetPath: string): string {
  const version = findNearestPackageVersion(fs, targetPath);
  if (version === null) {
    throw new Error(`Unable to resolve a package version from target: ${targetPath}`);
  }

  return version;
}

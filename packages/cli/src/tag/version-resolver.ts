import type { FilesystemPort } from "#/core/filesystem/port";
import { findNearestPackageVersion } from "#/core/workspace/package-version";

/**
 * Returns the `version` of the nearest enclosing `package.json` above a target path.
 *
 * @since 0.3.16-canary.0
 */
export function resolveNearestPackageVersion(fs: FilesystemPort, targetPath: string): string {
  const version = findNearestPackageVersion(fs, targetPath);
  if (version === null) {
    throw new Error(`Unable to resolve a package version from target: ${targetPath}`);
  }

  return version;
}

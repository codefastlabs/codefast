import path from "node:path";

import type { Filesystem } from "#/core/filesystem/filesystem";
import { findNearestAncestor } from "#/core/workspace/ancestor-directories";
import { packageJsonFileName } from "#/core/workspace/well-known-files";

/**
 * Finds the `version` of the nearest enclosing `package.json`, or null when the first
 * one found declares none (the private workspace root is version-less by design).
 *
 * @since 0.8.0
 */
function findNearestPackageVersion(fs: Filesystem, targetPath: string): string | null {
  const resolved = path.resolve(targetPath);
  const startDirectory = fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);

  const packageDirectory = findNearestAncestor(startDirectory, (directoryPath) =>
    fs.existsSync(path.join(directoryPath, packageJsonFileName)),
  );
  if (packageDirectory === undefined) {
    return null;
  }

  const version = (
    JSON.parse(fs.readFileSync(path.join(packageDirectory, packageJsonFileName), "utf8")) as { version?: unknown }
  ).version;

  return typeof version === "string" && version.length > 0 ? version : null;
}

export { findNearestPackageVersion };

import path from "node:path";

import type { FilesystemPort } from "#/core/filesystem/port";

/**
 * Finds the `version` of the nearest enclosing `package.json`, or null when the first
 * one found declares none (the private workspace root is version-less by design).
 *
 * @since 0.8.0
 */
function findNearestPackageVersion(fs: FilesystemPort, targetPath: string): string | null {
  const resolved = path.resolve(targetPath);
  let current = fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);

  while (true) {
    const packageJsonPath = path.join(current, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const version = (JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: unknown }).version;

      return typeof version === "string" && version.length > 0 ? version : null;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export { findNearestPackageVersion };

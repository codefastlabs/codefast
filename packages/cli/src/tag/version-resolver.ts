import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem/port";

const packageJsonFileName = "package.json";

/**
 * @since 0.3.16-canary.0
 */
export function resolveNearestPackageVersion(fs: FilesystemPort, targetPath: string): string {
  const resolved = path.resolve(targetPath);
  const startDir = fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);

  let current = startDir;
  while (true) {
    const packageJsonPath = path.join(current, packageJsonFileName);
    if (fs.existsSync(packageJsonPath)) {
      const raw = fs.readFileSync(packageJsonPath, "utf8");
      const version = (JSON.parse(raw) as { version?: unknown }).version;
      if (typeof version === "string" && version.length > 0) {
        return version;
      }
      throw new Error(`Missing or invalid version in ${packageJsonPath}`);
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error(`Unable to locate ${packageJsonFileName} from target: ${targetPath}`);
}

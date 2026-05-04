import { readFileSync } from "node:fs";
import { arch as osArch, cpus, platform as osPlatform } from "node:os";
import { join } from "node:path";

import type { Fingerprint } from "#/shared/protocol";

/**
 * Reads the version of a dependency from `<workspacePackageRoot>/node_modules/<name>/package.json`.
 * Uses the consuming benchmark workspace root (the package whose `pnpm` install placed the libs),
 * so the resolved version reflects the lockfile the bench actually ran against.
 */
function readLibraryVersion(libraryName: string, workspacePackageRoot: string): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(workspacePackageRoot, "node_modules", libraryName, "package.json"), "utf8"),
    ) as { version?: string };
    return packageJson.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Collects Node / V8 / platform / library information to stamp on every
 * subprocess payload. Called once at the start of each bench subprocess.
 * 
 * @param libraryName Dependency name keys `node_modules` (e.g. `@codefast/di`, `inversify`).
 * @param workspacePackageRoot Absolute path to the benchmark package root (directory with `package.json`).
 *
 * @since 0.3.16-canary.0
 */
export function collectFingerprint(libraryName: string, workspacePackageRoot: string): Fingerprint {
  const cpuList = cpus();
  const firstCpu = cpuList[0];
  return {
    nodeVersion: process.versions.node,
    v8Version: process.versions.v8,
    platform: osPlatform(),
    arch: osArch(),
    cpuModel: firstCpu?.model ?? "unknown",
    cpuCount: cpuList.length,
    nodeOptions: process.env["NODE_OPTIONS"] ?? "",
    libraryName,
    libraryVersion: readLibraryVersion(libraryName, workspacePackageRoot),
    gcExposed: typeof globalThis.gc === "function",
    timestampIso: new Date().toISOString(),
  };
}

import { arch as osArch, cpus, platform as osPlatform } from "node:os";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Fingerprint } from "./protocol";

/**
 * Reads the version of a dependency from the benchmark package's
 * `node_modules/<name>/package.json`. Used to pin the exact inversify /
 * codefast build in every output record, so comparisons across runs remain
 * meaningful even after a dependency bump.
 */
function readLibraryVersion(libraryName: string): string {
  const benchPackageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    const packageJson = JSON.parse(
      readFileSync(join(benchPackageRoot, "node_modules", libraryName, "package.json"), "utf8"),
    ) as { version?: string };
    return packageJson.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Collects Node / V8 / platform / library information to stamp on every
 * subprocess payload. Called once at the start of each bench subprocess.
 */
export function collectFingerprint(libraryName: string): Fingerprint {
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
    libraryVersion: readLibraryVersion(libraryName),
    gcExposed: typeof globalThis.gc === "function",
    timestampIso: new Date().toISOString(),
  };
}

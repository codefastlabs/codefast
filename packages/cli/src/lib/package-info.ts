import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface PackageInfo {
  name: string;
  version: string;
}

export function getPackageInfo(): PackageInfo {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJsonPath = resolve(__dirname, "../package.json");

  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageInfo;
}

export function getPackageVersion(): string {
  return getPackageInfo().version;
}

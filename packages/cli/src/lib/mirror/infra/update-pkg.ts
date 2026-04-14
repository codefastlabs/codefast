import type { CliFs } from "#lib/infra/fs-contract";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import { MirrorError, MirrorErrorCode } from "#lib/mirror/domain/errors";
import type { ExportMapData, PackageJsonShape } from "#lib/mirror/domain/types";

/** Shared rule: show `package.json#name` when it is a non-empty string; else folder basename. */
export function resolvePackageDisplayName(
  packageJson: { name?: unknown },
  folderBasename: string,
): string {
  const declaredName = packageJson.name;
  return typeof declaredName === "string" && declaredName.length > 0
    ? declaredName
    : folderBasename;
}

export async function readPackageJsonDisplayName(
  fs: CliFs,
  packageJsonPath: string,
  folderBasename: string,
): Promise<string> {
  if (!fs.existsSync(packageJsonPath)) {
    return folderBasename;
  }
  try {
    const raw = await fs.readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { name?: unknown };
    return resolvePackageDisplayName(parsed, folderBasename);
  } catch {
    return folderBasename;
  }
}

/**
 * Writes `exports` into `package.json` via a temp file + rename (atomic on same volume).
 * Preserves a trailing newline after JSON.
 */
export async function writePackageJsonExportsAtomic(
  fs: CliFs,
  packageJsonPath: string,
  nextExports: ExportMapData,
): Promise<void> {
  const raw = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(raw) as PackageJsonShape;
  packageJson.exports = nextExports;
  const serialized = JSON.stringify(packageJson, null, 2) + "\n";

  const tmpPath = `${packageJsonPath}.tmp`;
  await fs.writeFile(tmpPath, serialized, "utf8");

  try {
    await fs.rename(tmpPath, packageJsonPath);
  } catch (caughtRenameError: unknown) {
    await fs.unlink(tmpPath).catch(() => {});
    throw new MirrorError(
      MirrorErrorCode.PACKAGE_WRITE,
      `Failed to atomically update ${packageJsonPath}: ${messageFromCaughtUnknown(caughtRenameError)}`,
      caughtRenameError instanceof Error ? { cause: caughtRenameError } : undefined,
    );
  }
}

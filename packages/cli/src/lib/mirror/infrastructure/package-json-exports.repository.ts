import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#/lib/core/domain/caught-unknown-message.value-object";
import { MirrorError, MirrorErrorCode } from "#/lib/mirror/domain/errors.domain";
import type {
  ExportMapData,
  ExportOriginalPathBySpecifier,
  PackageJsonShape,
} from "#/lib/mirror/domain/types.domain";
import { PACKAGE_JSON_EXPORT } from "#/lib/mirror/domain/constants.domain";

function containsDistTarget(value: unknown): boolean {
  if (typeof value === "string") {
    return value.startsWith("./dist/");
  }
  if (Array.isArray(value)) {
    return value.some((entryValue) => containsDistTarget(entryValue));
  }
  if (value && typeof value === "object") {
    return Object.values(value).some((entryValue) => containsDistTarget(entryValue));
  }
  return false;
}

/**
 * Keep `./package.json` at the very end for aesthetics by default.
 * If a catch-all `./*` exists, move `./package.json` before wildcards so it remains reachable.
 */
function exportSpecifierRank(exportSpecifier: string, hasCatchAllWildcard: boolean): number {
  if (exportSpecifier === ".") {
    return 0;
  }
  if (exportSpecifier === PACKAGE_JSON_EXPORT) {
    return hasCatchAllWildcard ? 2 : 4;
  }
  if (exportSpecifier.includes("*")) {
    return 3;
  }
  return 1;
}

function compareExportSpecifiers(
  leftSpecifier: string,
  rightSpecifier: string,
  originalPathBySpecifier: ExportOriginalPathBySpecifier,
  hasCatchAllWildcard: boolean,
): number {
  const leftRank = exportSpecifierRank(leftSpecifier, hasCatchAllWildcard);
  const rightRank = exportSpecifierRank(rightSpecifier, hasCatchAllWildcard);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  const leftOriginalPath = originalPathBySpecifier[leftSpecifier] ?? leftSpecifier;
  const rightOriginalPath = originalPathBySpecifier[rightSpecifier] ?? rightSpecifier;
  const originalPathComparison = leftOriginalPath.localeCompare(rightOriginalPath);
  if (originalPathComparison !== 0) {
    return originalPathComparison;
  }
  return leftSpecifier.localeCompare(rightSpecifier);
}

/**
 * Writes `exports` into `package.json` via a temp file + rename (atomic on same volume).
 * Preserves a trailing newline after JSON.
 */
export async function writePackageJsonExportsAtomic(
  fs: CliFs,
  packageJsonPath: string,
  mergeInput: {
    generatedExports: ExportMapData;
    managedExportSpecifiers: string[];
    originalPathBySpecifier: ExportOriginalPathBySpecifier;
  },
): Promise<{ prunedKeys: string[] }> {
  const raw = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(raw) as PackageJsonShape;

  const existingExports = packageJson.exports;
  const existingExportMap =
    existingExports && typeof existingExports === "object" && !Array.isArray(existingExports)
      ? (existingExports as Record<string, unknown>)
      : {};

  const managedSpecifiers = new Set(mergeInput.managedExportSpecifiers);
  const originalPathBySpecifier: ExportOriginalPathBySpecifier = {
    ...mergeInput.originalPathBySpecifier,
  };
  const mergedExportMap: Record<string, unknown> = {};
  const prunedKeys: string[] = [];

  // Preserve unmanaged manual entries; drop unmanaged stale entries targeting dist/.
  for (const [exportSpecifier, exportValue] of Object.entries(existingExportMap)) {
    if (exportSpecifier === PACKAGE_JSON_EXPORT) {
      mergedExportMap[exportSpecifier] = exportValue;
      if (!(exportSpecifier in originalPathBySpecifier)) {
        originalPathBySpecifier[exportSpecifier] = exportSpecifier;
      }
      continue;
    }
    if (!managedSpecifiers.has(exportSpecifier)) {
      if (containsDistTarget(exportValue)) {
        prunedKeys.push(exportSpecifier);
      } else {
        mergedExportMap[exportSpecifier] = exportValue;
        if (!(exportSpecifier in originalPathBySpecifier)) {
          originalPathBySpecifier[exportSpecifier] = exportSpecifier;
        }
      }
    }
  }

  // Generated entries always win for managed specifiers (including ".").
  for (const [exportSpecifier, exportValue] of Object.entries(mergeInput.generatedExports)) {
    mergedExportMap[exportSpecifier] = exportValue;
  }

  if (!(PACKAGE_JSON_EXPORT in mergedExportMap)) {
    mergedExportMap[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT;
  }
  originalPathBySpecifier[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT;

  const rootExport = mergedExportMap["."];
  if (rootExport && typeof rootExport === "object" && !Array.isArray(rootExport)) {
    const rootEntry = rootExport as Record<string, unknown>;
    const requirePath = typeof rootEntry.require === "string" ? rootEntry.require : undefined;
    const importPath = typeof rootEntry.import === "string" ? rootEntry.import : undefined;
    const typesPath = typeof rootEntry.types === "string" ? rootEntry.types : undefined;

    if (requirePath || importPath) {
      packageJson.main = requirePath ?? importPath;
    }
    if (importPath && importPath.endsWith(".mjs")) {
      packageJson.module = importPath;
    }
    if (typesPath) {
      packageJson.types = typesPath;
    }
  }

  const filesField = packageJson.files;
  if (Array.isArray(filesField)) {
    const normalizedFiles = filesField.filter(
      (entry): entry is string => typeof entry === "string",
    );
    if (!normalizedFiles.includes("dist")) {
      normalizedFiles.push("dist");
    }
    packageJson.files = normalizedFiles;
  } else {
    packageJson.files = ["dist"];
  }

  const sortedExportMap: Record<string, unknown> = {};
  const hasCatchAllWildcard = "./*" in mergedExportMap;
  for (const exportSpecifier of Object.keys(mergedExportMap).sort((leftSpecifier, rightSpecifier) =>
    compareExportSpecifiers(
      leftSpecifier,
      rightSpecifier,
      originalPathBySpecifier,
      hasCatchAllWildcard,
    ),
  )) {
    sortedExportMap[exportSpecifier] = mergedExportMap[exportSpecifier];
  }

  packageJson.exports = sortedExportMap;
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

  return { prunedKeys };
}

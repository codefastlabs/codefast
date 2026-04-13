import type { CliLogger } from "#lib/infra/fs-contract";
import type { MirrorPackageMeta } from "#lib/mirror/types";

export const MIRROR_CONFIG_KEYS = {
  CSS_EXPORTS: "cssExports",
  CUSTOM_EXPORTS: "customExports",
  PATH_TRANSFORMATIONS: "pathTransformations",
  SKIP_PACKAGES: "skipPackages",
} as const;

export type MirrorConfigKey = (typeof MIRROR_CONFIG_KEYS)[keyof typeof MIRROR_CONFIG_KEYS];

function formatPathKeyDeprecationWarning(
  pkgMeta: MirrorPackageMeta,
  configKeyName: MirrorConfigKey,
): string {
  const { relPath, packageName } = pkgMeta;
  return `[Deprecation Warning] Path-based configuration key "${relPath}" for "${configKeyName}" is deprecated and will be removed in the future. Please migrate to using the package name "${packageName}".`;
}

function logPathKeyDeprecation(
  pkgMeta: MirrorPackageMeta,
  configKeyName: MirrorConfigKey,
  logger?: CliLogger,
): void {
  const warning = formatPathKeyDeprecationWarning(pkgMeta, configKeyName);
  logger?.out(warning);
}

function findMatchingKey(
  keysToMatch: string[],
  pkgMeta: MirrorPackageMeta,
  configKeyName: MirrorConfigKey,
  logger?: CliLogger,
): string | undefined {
  if (keysToMatch.includes(pkgMeta.packageName)) {
    return pkgMeta.packageName;
  }
  if (keysToMatch.includes(pkgMeta.relPath)) {
    logPathKeyDeprecation(pkgMeta, configKeyName, logger);
    return pkgMeta.relPath;
  }
  return undefined;
}

export function resolvePackageScopedConfig<T>(
  configMap: Record<string, T> | undefined,
  pkgMeta: MirrorPackageMeta,
  configKeyName: MirrorConfigKey,
  logger?: CliLogger,
): T | undefined {
  if (!configMap) return undefined;

  const matchedKey = findMatchingKey(Object.keys(configMap), pkgMeta, configKeyName, logger);
  return matchedKey ? configMap[matchedKey] : undefined;
}

export function isPackageSkipped(
  skipPackagesArray: string[] | undefined,
  pkgMeta: MirrorPackageMeta,
  logger?: CliLogger,
): boolean {
  if (!skipPackagesArray) return false;

  return !!findMatchingKey(skipPackagesArray, pkgMeta, MIRROR_CONFIG_KEYS.SKIP_PACKAGES, logger);
}

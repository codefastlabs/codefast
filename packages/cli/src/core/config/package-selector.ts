import picomatch from "picomatch";

/**
 * Returns the entry a per-package config record holds for a package: its exact name first, else the first glob key
 * that matches it, else `undefined`.
 */
export function selectPackageConfig<Value>(
  record: Readonly<Record<string, Value>> | undefined,
  packageName: string,
): Value | undefined {
  if (record === undefined) {
    return undefined;
  }
  if (Object.hasOwn(record, packageName)) {
    return record[packageName];
  }
  for (const [selector, value] of Object.entries(record)) {
    if (picomatch.scan(selector).isGlob && picomatch.isMatch(packageName, selector)) {
      return value;
    }
  }
  return undefined;
}

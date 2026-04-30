/**
 * Domain rule: prefer `package.json#name` when it is present, otherwise use folder basename.
 */
export function resolvePackageDisplayName(
  packageJson: { name?: unknown },
  folderBasename: string,
): string {
  const declaredName = packageJson.name;
  return typeof declaredName === "string" && declaredName.length > 0
    ? declaredName
    : folderBasename;
}

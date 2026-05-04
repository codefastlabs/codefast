/**
 * Domain rule: prefer `package.json#name` when it is present, otherwise use folder basename.
 *
 * @since 0.3.16-canary.0
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

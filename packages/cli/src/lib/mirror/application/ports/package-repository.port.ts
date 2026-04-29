import type {
  ExportMapData,
  ExportOriginalPathBySpecifier,
  PackageJsonShape,
} from "#/lib/mirror/domain/types.domain";

export interface PackageRepositoryPort {
  resolvePackageDisplayName(packageJson: { name?: unknown }, folderBasename: string): string;
  writePackageJsonExportsAtomic(
    packageJsonPath: string,
    mergeInput: {
      generatedExports: ExportMapData;
      managedExportSpecifiers: string[];
      originalPathBySpecifier: ExportOriginalPathBySpecifier;
    },
  ): Promise<{ prunedKeys: string[] }>;
  parsePackageJsonShape(rawPackageJson: unknown): PackageJsonShape;
}

import type { CliFs } from "#lib/core/application/ports/cli-io.port";
import type {
  ExportMapData,
  ExportOriginalPathBySpecifier,
  PackageJsonShape,
} from "#lib/mirror/domain/types.domain";

export interface PackageRepositoryPort {
  resolvePackageDisplayName(packageJson: { name?: unknown }, folderBasename: string): string;
  writePackageJsonExportsAtomic(
    fs: CliFs,
    packageJsonPath: string,
    mergeInput: {
      generatedExports: ExportMapData;
      managedExportSpecifiers: string[];
      originalPathBySpecifier: ExportOriginalPathBySpecifier;
    },
  ): Promise<{ prunedKeys: string[] }>;
  parsePackageJsonShape(rawPackageJson: unknown): PackageJsonShape;
}

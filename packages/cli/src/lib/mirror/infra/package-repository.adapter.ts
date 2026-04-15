import type { CliFs } from "#lib/infra/fs-contract.port";
import type { PackageRepositoryPort } from "#lib/mirror/application/ports/package-repository.port";
import type {
  ExportMapData,
  ExportOriginalPathBySpecifier,
  PackageJsonShape,
} from "#lib/mirror/domain/types.domain";
import {
  resolvePackageDisplayName,
  writePackageJsonExportsAtomic,
} from "#lib/mirror/infra/update-pkg.adapter";

export class PackageRepositoryAdapter implements PackageRepositoryPort {
  resolvePackageDisplayName(packageJson: { name?: unknown }, folderBasename: string): string {
    return resolvePackageDisplayName(packageJson, folderBasename);
  }

  writePackageJsonExportsAtomic(
    fs: CliFs,
    packageJsonPath: string,
    mergeInput: {
      generatedExports: ExportMapData;
      managedExportSpecifiers: string[];
      originalPathBySpecifier: ExportOriginalPathBySpecifier;
    },
  ): Promise<{ prunedKeys: string[] }> {
    return writePackageJsonExportsAtomic(fs, packageJsonPath, mergeInput);
  }

  parsePackageJsonShape(rawPackageJson: unknown): PackageJsonShape {
    if (
      rawPackageJson === null ||
      typeof rawPackageJson !== "object" ||
      Array.isArray(rawPackageJson)
    ) {
      throw new SyntaxError("package.json root must be a JSON object");
    }
    return rawPackageJson as PackageJsonShape;
  }
}

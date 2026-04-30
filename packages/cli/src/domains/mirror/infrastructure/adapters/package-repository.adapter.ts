import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import { CliFsToken } from "#/shell/application/cli-runtime.tokens";
import type { PackageRepositoryPort } from "#/domains/mirror/application/ports/package-repository.port";
import type {
  ExportMapData,
  ExportOriginalPathBySpecifier,
  PackageJsonShape,
} from "#/domains/mirror/domain/types.domain";
import { resolvePackageDisplayName } from "#/domains/mirror/domain/package-display-name.policy";
import { writePackageJsonExportsAtomic } from "#/domains/mirror/infrastructure/package-json-exports.repository";

@injectable([inject(CliFsToken)])
export class PackageRepositoryAdapter implements PackageRepositoryPort {
  constructor(private readonly fs: CliFs) {}

  resolvePackageDisplayName(packageJson: { name?: unknown }, folderBasename: string): string {
    return resolvePackageDisplayName(packageJson, folderBasename);
  }

  writePackageJsonExportsAtomic(
    packageJsonPath: string,
    mergeInput: {
      generatedExports: ExportMapData;
      managedExportSpecifiers: string[];
      originalPathBySpecifier: ExportOriginalPathBySpecifier;
    },
  ): Promise<{ prunedKeys: string[] }> {
    return writePackageJsonExportsAtomic(this.fs, packageJsonPath, mergeInput);
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

import { inject, injectable } from "@codefast/di";
import type { MirrorConfig } from "#/domains/config/domain/schema.domain";
import type { FilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { CliPathPort } from "#/shell/application/ports/outbound/cli-path.port";
import { CliFilesystemPortToken, CliPathPortToken } from "#/shell/application/cli-runtime.tokens";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import {
  createPathTransform,
  generateExports,
} from "#/domains/mirror/domain/generate-mirror-exports.domain-service";
import type { FileSystemServicePort } from "#/domains/mirror/application/ports/outbound/file-system-service.port";
import type { PackageRepositoryPort } from "#/domains/mirror/application/ports/outbound/package-repository.port";
import type { SyncWorkspacePackagePort } from "#/domains/mirror/application/ports/outbound/sync-workspace-package.port";
import { DIST_DIR, PACKAGE_JSON } from "#/domains/mirror/domain/constants.domain";
import type {
  MirrorPackageMeta,
  PackageJsonShape,
  PackageStats,
} from "#/domains/mirror/domain/types.domain";
import {
  FileSystemServicePortToken,
  PackageRepositoryPortToken,
} from "#/domains/mirror/composition/tokens";

@injectable([
  inject(CliFilesystemPortToken),
  inject(CliPathPortToken),
  inject(PackageRepositoryPortToken),
  inject(FileSystemServicePortToken),
])
export class SyncWorkspacePackageAdapter implements SyncWorkspacePackagePort {
  constructor(
    private readonly fs: FilesystemPort,
    private readonly pathService: CliPathPort,
    private readonly packageRepository: PackageRepositoryPort,
    private readonly fileSystemService: FileSystemServicePort,
  ) {}

  async syncExportsForWorkspacePackage(
    rootDir: string,
    packagePathStr: string,
    config: MirrorConfig,
  ): Promise<PackageStats> {
    const packageDir = this.pathService.resolve(rootDir, packagePathStr);
    const distDir = this.pathService.join(packageDir, DIST_DIR);
    const packageJsonPath = this.pathService.join(packageDir, PACKAGE_JSON);
    const folderBasename = this.pathService.basename(packageDir);

    const pkgStats: PackageStats = {
      name: folderBasename,
      path: packageDir,
      jsModules: 0,
      cssExports: 0,
      customExports: 0,
      totalExports: 0,
      hasTransform: false,
      cssConfigStatus: "",
      skipped: false,
      skipReason: "",
      error: null,
      prunedExportKeys: [],
    };

    if (!this.fs.existsSync(packageJsonPath)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "package.json not found";
      return pkgStats;
    }

    let packageJsonParseError: unknown;
    try {
      const packageContent = await this.fs.readFile(packageJsonPath, "utf8");
      const rawPackageJson = JSON.parse(packageContent) as unknown;
      const parsedPackageJson = this.packageRepository.parsePackageJsonShape(
        rawPackageJson,
      ) as PackageJsonShape;
      pkgStats.name = this.packageRepository.resolvePackageDisplayName(
        parsedPackageJson,
        folderBasename,
      );
    } catch (caughtError: unknown) {
      pkgStats.name = folderBasename;
      packageJsonParseError = caughtError;
    }

    const packageMeta: MirrorPackageMeta = { packageName: pkgStats.name };

    if (this.isPackageSkipped(config.skipPackages, packageMeta)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "configured to skip";
      return pkgStats;
    }

    if (packageJsonParseError !== undefined) {
      if (!this.fs.existsSync(distDir)) {
        pkgStats.skipped = true;
        pkgStats.skipReason = "dist/ not found";
        return pkgStats;
      }
      pkgStats.error = messageFromCaughtUnknown(packageJsonParseError);
      return pkgStats;
    }

    if (!this.fs.existsSync(distDir)) {
      pkgStats.skipped = true;
      pkgStats.skipReason = "dist/ not found";
      return pkgStats;
    }

    try {
      const pathTransform = createPathTransform(config, packageMeta);
      pkgStats.hasTransform = !!pathTransform;

      const cssConfig = this.resolvePackageScopedConfig(config.cssExports, packageMeta);
      if (cssConfig === false) {
        pkgStats.cssConfigStatus = "disabled";
      } else if (cssConfig !== undefined) {
        pkgStats.cssConfigStatus = "configured";
      }

      const customExports =
        this.resolvePackageScopedConfig(config.customExports, packageMeta) || {};

      const generatedExports = await generateExports(
        this.pathService,
        this.fileSystemService,
        distDir,
        pathTransform,
        cssConfig,
        customExports,
      );

      const { prunedKeys } = await this.packageRepository.writePackageJsonExportsAtomic(
        packageJsonPath,
        {
          generatedExports: generatedExports.exports,
          managedExportSpecifiers: Object.keys(generatedExports.exports),
          originalPathBySpecifier: generatedExports.originalPathBySpecifier,
        },
      );

      pkgStats.jsModules = generatedExports.jsCount;
      pkgStats.cssExports = generatedExports.cssCount;
      pkgStats.customExports = Object.keys(customExports).length;
      pkgStats.totalExports = Object.keys(generatedExports.exports).length;
      pkgStats.prunedExportKeys = prunedKeys;
    } catch (caughtError: unknown) {
      pkgStats.error = messageFromCaughtUnknown(caughtError);
    }

    return pkgStats;
  }

  private resolvePackageScopedConfig<Value>(
    configMap: Record<string, Value> | undefined,
    packageMeta: MirrorPackageMeta,
  ): Value | undefined {
    if (!configMap) {
      return undefined;
    }
    return configMap[packageMeta.packageName];
  }

  private isPackageSkipped(
    skipPackagesList: string[] | undefined,
    packageMeta: MirrorPackageMeta,
  ): boolean {
    return !!skipPackagesList?.includes(packageMeta.packageName);
  }
}

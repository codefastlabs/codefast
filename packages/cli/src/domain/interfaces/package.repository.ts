import type { AnalysisResult, PackageConfig, PackageExports, ScriptConfig } from "@/domain/entities/package-config";

/**
 * Interface for package repository operations, including finding packages and updating exports.
 */
export interface PackageRepository {
  analyzeImports: (indexFilePath: string, packageConfig: PackageConfig) => AnalysisResult;
  findAllPackages: (configPath?: string) => Promise<string[]>;
  generateExports: (
    packageName: string,
    imports: AnalysisResult["imports"],
    existingExports: PackageExports,
    config: ScriptConfig,
  ) => PackageExports;
  processPackage: (
    packageJsonPath: string,
    options: {
      dryRun: boolean;
      configPath?: string;
      packageFilter?: string;
    },
  ) => boolean;
}

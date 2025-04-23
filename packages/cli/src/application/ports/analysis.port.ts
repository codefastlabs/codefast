import type { AnalysisResult, PackageConfig } from "@/domain/entities/package-config";

/**
 * Port for analyzing imports in source files.
 */
export interface AnalysisPort {
  analyzeImports: (indexFilePath: string, packageConfig: PackageConfig) => AnalysisResult;
}

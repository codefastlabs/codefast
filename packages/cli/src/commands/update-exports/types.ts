import { z } from "zod";

// Schema for package configuration, defining output patterns and paths
export const PackageConfigSchema = z.interface({
  // Output path pattern for CommonJS (CJS) modules
  // Example: "dist/cjs/*.js" specifies where CJS files are emitted
  cjsOutputPattern: z.string(),
  // Output path pattern for ES Modules (ESM)
  // Example: "dist/esm/*.js" specifies where ESM files are emitted
  esmOutputPattern: z.string(),
  // Path to the package.json file
  // Used to read or update package metadata (e.g., version, exports)
  packageJsonPath: z.string(),
  // Path to the src/index.ts file
  // Main entry point for analyzing exports or building the package
  srcIndexPath: z.string(),
  // Output path pattern for CJS type definitions
  // Example: "dist/cjs/*.d.ts" for CJS-compatible type definitions
  typesOutputCjsPattern: z.string(),
  // General output path pattern for type definitions
  // Example: "dist/types/*.d.ts" for type definitions used by both CJS and ESM
  typesOutputPattern: z.string(),
  // Optional prefixes to strip from export paths
  // Example: ["components"] removes "components" from export paths
  "exportPathPrefixesToRemove?": z.array(z.string()),
});

// Schema for script configuration, defining package discovery and defaults
export const ScriptConfigSchema = z.interface({
  // Custom configurations for specific packages
  // Key is the package name, value is a partial override of defaultPackageConfig
  // Example: { "my-package": { cjsOutputPattern: "dist/custom/*.js" } }
  customPackageConfigs: z.record(z.string(), PackageConfigSchema.partial()),
  // Default configuration applied to all packages
  // Ensures consistent settings unless overridden
  defaultPackageConfig: PackageConfigSchema,
  // Glob pattern to locate packages in the project
  // Example: "packages/*" finds all package folders under packages/
  packagesGlob: z.string(),
});

// TypeScript type inferred from schemas for type safety
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type ScriptConfig = z.infer<typeof ScriptConfigSchema>;

// Interface for import path metadata
export interface ImportPath {
  // Directory containing the module (e.g., 'components')
  directory: string;
  // Export path for package.json (e.g., './button')
  exportPath: string;
  // Module name (e.g., 'Button')
  name: string;
  // Original import path (e.g., './components/Button')
  originalPath: string;
}

// Interface for import analysis results
export interface AnalysisResult {
  // List of analyzed import paths
  imports: ImportPath[];
}

// Interface for module export configuration
export interface ExportConfig {
  import: {
    default: string; // ESM default file (e.g., "./dist/esm/index.js")
    types: string; // ESM type definitions (e.g., "./dist/types/index.d.ts")
  };
  require: {
    default: string; // CJS default file (e.g., "./dist/cjs/index.cjs")
    types: string; // CJS type definitions (e.g., "./dist/types/index.d.cts")
  };
}

export type ExportTarget = ExportConfig | string;
export type PackageExports = Record<string, ExportTarget>;

// Interface for package.json structure
export interface PackageJson {
  [key: string]: unknown;
  name: string;
  version: string;

  exports?: PackageExports;
}

// Options for processing packages
export interface ProcessOptions {
  dryRun: boolean;
  verbose: boolean;
  configPath?: string;
  packageFilter?: string;
}

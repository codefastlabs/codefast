import { z } from "zod";

/**
 * Represents the schema for package configuration.
 *
 * @param cjsOutputPattern - A string specifying the output pattern for the CommonJS format.
 * @param esmOutputPattern - A string specifying the output pattern for the ESM format.
 * @param packageJsonPath - A string representing the path to the package.json file.
 * @param srcIndexPath - A string specifying the path to the source index file.
 * @param typesOutputCjsPattern - A string defining the output pattern for type declarations in the CommonJS format.
 * @param typesOutputPattern - A string defining the output pattern for type declarations in general.
 * @param exportPathPrefixesToRemove - An optional array of strings specifying prefixes to remove from export paths.
 */
export const PackageConfigSchema = z.interface({
  cjsOutputPattern: z.string(),
  esmOutputPattern: z.string(),
  packageJsonPath: z.string(),
  srcIndexPath: z.string(),
  typesOutputCjsPattern: z.string(),
  typesOutputPattern: z.string(),
  "exportPathPrefixesToRemove?": z.array(z.string()),
});

/**
 * Represents the schema structure for the script configuration.
 *
 * This schema outlines the required and optional fields necessary for defining
 * configurations for custom packages, default package settings, and the pattern
 * used for finding package files.
 *
 * @param customPackageConfigs - A record where keys are strings and values are partials of PackageConfigSchema giving
 *                                the configurations for custom packages. This allows defining overrides or additional
 *                                configuration for specific packages.
 * @param defaultPackageConfig - The default package configuration, uniformly applied unless overridden by customPackageConfigs.
 * @param packagesGlob - A string indicating the glob pattern used to identify package files.
 */
export const ScriptConfigSchema = z.interface({
  customPackageConfigs: z.record(z.string(), PackageConfigSchema.partial()),
  defaultPackageConfig: PackageConfigSchema,
  packagesGlob: z.string(),
});

/**
 * Represents the configuration settings for a package.
 *
 * This type is derived from the `PackageConfigSchema` using the `zod` library.
 *
 * @typeParam T - The inferred type of the package configuration schema.
 *
 * @returns The inferred type from `PackageConfigSchema` representing the package configuration.
 */
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
/**
 * Represents the configuration for a script based on the `ScriptConfigSchema`.
 * This type infers its structure using `z.infer`.
 *
 * @typeParam T - The type inferred from the schema definition.
 *
 * @returns The inferred type that matches the schema.
 */
export type ScriptConfig = z.infer<typeof ScriptConfigSchema>;

/**
 * Represents an import path for a module or file, including its directory, export path, name, and original path.
 *
 * @param directory - The directory containing the import.
 * @param exportPath - The resolved path of the export from the directory.
 * @param name - The name of the import.
 * @param originalPath - The original unresolved path of the import as provided in the source.
 */
export interface ImportPath {
  directory: string;
  exportPath: string;
  name: string;
  originalPath: string;
}

/**
 * Represents the result of an analysis process, including the identified import paths.
 *
 * @typeParam ImportPath - The type representing an individual import path.
 */
export interface AnalysisResult {
  imports: ImportPath[];
}

/**
 * Represents the configuration settings for exporting modules in different formats.
 *
 * This interface defines the required structure for specifying export configurations
 * in terms of import and require formats, including default exports and type exports.
 */
export interface ExportConfig {
  import: {
    default: string;
    types: string;
  };
  require: {
    default: string;
    types: string;
  };
}

/**
 * Represents a target for export, which can either be an `ExportConfig` object
 * or a string defining the target.
 *
 * @typeParam ExportConfig - Defines the configuration type for export when not using a string as a target.
 */
export type ExportTarget = ExportConfig | string;
/**
 * Represents the structure of package exports, mapping export paths to their targets.
 *
 * This type is primarily used to define a dictionary where the keys are export paths
 * (strings) and the values are the targets to which these paths resolve.
 *
 * @typeParam ExportTarget - The type representing the value of each export target.
 * @returns A record that maps export path strings to their corresponding export targets.
 */
export type PackageExports = Record<string, ExportTarget>;

/**
 * Represents the structure of a `package.json` file in a Node.js project.
 *
 * This interface defines the essential fields for describing a package, such as its name, version,
 * and an optional `exports` field used for specifying module exports.
 *
 * @typeParam T - An optional type parameter for customizing the `exports` field (if applicable).
 * @returns An object adhering to the `PackageJson` structure.
 */
export interface PackageJson {
  name: string;
  version: string;
  exports?: PackageExports;
}

/**
 * Represents the configuration options for a process.
 *
 * The `ProcessOptions` interface allows the customization of process behavior
 * through various optional parameters.
 *
 * @param dryRun - Indicates if the process should run in a simulation mode without making changes.
 * @param configPath - Specifies the file path to a configuration file, if provided.
 * @param packageFilter - Filters packages that should be processed, if specified.
 */
export interface ProcessOptions {
  dryRun: boolean;
  configPath?: string;
  packageFilter?: string;
}

import { z } from "zod";

export const packageConfigSchema = z.object({
  cjsOutputPattern: z.string().describe("Output pattern for CommonJS format, e.g., './dist/cjs/{dir}/{name}.cjs'"),
  esmOutputPattern: z.string().describe("Output pattern for ESM format, e.g., './dist/esm/{dir}/{name}.js'"),
  packageJsonPath: z.string().describe("Path to the package.json file, e.g., 'package.json'"),
  srcIndexPath: z.string().describe("Path to the source index file, e.g., 'src/index.ts'"),
  typesOutputCjsPattern: z
    .string()
    .describe("Output pattern for CommonJS type declarations, e.g., './dist/types/{dir}/{name}.d.cts'"),
  typesOutputPattern: z
    .string()
    .describe("Output pattern for type declarations, e.g., './dist/types/{dir}/{name}.d.ts'"),
  exportPathPrefixesToRemove: z
    .array(z.string())
    .optional()
    .describe("Prefixes to remove from export paths, e.g., ['components']"),
});

export const scriptConfigSchema = z.object({
  customPackageConfigs: z
    .record(z.string(), packageConfigSchema.partial())
    .describe("Custom configurations for specific packages"),
  defaultPackageConfig: packageConfigSchema.describe("Default configuration applied to all packages unless overridden"),
  packagesGlob: z.string().describe("Glob pattern to find package.json files, e.g., './packages/**/package.json'"),
});

export const importPathSchema = z.object({
  directory: z.string().describe("Directory containing the import, e.g., 'components'"),
  exportPath: z.string().describe("Resolved export path from the directory, e.g., './button'"),
  name: z.string().describe("Name of the import, e.g., 'Button'"),
  originalPath: z.string().describe("Original unresolved path, e.g., './components/button'"),
});

export const exportConfigSchema = z.object({
  import: z.object({
    default: z.string().describe("ESM default export path"),
    types: z.string().describe("ESM types export path"),
  }),
  require: z.object({
    default: z.string().describe("CommonJS default export path"),
    types: z.string().describe("CommonJS types export path"),
  }),
});

export const PackageExportsSchema = z.record(z.string(), z.union([exportConfigSchema, z.string()]));

export const packageJsonSchema = z.object({
  dependencies: z
    .record(z.string(), z.string())
    .optional()
    .describe("List of runtime dependencies with their versions"),
  devDependencies: z
    .record(z.string(), z.string())
    .optional()
    .describe("List of development dependencies with their versions"),
  exports: PackageExportsSchema.optional().describe("Export mappings for the package"),
  name: z.string().describe("Name of the package"),
  scripts: z.record(z.string(), z.string()).describe("Script commands defined for the package"),
  "simple-git-hooks": z.record(z.string(), z.string()).optional().describe("Git hooks configuration for the package"),
  version: z.string().optional().describe("Version of the package"),
});

export type PackageConfig = z.infer<typeof packageConfigSchema>;

export type ScriptConfig = z.infer<typeof scriptConfigSchema>;

export type ImportPath = z.infer<typeof importPathSchema>;

export type ExportConfig = z.infer<typeof exportConfigSchema>;

export type PackageExports = z.infer<typeof PackageExportsSchema>;

export type PackageJson = z.infer<typeof packageJsonSchema>;

export interface AnalysisResult {
  imports: ImportPath[];
}

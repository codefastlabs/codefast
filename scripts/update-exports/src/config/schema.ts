import { z } from "zod";

// Định nghĩa schema để validate cấu hình
export const PackageConfigSchema = z.object({
  srcIndexPath: z.string(),
  packageJsonPath: z.string(),
  esmOutputPattern: z.string(),
  cjsOutputPattern: z.string(),
  typesOutputPattern: z.string(),
  typesOutputCjsPattern: z.string(),
});

export const ScriptConfigSchema = z.object({
  packagesGlob: z.string(),
  defaultPackageConfig: PackageConfigSchema,
  customPackageConfigs: z.record(z.string(), PackageConfigSchema.partial()),
});

export type PackageConfigInput = z.infer<typeof PackageConfigSchema>;
export type ScriptConfigInput = z.infer<typeof ScriptConfigSchema>;

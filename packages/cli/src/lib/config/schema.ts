import { z } from "zod";

export type CodefastAfterWriteHook = (ctx: { files: string[] }) => void | Promise<void>;

export const hookSchema = z.custom<CodefastAfterWriteHook>((value) => typeof value === "function", {
  message: "Expected a function",
});

export const mirrorConfigSchema = z
  .object({
    skipPackages: z.array(z.string()).optional(),
    pathTransformations: z
      .record(z.string(), z.object({ removePrefix: z.string().optional() }).strict())
      .optional(),
    customExports: z.record(z.string(), z.record(z.string(), z.string())).optional(),
    cssExports: z
      .record(
        z.string(),
        z.union([
          z.boolean(),
          z
            .object({
              enabled: z.boolean().optional(),
              customExports: z.record(z.string(), z.string()).optional(),
              forceExportFiles: z.boolean().optional(),
            })
            .strict(),
        ]),
      )
      .optional(),
  })
  .strict();

export const codefastTagConfigSchema = z
  .object({
    onAfterWrite: hookSchema.optional(),
  })
  .strict();

export const codefastArrangeConfigSchema = z
  .object({
    onAfterWrite: hookSchema.optional(),
  })
  .strict();

export const codefastConfigSchema = z
  .object({
    mirror: mirrorConfigSchema.optional(),
    tag: codefastTagConfigSchema.optional(),
    arrange: codefastArrangeConfigSchema.optional(),
  })
  .strict();

export type MirrorConfig = z.infer<typeof mirrorConfigSchema>;
export type CodefastTagConfig = z.infer<typeof codefastTagConfigSchema>;
export type CodefastArrangeConfig = z.infer<typeof codefastArrangeConfigSchema>;
export type CodefastConfig = z.infer<typeof codefastConfigSchema>;

import { z } from "zod";

const afterWriteHookSchema = z.custom<(ctx: { files: string[] }) => void | Promise<void>>(
  (value) => typeof value === "function",
  {
    message: "Expected a function",
  },
);

export type CodefastAfterWriteHook = z.infer<typeof afterWriteHookSchema>;

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

export type MirrorConfig = z.infer<typeof mirrorConfigSchema>;

export const codefastTagConfigSchema = z
  .object({
    skipPackages: z.array(z.string()).optional(),
    onAfterWrite: afterWriteHookSchema.optional(),
  })
  .strict();

export type CodefastTagConfig = z.infer<typeof codefastTagConfigSchema>;

export const codefastArrangeConfigSchema = z
  .object({
    onAfterWrite: afterWriteHookSchema.optional(),
  })
  .strict();

export type CodefastArrangeConfig = z.infer<typeof codefastArrangeConfigSchema>;

/** Root `codefast.config` Zod schema — single source of truth for both validation and TS types. */
export const codefastConfigRootSchema = z
  .object({
    mirror: mirrorConfigSchema.optional(),
    tag: codefastTagConfigSchema.optional(),
    arrange: codefastArrangeConfigSchema.optional(),
  })
  .strict();

export type CodefastConfig = z.infer<typeof codefastConfigRootSchema>;

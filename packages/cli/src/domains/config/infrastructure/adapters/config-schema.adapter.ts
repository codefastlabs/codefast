import { z } from "zod";
import type {
  CodefastAfterWriteHook,
  CodefastArrangeConfig,
  CodefastConfig,
  CodefastTagConfig,
  MirrorConfig,
} from "#/domains/config/domain/schema.domain";

const hookSchema = z.custom<CodefastAfterWriteHook>((value) => typeof value === "function", {
  message: "Expected a function",
});

const mirrorConfigSchema: z.ZodType<MirrorConfig> = z
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

const codefastTagConfigSchema: z.ZodType<CodefastTagConfig> = z
  .object({
    skipPackages: z.array(z.string()).optional(),
    onAfterWrite: hookSchema.optional(),
  })
  .strict();

const codefastArrangeConfigSchema: z.ZodType<CodefastArrangeConfig> = z
  .object({
    onAfterWrite: hookSchema.optional(),
  })
  .strict();

export const codefastConfigSchema: z.ZodType<CodefastConfig> = z
  .object({
    mirror: mirrorConfigSchema.optional(),
    tag: codefastTagConfigSchema.optional(),
    arrange: codefastArrangeConfigSchema.optional(),
  })
  .strict();

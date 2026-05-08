import { z } from "zod";

const afterWriteHookSchema = z.custom<(ctx: { files: Array<string> }) => void | Promise<void>>(
  (value) => typeof value === "function",
  {
    message: "Expected a function",
  },
);

/**
 * @since 0.3.16-canary.0
 */
export type CodefastAfterWriteHook = z.infer<typeof afterWriteHookSchema>;

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
export type MirrorConfig = z.infer<typeof mirrorConfigSchema>;

/**
 * @since 0.3.16-canary.0
 */
export const codefastTagConfigSchema = z
  .object({
    skipPackages: z.array(z.string()).optional(),
    onAfterWrite: afterWriteHookSchema.optional(),
  })
  .strict();

/**
 * @since 0.3.16-canary.0
 */
export type CodefastTagConfig = z.infer<typeof codefastTagConfigSchema>;

/**
 * @since 0.3.16-canary.0
 */
export const codefastArrangeConfigSchema = z
  .object({
    onAfterWrite: afterWriteHookSchema.optional(),
  })
  .strict();

/**
 * @since 0.3.16-canary.0
 */
export type CodefastArrangeConfig = z.infer<typeof codefastArrangeConfigSchema>;

/**
 * Root `codefast.config` Zod schema — single source of truth for both validation and TS types.
 *
 * @since 0.3.16-canary.0
 */
export const codefastConfigRootSchema = z
  .object({
    mirror: mirrorConfigSchema.optional(),
    tag: codefastTagConfigSchema.optional(),
    arrange: codefastArrangeConfigSchema.optional(),
  })
  .strict();

/**
 * @since 0.3.16-canary.0
 */
export type CodefastConfig = z.infer<typeof codefastConfigRootSchema>;

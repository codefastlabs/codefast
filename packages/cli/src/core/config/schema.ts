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

const mirrorCssConfigSchema = z.union([
  z.boolean(),
  z
    .object({
      enabled: z.boolean().optional(),
      customExports: z.record(z.string(), z.string()).optional(),
      forceExportFiles: z.boolean().optional(),
    })
    .strict(),
]);

/**
 * Per-package mirror configuration. Setting a package to `false` skips it entirely.
 *
 * - `source` — include a `source` condition pointing to the original `.ts` file (default `true`).
 *   Pass a string to override the root-export source path explicitly.
 * - `types` — include the `types` condition when `.d.ts` files exist (default `true`).
 * - `import` — include the `import` condition (default `true`).
 * - `css` — CSS export configuration (wildcard or per-file).
 *
 * @since 0.3.16-canary.0
 */
export const mirrorPackageConfigSchema = z
  .object({
    /** Preserve the existing `package.json#exports` map and only add missing conditions
     *  (`source`, `types`, `import`). No dist/ scan is performed. */
    preserve: z.boolean().optional(),
    strip: z.string().optional(),
    exports: z.record(z.string(), z.string()).optional(),
    source: z.union([z.boolean(), z.string()]).default(true),
    types: z.boolean().default(true),
    import: z.boolean().default(true),
    css: mirrorCssConfigSchema.optional(),
  })
  .strict();

/**
 * @since 0.3.16-canary.0
 */
export type MirrorPackageConfig = z.infer<typeof mirrorPackageConfigSchema>;

/**
 * Mirror config: a record keyed by package name. Set a package to `false` to skip it;
 * omit it entirely to process it with default settings.
 *
 * @since 0.3.16-canary.0
 */
export const mirrorConfigSchema = z.record(z.string(), z.union([z.literal(false), mirrorPackageConfigSchema]));

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
 * RTL audit defaults — `target` is relative to the repo root (where `codefast.config` lives).
 *
 * @since 0.3.16-canary.0
 */
export const codefastAuditRtlConfigSchema = z
  .object({
    /** Directory or file to scan when no CLI target is passed. */
    target: z.string().optional(),
    /** Bare class tokens or `repo/relative/path.tsx:token` entries to ignore. */
    allowlist: z.array(z.string()).optional(),
  })
  .strict();

/**
 * @since 0.3.16-canary.0
 */
export type CodefastAuditRtlConfig = z.infer<typeof codefastAuditRtlConfigSchema>;

/**
 * @since 0.3.16-canary.0
 */
export const codefastAuditConfigSchema = z
  .object({
    rtl: codefastAuditRtlConfigSchema.optional(),
  })
  .strict();

/**
 * @since 0.3.16-canary.0
 */
export type CodefastAuditConfig = z.infer<typeof codefastAuditConfigSchema>;

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
    audit: codefastAuditConfigSchema.optional(),
  })
  .strict();

/**
 * @since 0.3.16-canary.0
 */
export type CodefastConfig = z.infer<typeof codefastConfigRootSchema>;

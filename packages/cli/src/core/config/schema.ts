import { z } from "zod";

/**
 * A config hook invoked with the written file paths after a command rewrites files.
 *
 * @since 0.3.16-canary.0
 */
export type CodefastAfterWriteHook = (context: { files: Array<string> }) => void | Promise<void>;

/**
 * CSS export configuration for a mirrored package — a flag, or per-file overrides.
 */
type MirrorCssConfig =
  | boolean
  | {
      enabled?: boolean | undefined;
      customExports?: Record<string, string> | undefined;
      forceExportFiles?: boolean | undefined;
    };

/**
 * Per-package mirror configuration. Setting a package to `false` skips it entirely.
 */
interface MirrorPackageConfig {
  /** Preserve the existing `package.json#exports` map and only add missing conditions
   *  (`source`, `types`, `import`); no `dist/` scan is performed. */
  preserve?: boolean | undefined;
  strip?: string | undefined;
  /** Specifiers to leave out of the generated map, so a package's public surface is a decision
   *  rather than a consequence of its `dist/` layout. Matched against the specifier as it would
   *  appear in `exports` (after `strip`); a trailing `/*` excludes a whole subtree. The root
   *  export and `./package.json` are never excluded. */
  exclude?: Array<string> | undefined;
  exports?: Record<string, string> | undefined;
  /** All three default to `true`; the mirror resolves an omitted value the same as `true`. */
  source?: boolean | string | undefined;
  types?: boolean | undefined;
  import?: boolean | undefined;
  css?: MirrorCssConfig | undefined;
}

/**
 * The validated `mirror` configuration, keyed by package name.
 *
 * @since 0.3.16-canary.0
 */
export type MirrorConfig = Record<string, false | MirrorPackageConfig>;

/**
 * The validated `tag` command configuration.
 *
 * @since 0.3.16-canary.0
 */
export interface CodefastTagConfig {
  skipPackages?: Array<string> | undefined;
  onAfterWrite?: CodefastAfterWriteHook | undefined;
}

/**
 * The validated `arrange` command configuration.
 *
 * @since 0.3.16-canary.0
 */
export interface CodefastArrangeConfig {
  onAfterWrite?: CodefastAfterWriteHook | undefined;
}

/** An audit's per-command defaults: entries to ignore, as bare tokens or `repo/relative/path:token`. */
interface CodefastAuditAllowlistConfig {
  allowlist?: Array<string> | undefined;
}

/** Per-audit defaults grouped under `audit`; the scan always starts at the repo root. */
interface CodefastAuditConfig {
  rtl?: { target?: string | undefined; allowlist?: Array<string> | undefined } | undefined;
  links?: CodefastAuditAllowlistConfig | undefined;
  comments?: CodefastAuditAllowlistConfig | undefined;
  imports?: CodefastAuditAllowlistConfig | undefined;
  displayNames?: CodefastAuditAllowlistConfig | undefined;
}

/**
 * The validated root `codefast.config` shape.
 *
 * @since 0.3.16-canary.0
 */
export interface CodefastConfig {
  mirror?: MirrorConfig | undefined;
  tag?: CodefastTagConfig | undefined;
  arrange?: CodefastArrangeConfig | undefined;
  audit?: CodefastAuditConfig | undefined;
}

const afterWriteHookSchema = z.custom<CodefastAfterWriteHook>((value) => typeof value === "function", {
  message: "Expected a function",
});

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

const mirrorPackageConfigSchema = z
  .object({
    preserve: z.boolean().optional(),
    strip: z.string().optional(),
    exclude: z.array(z.string()).optional(),
    exports: z.record(z.string(), z.string()).optional(),
    source: z.union([z.boolean(), z.string()]).default(true),
    types: z.boolean().default(true),
    import: z.boolean().default(true),
    css: mirrorCssConfigSchema.optional(),
  })
  .strict();

/**
 * Zod validator for the `mirror` configuration record; its output is a {@link MirrorConfig}.
 *
 * @since 0.3.16-canary.0
 */
export const mirrorConfigSchema: z.ZodType<MirrorConfig> = z.record(
  z.string(),
  z.union([z.literal(false), mirrorPackageConfigSchema]),
);

const codefastTagConfigSchema = z
  .object({
    skipPackages: z.array(z.string()).optional(),
    onAfterWrite: afterWriteHookSchema.optional(),
  })
  .strict();

const codefastArrangeConfigSchema = z
  .object({
    onAfterWrite: afterWriteHookSchema.optional(),
  })
  .strict();

const codefastAuditRtlConfigSchema = z
  .object({
    target: z.string().optional(),
    allowlist: z.array(z.string()).optional(),
  })
  .strict();

const codefastAuditAllowlistConfigSchema = z
  .object({
    allowlist: z.array(z.string()).optional(),
  })
  .strict();

const codefastAuditConfigSchema = z
  .object({
    rtl: codefastAuditRtlConfigSchema.optional(),
    links: codefastAuditAllowlistConfigSchema.optional(),
    comments: codefastAuditAllowlistConfigSchema.optional(),
    imports: codefastAuditAllowlistConfigSchema.optional(),
    displayNames: codefastAuditAllowlistConfigSchema.optional(),
  })
  .strict();

/**
 * Zod validator for a raw `codefast.config` object; its output is a {@link CodefastConfig}.
 *
 * @since 0.3.16-canary.0
 */
export const codefastConfigRootSchema: z.ZodType<CodefastConfig> = z
  .object({
    mirror: mirrorConfigSchema.optional(),
    tag: codefastTagConfigSchema.optional(),
    arrange: codefastArrangeConfigSchema.optional(),
    audit: codefastAuditConfigSchema.optional(),
  })
  .strict();

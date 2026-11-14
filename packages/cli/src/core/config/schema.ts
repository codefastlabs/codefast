import * as z from "zod";

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
 * The validated `exports` configuration, keyed by package name.
 *
 * @since 0.3.16-canary.0
 */
export type ExportsConfig = Record<string, false | MirrorPackageConfig>;

/**
 * The validated `since` configuration.
 *
 * @since 0.3.16-canary.0
 */
export interface SinceConfig {
  skipPackages?: Array<string> | undefined;
  onAfterWrite?: CodefastAfterWriteHook | undefined;
}

/** An audit's per-command defaults: entries to ignore, as bare tokens or `repo/relative/path:token`. */
interface CodefastAuditAllowlistConfig {
  allowlist?: Array<string> | undefined;
}

/** One package's layering: `layers` bottom to top, each naming the directories and module files it holds under `root`. */
interface CodefastAuditLayersPackageConfig {
  /** The directory the layers sit under, relative to the package directory. Defaults to `src`. */
  root?: string | undefined;
  layers: Array<Array<string>>;
}

/** The `audit:layers` defaults: the layered packages by name, and the entries to ignore. */
interface CodefastAuditLayersConfig {
  packages?: Record<string, CodefastAuditLayersPackageConfig> | undefined;
  allowlist?: Array<string> | undefined;
}

/** Per-audit defaults grouped under `audit`; the scan always starts at the repo root. */
interface CodefastAuditConfig {
  rtl?: { target?: string | undefined; allowlist?: Array<string> | undefined } | undefined;
  links?: CodefastAuditAllowlistConfig | undefined;
  comments?: CodefastAuditAllowlistConfig | undefined;
  imports?: CodefastAuditAllowlistConfig | undefined;
  assertions?: CodefastAuditAllowlistConfig | undefined;
  displayNames?: CodefastAuditAllowlistConfig | undefined;
  props?: CodefastAuditAllowlistConfig | undefined;
  layers?: CodefastAuditLayersConfig | undefined;
}

/**
 * The validated root `codefast.config` shape.
 *
 * @since 0.3.16-canary.0
 */
export interface CodefastConfig {
  exports?: ExportsConfig | undefined;
  since?: SinceConfig | undefined;
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
 * Zod validator for the `exports` configuration record; its output is a {@link ExportsConfig}.
 *
 * @since 0.3.16-canary.0
 */
export const exportsConfigSchema: z.ZodType<ExportsConfig> = z.record(
  z.string(),
  z.union([z.literal(false), mirrorPackageConfigSchema]),
);

const sinceConfigSchema = z
  .object({
    skipPackages: z.array(z.string()).optional(),
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

const codefastAuditLayersPackageConfigSchema = z
  .object({
    root: z.string().min(1).optional(),
    layers: z.array(z.array(z.string().min(1)).min(1)).min(1),
  })
  .strict();

const codefastAuditLayersConfigSchema = z
  .object({
    packages: z.record(z.string(), codefastAuditLayersPackageConfigSchema).optional(),
    allowlist: z.array(z.string()).optional(),
  })
  .strict();

const codefastAuditConfigSchema = z
  .object({
    rtl: codefastAuditRtlConfigSchema.optional(),
    links: codefastAuditAllowlistConfigSchema.optional(),
    comments: codefastAuditAllowlistConfigSchema.optional(),
    imports: codefastAuditAllowlistConfigSchema.optional(),
    assertions: codefastAuditAllowlistConfigSchema.optional(),
    displayNames: codefastAuditAllowlistConfigSchema.optional(),
    props: codefastAuditAllowlistConfigSchema.optional(),
    layers: codefastAuditLayersConfigSchema.optional(),
  })
  .strict();

/**
 * Zod validator for a raw `codefast.config` object; its output is a {@link CodefastConfig}.
 *
 * @since 0.3.16-canary.0
 */
export const codefastConfigRootSchema: z.ZodType<CodefastConfig> = z
  .object({
    exports: exportsConfigSchema.optional(),
    since: sinceConfigSchema.optional(),
    audit: codefastAuditConfigSchema.optional(),
  })
  .strict();

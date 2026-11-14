import * as z from "zod";

/**
 * A config hook a writing command calls with the absolute paths it wrote, never on a dry run.
 */
export type AfterWriteHook = (context: {
  readonly command: string;
  readonly files: ReadonlyArray<string>;
}) => void | Promise<void>;

/**
 * CSS export configuration for one package — a flag, or per-file overrides.
 */
type ExportsCssConfig =
  | boolean
  | {
      enabled?: boolean | undefined;
      customExports?: Record<string, string> | undefined;
      forceExportFiles?: boolean | undefined;
    };

/**
 * How `exports:generate` builds one package's exports map.
 */
interface ExportsPackageConfig {
  /** Keep the existing `exports` map and only fill in missing conditions; no `dist/` scan runs. */
  preserve?: boolean | undefined;
  strip?: string | undefined;
  /** Specifiers left out of the generated map, matched after `strip`; a trailing `/*` excludes a subtree. */
  exclude?: Array<string> | undefined;
  exports?: Record<string, string> | undefined;
  /** All three default to `true`. */
  source?: boolean | string | undefined;
  types?: boolean | undefined;
  import?: boolean | undefined;
  css?: ExportsCssConfig | undefined;
}

/**
 * The `exports` section: per-package options keyed by package name or glob, `false` skipping the package.
 */
export type ExportsConfig = Record<string, false | ExportsPackageConfig>;

/**
 * The `since` section: package names or globs keyed to `false`, each skipping the packages it matches.
 */
export type SinceConfig = Record<string, false>;

/**
 * One audit's section: the target it scans when the command line names none, and the findings it accepts — each the
 * finding's text as written, or `path:text` for one file. `false` turns the audit off in a full `audit` run.
 */
export interface AuditSection {
  target?: string | undefined;
  allowlist?: Array<string> | undefined;
}

/** One package's layering: `layers` bottom to top, each naming the directories and module files it holds under `root`. */
interface LayersPackageConfig {
  /** The directory the layers sit under, relative to the package directory. Defaults to `src`. */
  root?: string | undefined;
  layers: Array<Array<string>>;
}

/** The `audit:layers` section, which also names the layered packages. */
interface LayersAuditSection extends AuditSection {
  packages?: Record<string, LayersPackageConfig> | undefined;
}

/**
 * The `audit` section: one entry per audit, keyed by its name in camelCase.
 */
export interface AuditConfig {
  rtl?: false | AuditSection | undefined;
  links?: false | AuditSection | undefined;
  imports?: false | AuditSection | undefined;
  assertions?: false | AuditSection | undefined;
  displayNames?: false | AuditSection | undefined;
  props?: false | AuditSection | undefined;
  comments?: false | AuditSection | undefined;
  layers?: false | LayersAuditSection | undefined;
  publish?: false | AuditSection | undefined;
  engines?: false | AuditSection | undefined;
}

/**
 * The validated root `codefast.config` shape.
 *
 * @since 0.3.16-canary.0
 */
export interface CodefastConfig {
  exports?: ExportsConfig | undefined;
  since?: SinceConfig | undefined;
  audit?: AuditConfig | undefined;
  afterWrite?: AfterWriteHook | undefined;
}

const afterWriteHookSchema = z.custom<AfterWriteHook>((value) => typeof value === "function", {
  message: "Expected a function",
});

const exportsCssConfigSchema = z.union([
  z.boolean(),
  z
    .object({
      enabled: z.boolean().optional(),
      customExports: z.record(z.string(), z.string()).optional(),
      forceExportFiles: z.boolean().optional(),
    })
    .strict(),
]);

const exportsPackageConfigSchema = z
  .object({
    preserve: z.boolean().optional(),
    strip: z.string().optional(),
    exclude: z.array(z.string()).optional(),
    exports: z.record(z.string(), z.string()).optional(),
    source: z.union([z.boolean(), z.string()]).default(true),
    types: z.boolean().default(true),
    import: z.boolean().default(true),
    css: exportsCssConfigSchema.optional(),
  })
  .strict();

/**
 * Zod validator for the `exports` section; its output is an {@link ExportsConfig}.
 */
export const exportsConfigSchema: z.ZodType<ExportsConfig> = z.record(
  z.string(),
  z.union([z.literal(false), exportsPackageConfigSchema]),
);

const sinceConfigSchema = z.record(z.string(), z.literal(false));

const auditSectionShape = {
  target: z.string().min(1).optional(),
  allowlist: z.array(z.string()).optional(),
};

const auditSectionSchema = z.union([z.literal(false), z.object(auditSectionShape).strict()]);

const layersAuditSectionSchema = z.union([
  z.literal(false),
  z
    .object({
      ...auditSectionShape,
      packages: z
        .record(
          z.string(),
          z
            .object({
              root: z.string().min(1).optional(),
              layers: z.array(z.array(z.string().min(1)).min(1)).min(1),
            })
            .strict(),
        )
        .optional(),
    })
    .strict(),
]);

const auditConfigSchema = z
  .object({
    rtl: auditSectionSchema.optional(),
    links: auditSectionSchema.optional(),
    imports: auditSectionSchema.optional(),
    assertions: auditSectionSchema.optional(),
    displayNames: auditSectionSchema.optional(),
    props: auditSectionSchema.optional(),
    comments: auditSectionSchema.optional(),
    layers: layersAuditSectionSchema.optional(),
    publish: auditSectionSchema.optional(),
    engines: auditSectionSchema.optional(),
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
    audit: auditConfigSchema.optional(),
    afterWrite: afterWriteHookSchema.optional(),
  })
  .strict();

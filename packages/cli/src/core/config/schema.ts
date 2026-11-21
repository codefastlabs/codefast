import * as z from "zod";

/**
 * A config hook a writing command calls with the absolute paths it wrote, never on a dry run.
 *
 * @since 0.16.0
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
 *
 * @since 0.16.0
 */
export type ExportsConfig = Record<string, false | ExportsPackageConfig>;

/**
 * The `since` section: package names or globs keyed to `false`, each skipping the packages it matches.
 *
 * @since 0.16.0
 */
export type SinceConfig = Record<string, false>;

/**
 * One audit's section: the target it scans when the command line names none, and the findings it accepts — each the
 * finding's text as written, or `path:text` for one file. `false` turns the audit off in a full `audit` run.
 *
 * @since 0.16.0
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

/**
 * One import rule: the forms of importing `module` it bans, in the files its `scope` globs reach (every file when
 * omitted), and a UMD global whose `<name>.*` reference it flags where nothing imports that name.
 *
 * @since 0.16.0
 */
export interface ImportRule {
  module: string;
  /** Banned forms: `namespace` (`import * as x`), `default` (`import x`), or `named:<name>` (`import { name }`). */
  ban: Array<"namespace" | "default" | `named:${string}`>;
  scope?: Array<string> | undefined;
  umdGlobal?: string | undefined;
  /** What the finding tells a person to do instead. */
  message: string;
}

/** The `audit:imports` section, which also declares the import rules. */
interface ImportsAuditSection extends AuditSection {
  rules?: Array<ImportRule> | undefined;
}

/** The `audit:layers` section, which also names the layered packages. */
interface LayersAuditSection extends AuditSection {
  packages?: Record<string, LayersPackageConfig> | undefined;
}

/**
 * The `audit` section: one entry per audit, keyed by its name in camelCase.
 *
 * @since 0.16.0
 */
export interface AuditConfig {
  tailwindRtl?: false | AuditSection | undefined;
  links?: false | AuditSection | undefined;
  imports?: false | ImportsAuditSection | undefined;
  assertions?: false | AuditSection | undefined;
  diDisplayNames?: false | AuditSection | undefined;
  props?: false | AuditSection | undefined;
  comments?: false | AuditSection | undefined;
  sinceVersions?: false | AuditSection | undefined;
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
 *
 * @since 0.16.0
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

const importRuleSchema = z
  .object({
    module: z.string().min(1),
    ban: z
      .array(
        z.union([
          z.literal("namespace"),
          z.literal("default"),
          z.custom<`named:${string}`>((value) => typeof value === "string" && /^named:.+$/.test(value), {
            message: 'Expected "namespace", "default" or "named:<name>"',
          }),
        ]),
      )
      .min(1),
    scope: z.array(z.string().min(1)).optional(),
    umdGlobal: z.string().min(1).optional(),
    message: z.string().min(1),
  })
  .strict();

const importsAuditSectionSchema = z.union([
  z.literal(false),
  z.object({ ...auditSectionShape, rules: z.array(importRuleSchema).optional() }).strict(),
]);

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
    tailwindRtl: auditSectionSchema.optional(),
    links: auditSectionSchema.optional(),
    imports: importsAuditSectionSchema.optional(),
    assertions: auditSectionSchema.optional(),
    diDisplayNames: auditSectionSchema.optional(),
    props: auditSectionSchema.optional(),
    comments: auditSectionSchema.optional(),
    sinceVersions: auditSectionSchema.optional(),
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

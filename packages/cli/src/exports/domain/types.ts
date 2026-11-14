import type { PackageOutcome } from "#core/report";

/**
 * One conditional exports entry, keyed by resolution condition.
 *
 * @since 0.3.16-canary.0
 */
export interface ExportEntry {
  source?: string;
  types?: string;
  import?: string;
  require?: string;
}

/**
 * Final `package.json#exports` map (conditional exports + string shims + `./package.json`).
 *
 * @since 0.3.16-canary.0
 */
export type ExportMapData = Record<string, ExportEntry | string>;
/**
 * The pre-transform `dist/` path for each generated export specifier.
 *
 * @since 0.3.16-canary.0
 */
export type ExportOriginalPathBySpecifier = Record<string, string>;

interface DistModuleFiles {
  js: string | null;
  mjs: string | null;
  cjs: string | null;
  dts: string | null;
}

/**
 * A `dist/` module path together with the build files found for it.
 *
 * @since 0.3.16-canary.0
 */
export interface DistModule {
  path: string;
  files: DistModuleFiles;
}

/**
 * Parsed `package.json` — only fields mirror reads/writes are typed strictly.
 *
 * @since 0.3.16-canary.0
 */
export type PackageJsonShape = {
  name?: unknown;
  exports?: unknown;
  [key: string]: unknown;
};

/**
 * A generated exports map with its specifier origins and asset counts.
 *
 * @since 0.3.16-canary.0
 */
export interface GenerateExportsResult {
  exports: ExportMapData;
  originalPathBySpecifier: ExportOriginalPathBySpecifier;
  jsCount: number;
  cssCount: number;
}

/**
 * The exports an `exports:generate` run built for one package.
 */
export interface ExportsPackageOutcome extends PackageOutcome {
  readonly exports: {
    readonly total: number;
    readonly modules: number;
    readonly stylesheets: number;
    readonly custom: number;
  };
  /** The specifiers dropped because they pointed into `dist/` and nothing generates them any more. */
  readonly pruned: ReadonlyArray<string>;
}

/**
 * The report of an `exports:generate` run: one outcome per package the target reaches.
 */
export interface ExportsReport {
  readonly packages: ReadonlyArray<ExportsPackageOutcome>;
}

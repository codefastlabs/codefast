import type { GlobalCliOptions } from "#/core/cli/global-options";
import type { CodefastConfig } from "#/core/config/schema";

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
 * The identifying metadata mirror reads from a package's manifest.
 *
 * @since 0.3.16-canary.0
 */
export interface MirrorPackageMeta {
  packageName: string;
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
 * Per-package outcome of a mirror run, as reported in progress and JSON output.
 *
 * @since 0.3.16-canary.0
 */
export interface PackageStats {
  name: string;
  path: string;
  jsModules: number;
  cssExports: number;
  extraExports: number;
  totalExports: number;
  hasTransform: boolean;
  cssConfigStatus: "disabled" | "configured" | "";
  skipped: boolean;
  skipReason: string;
  error: string | null;
  prunedExportKeys: Array<string>;
}

/**
 * Built dist assets tallied for one package (reporter / progress output).
 *
 * @since 0.3.16-canary.0
 */
export interface MirrorDistAssetCounts {
  jsCount: number;
  cssCount: number;
}

/**
 * Aggregate totals across every package in a mirror run.
 *
 * @since 0.3.16-canary.0
 */
export interface GlobalStats {
  packagesFound: number;
  packagesProcessed: number;
  packagesSkipped: number;
  packagesErrored: number;
  totalExports: number;
  totalJsModules: number;
  totalCssExports: number;
  packageDetails: Array<PackageStats>;
}

/**
 * How workspace packages were resolved when scanning the repo (for logging / UX).
 *
 * @since 0.3.16-canary.0
 */
export type WorkspaceMultiDiscoverySource = "default-patterns" | "pnpm-workspace-yaml" | "declared-empty";

/**
 * The workspace package paths found for a mirror run and how they were discovered.
 *
 * @since 0.3.16-canary.0
 */
export type FindWorkspacePackagesResult = {
  relPaths: Array<string>;
  multiSource: WorkspaceMultiDiscoverySource;
};

/**
 * Everything the `mirror` action needs resolved before a run: globals, root, config, and filter.
 *
 * @since 0.3.16-canary.0
 */
export interface MirrorSyncCommandPrelude {
  readonly globals: GlobalCliOptions;
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly packageFilter: string | undefined;
}

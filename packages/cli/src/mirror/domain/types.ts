import type { CodefastConfig } from "#/core/config/schema";
import type { GlobalCliOptions } from "#/core/cli/global-options";

/**
 * @since 0.3.16-canary.0
 */
export interface ExportEntry {
  types: string;
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
 * @since 0.3.16-canary.0
 */
export type ExportOriginalPathBySpecifier = Record<string, string>;

interface ModuleFiles {
  js: string | null;
  mjs: string | null;
  cjs: string | null;
  dts: string | null;
}

/**
 * @since 0.3.16-canary.0
 */
export interface Module {
  path: string;
  files: ModuleFiles;
}

/**
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
 * @since 0.3.16-canary.0
 */
export interface GenerateExportsResult {
  exports: ExportMapData;
  originalPathBySpecifier: ExportOriginalPathBySpecifier;
  jsCount: number;
  cssCount: number;
}

/**
 * @since 0.3.16-canary.0
 */
export interface PackageStats {
  name: string;
  path: string;
  jsModules: number;
  cssExports: number;
  customExports: number;
  totalExports: number;
  hasTransform: boolean;
  cssConfigStatus: "disabled" | "configured" | "";
  skipped: boolean;
  skipReason: string;
  error: string | null;
  prunedExportKeys: string[];
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
  packageDetails: PackageStats[];
}

/**
 * How workspace packages were resolved when scanning the repo (for logging / UX).
 *
 * @since 0.3.16-canary.0
 */
export type WorkspaceMultiDiscoverySource =
  | "default-patterns"
  | "pnpm-workspace-yaml"
  | "declared-empty";

/**
 * @since 0.3.16-canary.0
 */
export type FindWorkspacePackagesResult = {
  relPaths: string[];
  multiSource: WorkspaceMultiDiscoverySource;
};

/**
 * @since 0.3.16-canary.0
 */
export interface MirrorSyncCommandPrelude {
  readonly globals: GlobalCliOptions;
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly packageFilter: string | undefined;
}

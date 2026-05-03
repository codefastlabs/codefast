export interface ExportEntry {
  types: string;
  import?: string;
  require?: string;
}

/**
 * Final `package.json#exports` map (conditional exports + string shims + `./package.json`).
 */
export type ExportMapData = Record<string, ExportEntry | string>;
export type ExportOriginalPathBySpecifier = Record<string, string>;

interface ModuleFiles {
  js: string | null;
  mjs: string | null;
  cjs: string | null;
  dts: string | null;
}

export interface Module {
  path: string;
  files: ModuleFiles;
}

export interface MirrorPackageMeta {
  packageName: string;
}

/**
 * Parsed `package.json` — only fields mirror reads/writes are typed strictly.
 */
export type PackageJsonShape = {
  name?: unknown;
  exports?: unknown;
  [key: string]: unknown;
};

export interface GenerateExportsResult {
  exports: ExportMapData;
  originalPathBySpecifier: ExportOriginalPathBySpecifier;
  jsCount: number;
  cssCount: number;
}

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

/** Built dist assets tallied for one package (reporter / progress output). */
export interface MirrorDistAssetCounts {
  jsCount: number;
  cssCount: number;
}

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
 */
export type WorkspaceMultiDiscoverySource =
  | "default-patterns"
  | "pnpm-workspace-yaml"
  | "declared-empty";

export type FindWorkspacePackagesResult = {
  relPaths: string[];
  multiSource: WorkspaceMultiDiscoverySource;
};

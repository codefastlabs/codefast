import type { CliFs, CliLogger } from "#lib/infra/fs-contract";

export interface ExportEntry {
  types: string;
  import?: string;
  require?: string;
}

/** Final `package.json#exports` map (conditional exports + string shims + `./package.json`). */
export type ExportMapData = Record<string, ExportEntry | string>;

/** Alias for the exports object shape produced by the mirror engine. */
export type ExportMap = ExportMapData;

export interface ModuleFiles {
  js: string | null;
  cjs: string | null;
  dts: string | null;
}

export interface Module {
  path: string;
  files: ModuleFiles;
}

export interface MirrorConfig {
  skipPackages?: string[];
  pathTransformations?: Record<string, { removePrefix?: string }>;
  customExports?: Record<string, Record<string, string>>;
  cssExports?: Record<
    string,
    | boolean
    | { enabled?: boolean; customExports?: Record<string, string>; forceExportFiles?: boolean }
  >;
}

/** Parsed `package.json` — only fields mirror reads/writes are typed strictly. */
export type PackageJsonShape = {
  name?: unknown;
  exports?: unknown;
  [key: string]: unknown;
};

export interface GenerateExportsResult {
  exports: ExportMapData;
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

export interface MirrorOptions {
  rootDir: string;
  verbose?: boolean;
  noColor?: boolean;
  /** Relative to `rootDir`, e.g. `packages/ui` */
  packageFilter?: string;
  fs?: CliFs;
  logger?: CliLogger;
}

/** @deprecated Prefer {@link MirrorOptions} */
export type RunMirrorSyncOptions = MirrorOptions;

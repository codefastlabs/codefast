import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import type { MirrorConfig } from "#lib/config";

export interface ExportEntry {
  types: string;
  import?: string;
  require?: string;
}

/** Final `package.json#exports` map (conditional exports + string shims + `./package.json`). */
export type ExportMapData = Record<string, ExportEntry | string>;
export type ExportOriginalPathBySpecifier = Record<string, string>;

/** Alias for the exports object shape produced by the mirror engine. */
export type ExportMap = ExportMapData;

export interface ModuleFiles {
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

/** Parsed `package.json` — only fields mirror reads/writes are typed strictly. */
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

/** How workspace packages were resolved when scanning the repo (for logging / UX). */
export type WorkspaceMultiDiscoverySource =
  | "default-patterns"
  | "pnpm-workspace-yaml"
  | "declared-empty";

export type FindWorkspacePackagesResult = {
  relPaths: string[];
  multiSource: WorkspaceMultiDiscoverySource;
};

export interface MirrorOptions {
  rootDir: string;
  config?: MirrorConfig;
  verbose?: boolean;
  noColor?: boolean;
  /** Path under `rootDir` (relative or absolute within the repo), e.g. `packages/ui`. */
  packageFilter?: string;
  fs: CliFs;
  logger: CliLogger;
}

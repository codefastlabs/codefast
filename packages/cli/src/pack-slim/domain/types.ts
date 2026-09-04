/** Stats and progress types for a pack-slim run. */

/**
 * The outcome of slimming one workspace package.
 */
export interface PackSlimPackageStats {
  name: string;
  path: string;
  skipped: boolean;
  skipReason: string;
  error: string | null;
  filesSrcRemoved: boolean;
  exportsSourceRemoved: number;
  importsSourceRemoved: number;
  mapFilesDeleted: number;
  sourceCommentsStripped: number;
  changed: boolean;
}

/**
 * The aggregate stats of a pack-slim run across every targeted package.
 */
export interface PackSlimRunStats {
  packagesFound: number;
  packagesProcessed: number;
  packagesSkipped: number;
  packagesErrored: number;
  packagesChanged: number;
  totalMapFilesDeleted: number;
  packageDetails: Array<PackSlimPackageStats>;
}

/**
 * The progress events a pack-slim run emits as it works through the packages.
 */
export interface PackSlimProgressListener {
  onBanner?(): void;
  onPackageComplete?(stats: PackSlimPackageStats, ordinal: number, total: number): void;
  onComplete?(stats: PackSlimRunStats, elapsedSeconds: number): void;
}

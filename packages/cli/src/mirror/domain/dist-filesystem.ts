/**
 * Filesystem surface used by mirror export generation (relative paths under `dist/`).
 *
 * @since 0.3.16-canary.0
 */
export interface DistFilesystem {
  listRelativeFilesRecursively(dirPath: string): Promise<string[]>;
  isDirectoryCssOnly(distDir: string, dirPath: string): Promise<boolean>;
}

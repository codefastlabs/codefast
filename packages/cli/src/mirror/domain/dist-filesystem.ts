/** Filesystem surface used by mirror export generation (relative paths under `dist/`). */
export interface DistFilesystem {
  listRelativeFilesRecursively(dirPath: string): Promise<string[]>;
  isDirectoryCssOnly(distDir: string, dirPath: string): Promise<boolean>;
}

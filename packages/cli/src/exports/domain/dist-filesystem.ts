/**
 * The filesystem surface the exports map is generated from (relative paths under `dist/`).
 *
 * @since 0.3.16-canary.0
 */
export interface DistFilesystem {
  listRelativeFilesRecursively(dirPath: string): Promise<Array<string>>;
  isDirectoryCssOnly(distDir: string, dirPath: string): Promise<boolean>;
}

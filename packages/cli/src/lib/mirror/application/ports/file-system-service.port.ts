export interface FileSystemServicePort {
  listRelativeFilesRecursively(dirPath: string): Promise<string[]>;
  isDirectoryCssOnly(distDir: string, dirPath: string): Promise<boolean>;
}

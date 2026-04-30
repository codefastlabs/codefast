export interface TypeScriptSourceFileWalkerPort {
  walkTsxFiles(rootDirectoryPath: string): string[];
}

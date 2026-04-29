export interface FileWalkerPort {
  walkTypeScriptFiles(rootDirectoryPath: string): string[];
}

export interface FileSystemPort {
  fileExists: (filePath: string) => Promise<boolean>;
  findFiles: (directory: string, pattern: string) => Promise<string[]>;
  getAbsolutePath: (path: string) => string;
  isDirectory: (path: string) => Promise<boolean>;
  readFile: (filePath: string) => Promise<string>;
}

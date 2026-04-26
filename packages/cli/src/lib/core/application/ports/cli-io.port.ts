/**
 * Filesystem surface for CLI use cases — inject in tests. Implementations live in infra.
 */
export type CliFileEncoding = "utf8";

export interface CliDirectoryEntry {
  readonly name: string;
  readonly parentPath: string;
  isFile(): boolean;
  isDirectory(): boolean;
}

export interface CliFs {
  existsSync(path: string): boolean;
  /**
   * Resolve symlinks when possible; fall back to normalizing `inputPath` to an absolute path.
   */
  canonicalPathSync(inputPath: string): string;
  statSync(path: string): { isDirectory(): boolean; isFile(): boolean };
  readFileSync(path: string, encoding: CliFileEncoding): string;
  writeFileSync(path: string, data: string, encoding: CliFileEncoding): void;
  readdirSync(path: string): string[];
  readFile(path: string, encoding: CliFileEncoding): Promise<string>;
  writeFile(path: string, data: string, encoding: CliFileEncoding): Promise<void>;
  readdir(
    path: string,
    options?: { recursive?: boolean; withFileTypes?: boolean },
  ): Promise<string[] | CliDirectoryEntry[]>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(path: string): Promise<void>;
}

export interface CliLogger {
  out(line: string): void;
  err(line: string): void;
}

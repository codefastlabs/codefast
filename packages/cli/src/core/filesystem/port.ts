/**
 * Filesystem surface for CLI flows (real implementation: {@link nodeFilesystem}).
 *
 * @since 0.3.16-canary.0
 */
export type CliFileEncoding = "utf8";

/**
 * @since 0.3.16-canary.0
 */
export interface DirectoryEntry {
  readonly name: string;
  readonly parentPath: string;
  isFile(): boolean;
  isDirectory(): boolean;
}

/**
 * @since 0.3.16-canary.0
 */
export interface FilesystemPort {
  existsSync(filePath: string): boolean;
  canonicalPathSync(inputPath: string): string;
  statSync(filePath: string): { isDirectory(): boolean; isFile(): boolean };
  readFileSync(filePath: string, encoding: CliFileEncoding): string;
  writeFileSync(filePath: string, data: string, encoding: CliFileEncoding): void;
  readdirSync(filePath: string): string[];
  readFile(filePath: string, encoding: CliFileEncoding): Promise<string>;
  writeFile(filePath: string, data: string, encoding: CliFileEncoding): Promise<void>;
  readdir(
    filePath: string,
    options?: { recursive?: boolean; withFileTypes?: boolean },
  ): Promise<string[] | DirectoryEntry[]>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(filePath: string): Promise<void>;
}

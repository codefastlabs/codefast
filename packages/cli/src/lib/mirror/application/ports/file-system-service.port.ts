import type { CliFs } from "#/lib/core/application/ports/cli-io.port";

export interface FileSystemServicePort {
  listRelativeFilesRecursively(fs: CliFs, dirPath: string): Promise<string[]>;
  isDirectoryCssOnly(fs: CliFs, distDir: string, dirPath: string): Promise<boolean>;
}

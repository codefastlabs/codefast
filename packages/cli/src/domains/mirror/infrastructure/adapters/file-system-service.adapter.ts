import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFilesystemPort } from "#/shell/application/ports/outbound/cli-fs.port";
import type { FileSystemServicePort } from "#/domains/mirror/application/ports/outbound/file-system-service.port";
import { CliFilesystemPortToken } from "#/shell/application/cli-runtime.tokens";
import { isDirentList } from "#/domains/mirror/infrastructure/adapters/dirent-list.guard";
import { normalizePath } from "#/domains/mirror/domain/path-normalizer.value-object";

@injectable([inject(CliFilesystemPortToken)])
export class FileSystemServiceAdapter implements FileSystemServicePort {
  constructor(private readonly fs: CliFilesystemPort) {}

  private isKnownReadDirError(caughtError: unknown): boolean {
    return (
      typeof caughtError === "object" &&
      caughtError !== null &&
      "code" in caughtError &&
      (caughtError.code === "ENOENT" || caughtError.code === "EACCES")
    );
  }

  async listRelativeFilesRecursively(dirPath: string): Promise<string[]> {
    try {
      const raw = await this.fs.readdir(dirPath, { recursive: true, withFileTypes: true });
      if (!isDirentList(raw)) {
        return [];
      }
      return raw
        .filter((dirent) => dirent.isFile())
        .map((dirent) => {
          const fullPath = path.join(dirent.parentPath, dirent.name);
          const relPath = path.relative(dirPath, fullPath);
          return normalizePath(relPath);
        });
    } catch (caughtError: unknown) {
      if (this.isKnownReadDirError(caughtError)) {
        return [];
      }
      throw caughtError;
    }
  }

  async isDirectoryCssOnly(distDir: string, dirPath: string): Promise<boolean> {
    try {
      const raw = await this.fs.readdir(path.join(distDir, dirPath), { withFileTypes: true });
      if (!isDirentList(raw)) {
        return false;
      }
      if (raw.length === 0) {
        return true;
      }
      return raw.every((dirent) => dirent.isFile() && dirent.name.endsWith(".css"));
    } catch {
      return false;
    }
  }
}

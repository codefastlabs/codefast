import path from "node:path";
import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { FileSystemServicePort } from "#/lib/mirror/application/ports/file-system-service.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";
import { isDirentList } from "#/lib/mirror/infrastructure/dirent-list.guard";
import { normalizePath } from "#/lib/mirror/domain/path-normalizer.value-object";

function isKnownReadDirError(caughtError: unknown): boolean {
  return (
    typeof caughtError === "object" &&
    caughtError !== null &&
    "code" in caughtError &&
    (caughtError.code === "ENOENT" || caughtError.code === "EACCES")
  );
}

@injectable([inject(CliFsToken)])
export class FileSystemServiceAdapter implements FileSystemServicePort {
  constructor(private readonly fs: CliFs) {}

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
      if (isKnownReadDirError(caughtError)) {
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

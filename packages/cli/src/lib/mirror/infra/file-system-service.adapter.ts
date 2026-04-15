import path from "node:path";
import type { CliFs } from "#lib/infra/fs-contract.port";
import type { FileSystemServicePort } from "#lib/mirror/application/ports/file-system-service.port";
import { isDirentList } from "#lib/mirror/infra/dirent-list.adapter";
import { normalizePath } from "#lib/mirror/infra/path-normalizer.adapter";

function isKnownReadDirError(caughtError: unknown): boolean {
  return (
    typeof caughtError === "object" &&
    caughtError !== null &&
    "code" in caughtError &&
    (caughtError.code === "ENOENT" || caughtError.code === "EACCES")
  );
}

export class FileSystemServiceAdapter implements FileSystemServicePort {
  async listRelativeFilesRecursively(fs: CliFs, dirPath: string): Promise<string[]> {
    try {
      const raw = await fs.readdir(dirPath, { recursive: true, withFileTypes: true });
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

  async isDirectoryCssOnly(fs: CliFs, distDir: string, dirPath: string): Promise<boolean> {
    try {
      const raw = await fs.readdir(path.join(distDir, dirPath), { withFileTypes: true });
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

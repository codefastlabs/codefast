import path from "node:path";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { DistFilesystem } from "#/mirror/domain/dist-filesystem";
import { isDirentList } from "#/mirror/domain/dirent-guard";
import { normalizePath } from "#/mirror/domain/path-normalizer";

/**
 * @since 0.3.16-canary.0
 */
export function createMirrorDistFilesystem(fs: FilesystemPort): DistFilesystem {
  return {
    async listRelativeFilesRecursively(dirPath: string): Promise<Array<string>> {
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
    },

    async isDirectoryCssOnly(distDir: string, dirPath: string): Promise<boolean> {
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
    },
  };
}

function isKnownReadDirError(caughtError: unknown): boolean {
  return (
    typeof caughtError === "object" &&
    caughtError !== null &&
    "code" in caughtError &&
    (caughtError.code === "ENOENT" || caughtError.code === "EACCES")
  );
}

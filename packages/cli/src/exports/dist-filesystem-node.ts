import path from "node:path";

import type { Filesystem } from "#core/filesystem/filesystem";
import { toPosixPath } from "#core/path";
import type { DistFilesystem } from "#exports/domain/dist-filesystem";

/**
 * Creates the `DistFilesystem` the `dist/` scan reads, backed by a `Filesystem`.
 */
export function createDistFilesystem(fs: Filesystem): DistFilesystem {
  return {
    async listRelativeFilesRecursively(dirPath: string): Promise<Array<string>> {
      try {
        const entries = await fs.readdirEntries(dirPath, { recursive: true });
        return entries
          .filter((dirent) => dirent.isFile())
          .map((dirent) => {
            const fullPath = path.join(dirent.parentPath, dirent.name);
            const relPath = path.relative(dirPath, fullPath);
            return toPosixPath(relPath);
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
        const entries = await fs.readdirEntries(path.join(distDir, dirPath));
        return entries.every((dirent) => dirent.isFile() && dirent.name.endsWith(".css"));
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

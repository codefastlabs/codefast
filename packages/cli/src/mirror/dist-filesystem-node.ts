import path from "node:path";

import type { Filesystem } from "#core/filesystem/filesystem";
import type { DistFilesystem } from "#mirror/domain/dist-filesystem";
import { normalizePath } from "#mirror/domain/path-normalizer";

/**
 * Creates the `DistFilesystem` the mirror scan uses, backed by a `Filesystem`.
 *
 * @since 0.3.16-canary.0
 */
export function createMirrorDistFilesystem(fs: Filesystem): DistFilesystem {
  return {
    async listRelativeFilesRecursively(dirPath: string): Promise<Array<string>> {
      try {
        const entries = await fs.readdirEntries(dirPath, { recursive: true });
        return entries
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

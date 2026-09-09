import type { Filesystem } from "#/core/filesystem/filesystem";
import { walkFiles } from "#/core/workspace/walk-files";

/**
 * Recursively collects the `.ts`/`.tsx` file paths under a root, skipping `.d.ts` and skip-listed directories.
 *
 * @since 0.3.16-canary.0
 */
export function walkTsxFiles(rootDirectoryPath: string, fs: Filesystem): Array<string> {
  return walkFiles(
    rootDirectoryPath,
    fs,
    (filePath) => !filePath.endsWith(".d.ts") && (filePath.endsWith(".ts") || filePath.endsWith(".tsx")),
  );
}

import path from "node:path";

import type { Filesystem } from "#/core/filesystem/filesystem";
import { defaultSkipDirectoryNames } from "#/core/workspace/skip-directories";

/**
 * Every file under a root the predicate accepts, skipping build output and vendored trees.
 *
 * @since 0.10.0
 */
export function walkFiles(
  rootDirectoryPath: string,
  fs: Filesystem,
  shouldInclude: (filePath: string) => boolean,
): Array<string> {
  const result: Array<string> = [];
  visit(result, rootDirectoryPath, fs, shouldInclude);
  return result;
}

function visit(
  result: Array<string>,
  entryPath: string,
  fs: Filesystem,
  shouldInclude: (filePath: string) => boolean,
): void {
  const entryStats = fs.statSync(entryPath);
  if (entryStats.isDirectory()) {
    for (const childName of fs.readdirSync(entryPath)) {
      if (defaultSkipDirectoryNames.has(childName)) {
        continue;
      }
      visit(result, path.join(entryPath, childName), fs, shouldInclude);
    }
    return;
  }
  if (shouldInclude(entryPath)) {
    result.push(entryPath);
  }
}

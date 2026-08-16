import path from "node:path";

import type { FilesystemPort } from "#/core/filesystem/port";
import { defaultSkipDirectoryNames } from "#/core/workspace/skip-directories";

/**
 * Every markdown file under a root, skipping build output and vendored trees.
 *
 * @since 0.5.0
 */
export function walkMarkdownFiles(rootDirectoryPath: string, fs: FilesystemPort): Array<string> {
  const result: Array<string> = [];
  visitMarkdownPaths(result, rootDirectoryPath, fs);
  return result;
}

function visitMarkdownPaths(result: Array<string>, entryPath: string, fs: FilesystemPort): void {
  const entryStats = fs.statSync(entryPath);
  if (entryStats.isDirectory()) {
    for (const childName of fs.readdirSync(entryPath)) {
      if (defaultSkipDirectoryNames.has(childName)) {
        continue;
      }
      visitMarkdownPaths(result, path.join(entryPath, childName), fs);
    }
    return;
  }
  if (entryPath.endsWith(".md")) {
    result.push(entryPath);
  }
}

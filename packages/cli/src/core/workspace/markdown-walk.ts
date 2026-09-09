import type { Filesystem } from "#/core/filesystem/filesystem";
import { walkFiles } from "#/core/workspace/walk-files";

/**
 * Every markdown file under a root, skipping build output and vendored trees.
 *
 * @since 0.5.0
 */
export function walkMarkdownFiles(rootDirectoryPath: string, fs: Filesystem): Array<string> {
  return walkFiles(rootDirectoryPath, fs, (filePath) => filePath.endsWith(".md"));
}

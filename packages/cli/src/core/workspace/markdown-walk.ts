import type { FilesystemPort } from "#/core/filesystem/port";
import { walkFiles } from "#/core/workspace/walk-files";

/**
 * Every markdown file under a root, skipping build output and vendored trees.
 *
 * @since 0.5.0
 */
export function walkMarkdownFiles(rootDirectoryPath: string, fs: FilesystemPort): Array<string> {
  return walkFiles(rootDirectoryPath, fs, (filePath) => filePath.endsWith(".md"));
}

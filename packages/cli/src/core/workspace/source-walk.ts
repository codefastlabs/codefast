import path from "node:path";

import type { FilesystemPort } from "#/core/filesystem/port";
import { defaultSkipDirectoryNames } from "#/core/workspace/skip-directories";

/**
 * Every hand-written source file a comment convention applies to — `.ts`, `.tsx`, and `.css`.
 *
 * @remarks Emitted declarations are excluded: they carry whatever the compiler copied over,
 * and rewriting them would be undone by the next build.
 *
 * @since 0.6.0
 */
export function walkSourceFiles(rootDirectoryPath: string, fs: FilesystemPort): Array<string> {
  const result: Array<string> = [];
  visitSourcePaths(result, rootDirectoryPath, fs);
  return result;
}

/**
 * Which comment syntax a path is written in, or `null` when the convention does not cover it.
 *
 * @since 0.6.0
 */
export function sourceCommentLanguage(filePath: string): "css" | "js" | null {
  if (filePath.endsWith(".d.ts")) {
    return null;
  }
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
    return "js";
  }
  return filePath.endsWith(".css") ? "css" : null;
}

function visitSourcePaths(result: Array<string>, entryPath: string, fs: FilesystemPort): void {
  const entryStats = fs.statSync(entryPath);
  if (entryStats.isDirectory()) {
    for (const childName of fs.readdirSync(entryPath)) {
      if (defaultSkipDirectoryNames.has(childName)) {
        continue;
      }
      visitSourcePaths(result, path.join(entryPath, childName), fs);
    }
    return;
  }
  if (sourceCommentLanguage(entryPath) !== null) {
    result.push(entryPath);
  }
}

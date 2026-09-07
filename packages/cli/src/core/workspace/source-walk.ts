import path from "node:path";

import type { FilesystemPort } from "#/core/filesystem/port";
import { defaultSkipDirectoryNames } from "#/core/workspace/skip-directories";

// Ignore files carry the divider convention over `#` comments — the content rules stay code-only.
const ignoreFileNames: ReadonlySet<string> = new Set([
  ".gitignore",
  ".dockerignore",
  ".npmignore",
  ".prettierignore",
  ".eslintignore",
]);

/**
 * Every hand-written source file a comment convention applies to — `.ts`, `.tsx`, `.css`, and ignore files.
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
export function sourceCommentLanguage(filePath: string): "css" | "ignore" | "js" | null {
  if (filePath.endsWith(".d.ts")) {
    return null;
  }
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
    return "js";
  }
  if (filePath.endsWith(".css")) {
    return "css";
  }
  return ignoreFileNames.has(path.basename(filePath)) ? "ignore" : null;
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

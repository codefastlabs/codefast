import path from "node:path";

import type { FilesystemPort } from "#/core/filesystem/port";
import { walkFiles } from "#/core/workspace/walk-files";

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
  return walkFiles(rootDirectoryPath, fs, (filePath) => sourceCommentLanguage(filePath) !== null);
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

import fsSync from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import type { CliFileEncoding, Filesystem } from "#core/filesystem/filesystem";

/**
 * The `Filesystem` implementation backed by Node's real filesystem.
 *
 * @since 0.3.16-canary.0
 */
export const nodeFilesystem: Filesystem = {
  existsSync: fsSync.existsSync,
  statSync: fsSync.statSync,
  readFileSync: fsSync.readFileSync,
  writeFileSync: fsSync.writeFileSync,
  readdirSync: fsSync.readdirSync,

  canonicalPathSync(inputPath: string): string {
    try {
      return fsSync.realpathSync.native(inputPath);
    } catch {
      return path.resolve(inputPath);
    }
  },

  readFile: (filePath: string, enc: CliFileEncoding) => fsPromises.readFile(filePath, enc),

  writeFile: (filePath: string, data: string, enc: CliFileEncoding) => fsPromises.writeFile(filePath, data, enc),

  readdirEntries: (filePath: string, options?: { readonly recursive?: boolean | undefined }) =>
    fsPromises.readdir(filePath, { recursive: options?.recursive ?? false, withFileTypes: true }),

  globSync: (pattern: string, options: { cwd: string }) => fsSync.globSync(pattern, options),

  rename: (oldPath: string, newPath: string) => fsPromises.rename(oldPath, newPath),

  unlink: (filePath: string) => fsPromises.unlink(filePath),
};

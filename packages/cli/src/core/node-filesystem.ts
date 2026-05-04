import fsSync from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import type { CliFileEncoding, DirectoryEntry, FilesystemPort } from "#/core/filesystem";

export const nodeFilesystem: FilesystemPort = {
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

  writeFile: (filePath: string, data: string, enc: CliFileEncoding) =>
    fsPromises.writeFile(filePath, data, enc),

  readdir: async (filePath: string, opts?: { recursive?: boolean; withFileTypes?: boolean }) => {
    const raw = await fsPromises.readdir(
      filePath,
      opts as Parameters<typeof fsPromises.readdir>[1],
    );
    if (!opts?.withFileTypes) {
      return raw as unknown as string[];
    }
    return raw as unknown as DirectoryEntry[];
  },

  rename: (oldPath: string, newPath: string) => fsPromises.rename(oldPath, newPath),

  unlink: (filePath: string) => fsPromises.unlink(filePath),
};

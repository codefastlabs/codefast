import path from "node:path";

import type { DirectoryEntry, Filesystem } from "#core/filesystem/filesystem";

/**
 * Minimal {@link Filesystem} over in-memory files, for exercising {@link TagSinceWriter} and a tag run in tests.
 *
 * @remarks A directory exists when some file sits below it; every other path is missing.
 *
 * @since 0.3.16-canary.0
 */
export function createTagTestFilesystem(files: Readonly<Record<string, string>>): {
  readonly fs: Filesystem;
  readonly contentOf: (filePath: string) => string | undefined;
} {
  const contents = new Map(Object.entries(files));
  const isDirectory = (directoryPath: string): boolean =>
    [...contents.keys()].some((filePath) => filePath.startsWith(`${directoryPath}${path.sep}`));
  const fs: Filesystem = {
    existsSync: (filePath) => contents.has(filePath) || isDirectory(filePath),
    canonicalPathSync: (inputPath) => inputPath,
    globSync: () => [],
    statSync: (filePath) => {
      if (contents.has(filePath)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      if (isDirectory(filePath)) {
        return { isDirectory: () => true, isFile: () => false };
      }
      throw new Error(`missing path: ${filePath}`);
    },
    readFileSync: (filePath, encoding) => {
      const content = contents.get(filePath);
      if (content === undefined || encoding !== "utf8") {
        throw new Error(`unexpected read: ${filePath}`);
      }
      return content;
    },
    writeFileSync: (filePath, data, encoding) => {
      if (!contents.has(filePath) || encoding !== "utf8") {
        throw new Error(`unexpected write: ${filePath}`);
      }
      contents.set(filePath, data);
    },
    readdirSync: (directoryPath) => {
      const prefix = `${directoryPath}${path.sep}`;
      const names = new Set<string>();
      for (const filePath of contents.keys()) {
        if (filePath.startsWith(prefix)) {
          names.add(filePath.slice(prefix.length).split(path.sep)[0]!);
        }
      }
      return [...names];
    },
    readFile: async () => "",
    writeFile: async () => {},
    readdirEntries: async (): Promise<Array<DirectoryEntry>> => [],
    rename: async () => {},
    unlink: async () => {},
  };
  return {
    fs,
    contentOf: (filePath) => contents.get(filePath),
  };
}

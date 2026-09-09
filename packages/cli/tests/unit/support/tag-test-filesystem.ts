import type { DirectoryEntry, Filesystem } from "#/core/filesystem/filesystem";

type TagTestFilesystemState = {
  readonly path: string;
  content: string;
};

/**
 * Minimal {@link Filesystem} for exercising {@link TagSinceWriter} in tests.
 *
 * @since 0.3.16-canary.0
 */
export function createTagTestFilesystem(initial: TagTestFilesystemState): {
  readonly fs: Filesystem;
  readonly getContent: () => string;
} {
  let content = initial.content;
  const fs: Filesystem = {
    existsSync: () => true,
    canonicalPathSync: (inputPath) => inputPath,
    globSync: () => [],
    statSync: () => ({
      isDirectory: () => false,
      isFile: () => true,
    }),
    readFileSync: (filePath, encoding) => {
      if (filePath !== initial.path || encoding !== "utf8") {
        throw new Error(`unexpected read: ${filePath}`);
      }
      return content;
    },
    writeFileSync: (filePath, data, encoding) => {
      if (filePath !== initial.path || encoding !== "utf8") {
        throw new Error(`unexpected write: ${filePath}`);
      }
      content = data;
    },
    readdirSync: () => [],
    readFile: async () => "",
    writeFile: async () => {},
    readdir: async (): Promise<Array<string> | Array<DirectoryEntry>> => [],
    rename: async () => {},
    unlink: async () => {},
  };
  return {
    fs,
    getContent: () => content,
  };
}

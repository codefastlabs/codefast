import type { DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";

type TagTestFilesystemState = {
  readonly path: string;
  content: string;
};

/**
 * Minimal {@link FilesystemPort} for exercising {@link TagSinceWriter} in tests.
 *
 * @since 0.3.16-canary.0
 */
export function createTagTestFilesystem(initial: TagTestFilesystemState): {
  readonly fs: FilesystemPort;
  readonly getContent: () => string;
} {
  let content = initial.content;
  const fs: FilesystemPort = {
    existsSync: () => true,
    canonicalPathSync: (inputPath) => inputPath,
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
    readdir: async (): Promise<string[] | DirectoryEntry[]> => [],
    rename: async () => {},
    unlink: async () => {},
  };
  return {
    fs,
    getContent: () => content,
  };
}

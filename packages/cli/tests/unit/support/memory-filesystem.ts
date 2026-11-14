import path from "node:path";

import picomatch from "picomatch";

import type { DirectoryEntry, Filesystem } from "#core/filesystem/filesystem";

/**
 * An in-memory {@link Filesystem} and a view of the files it holds, for tests.
 */
export interface MemoryFilesystem {
  readonly fs: Filesystem;
  /** The content of a file, or `undefined` when it does not exist. */
  readonly read: (filePath: string) => string | undefined;
}

function missing(filePath: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file or directory, '${filePath}'`);
  error.code = "ENOENT";
  return error;
}

/**
 * Creates a {@link Filesystem} over in-memory files keyed by absolute path; a directory exists while a file sits below
 * it, and every write lands in memory.
 */
export function createMemoryFilesystem(files: Readonly<Record<string, string>>): MemoryFilesystem {
  const contents = new Map(Object.entries(files).map(([filePath, content]) => [path.resolve(filePath), content]));
  const isDirectory = (directory: string): boolean =>
    [...contents.keys()].some((filePath) => filePath.startsWith(`${path.resolve(directory)}${path.sep}`));
  const filesBelow = (directory: string): Array<string> =>
    [...contents.keys()].filter((filePath) => filePath.startsWith(`${path.resolve(directory)}${path.sep}`));
  const read = (filePath: string): string => {
    const content = contents.get(path.resolve(filePath));
    if (content === undefined) {
      throw missing(filePath);
    }
    return content;
  };
  const entry = (entryPath: string, isFile: boolean): DirectoryEntry => ({
    name: path.basename(entryPath),
    parentPath: path.dirname(entryPath),
    isFile: () => isFile,
    isDirectory: () => !isFile,
  });

  const fs: Filesystem = {
    existsSync: (filePath) => contents.has(path.resolve(filePath)) || isDirectory(filePath),
    canonicalPathSync: (inputPath) => path.resolve(inputPath),
    statSync: (filePath) => {
      if (contents.has(path.resolve(filePath))) {
        return { isDirectory: () => false, isFile: () => true };
      }
      if (isDirectory(filePath)) {
        return { isDirectory: () => true, isFile: () => false };
      }
      throw missing(filePath);
    },
    readFileSync: (filePath) => read(filePath),
    writeFileSync: (filePath, data) => {
      contents.set(path.resolve(filePath), data);
    },
    readdirSync: (directory) => [
      ...new Set(filesBelow(directory).map((filePath) => path.relative(directory, filePath).split(path.sep)[0] ?? "")),
    ],
    readFile: async (filePath) => read(filePath),
    writeFile: async (filePath, data) => {
      contents.set(path.resolve(filePath), data);
    },
    readdirEntries: async (directory, options) => {
      const below = filesBelow(directory);
      if (options?.recursive !== true) {
        const names = new Set(below.map((filePath) => path.relative(directory, filePath).split(path.sep)[0] ?? ""));
        return [...names].map((name) => entry(path.join(directory, name), contents.has(path.join(directory, name))));
      }
      const directories = new Set<string>();
      for (const filePath of below) {
        for (let parent = path.dirname(filePath); parent !== path.resolve(directory); parent = path.dirname(parent)) {
          directories.add(parent);
        }
      }
      return [...below.map((filePath) => entry(filePath, true)), ...[...directories].map((dir) => entry(dir, false))];
    },
    globSync: (pattern, { cwd }) => {
      const isMatch = picomatch(pattern, { dot: true });
      return filesBelow(cwd)
        .map((filePath) => path.relative(cwd, filePath).split(path.sep).join("/"))
        .filter((relativePath) => isMatch(relativePath));
    },
    rename: async (from, to) => {
      contents.set(path.resolve(to), read(from));
      contents.delete(path.resolve(from));
    },
    unlink: async (filePath) => {
      read(filePath);
      contents.delete(path.resolve(filePath));
    },
  };
  return { fs, read: (filePath) => contents.get(path.resolve(filePath)) };
}

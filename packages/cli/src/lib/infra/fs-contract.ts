import type { Dirent } from "node:fs";

/**
 * Filesystem surface for CLI packages — inject in tests.
 * Sync API supports arrange walk; async API supports mirror + atomic writes.
 */
export type CliFs = {
  existsSync: (path: string) => boolean;
  statSync: (path: string) => { isDirectory: () => boolean; isFile: () => boolean };
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  writeFileSync: (path: string, data: string, encoding: BufferEncoding) => void;
  readdirSync: (path: string) => string[];
  readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
  writeFile: (path: string, data: string, encoding: BufferEncoding) => Promise<void>;
  readdir: (
    path: string,
    options?: { recursive?: boolean; withFileTypes?: boolean },
  ) => Promise<string[] | Dirent[]>; // implementation matches Node fs.promises.readdir overloads
  rename: (oldPath: string, newPath: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
};

export type CliLogger = {
  out: (line: string) => void;
  err: (line: string) => void;
};

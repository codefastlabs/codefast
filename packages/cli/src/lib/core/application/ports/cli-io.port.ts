import type { Dirent } from "node:fs";

/**
 * Filesystem surface for CLI use cases — inject in tests. Implementations live in infra.
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
  ) => Promise<string[] | Dirent[]>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
};

export type CliLogger = {
  out: (line: string) => void;
  err: (line: string) => void;
};

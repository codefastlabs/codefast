/**
 * Minimal filesystem surface for arrange I/O — inject in tests or alternate runtimes.
 */

export type ArrangeFs = {
  existsSync: (path: string) => boolean;
  statSync: (path: string) => { isDirectory: () => boolean; isFile: () => boolean };
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  writeFileSync: (path: string, data: string, encoding: BufferEncoding) => void;
  readdirSync: (path: string) => string[];
};

/** Stdout/stderr logging used by arrange preview/apply and reports. */
export type ArrangeLogger = {
  out: (line: string) => void;
  err: (line: string) => void;
};

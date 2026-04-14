import fsSync from "node:fs";
import fsPromises from "node:fs/promises";
import process from "node:process";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";

export function createNodeCliFs(): CliFs {
  return {
    existsSync: fsSync.existsSync,
    statSync: fsSync.statSync,
    readFileSync: fsSync.readFileSync,
    writeFileSync: fsSync.writeFileSync,
    readdirSync: fsSync.readdirSync,
    readFile: (p, enc) => fsPromises.readFile(p, enc),
    writeFile: (p, data, enc) => fsPromises.writeFile(p, data, enc),
    readdir: (p, opts) =>
      fsPromises.readdir(p, opts as Parameters<typeof fsPromises.readdir>[1]) as unknown as Promise<
        import("node:fs").Dirent[] | string[]
      >,
    rename: (oldPath, newPath) => fsPromises.rename(oldPath, newPath),
    unlink: (p) => fsPromises.unlink(p),
  };
}

export function createNodeCliLogger(): CliLogger {
  return {
    out: (line: string) => {
      process.stdout.write(`${line}\n`);
    },
    err: (line: string) => {
      process.stderr.write(`${line}\n`);
    },
  };
}

import fsSync from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import type { CliDirectoryEntry, CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";

function canonicalPathSyncNode(inputPath: string): string {
  try {
    return fsSync.realpathSync.native(inputPath);
  } catch {
    return path.resolve(inputPath);
  }
}

export function createNodeCliFs(): CliFs {
  return {
    existsSync: fsSync.existsSync,
    canonicalPathSync: canonicalPathSyncNode,
    statSync: fsSync.statSync,
    readFileSync: fsSync.readFileSync,
    writeFileSync: fsSync.writeFileSync,
    readdirSync: fsSync.readdirSync,
    readFile: (p, enc) => fsPromises.readFile(p, enc),
    writeFile: (p, data, enc) => fsPromises.writeFile(p, data, enc),
    readdir: async (p, opts) => {
      const raw = await fsPromises.readdir(p, opts as Parameters<typeof fsPromises.readdir>[1]);
      if (!opts?.withFileTypes) {
        return raw as unknown as string[];
      }
      return raw as unknown as CliDirectoryEntry[];
    },
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

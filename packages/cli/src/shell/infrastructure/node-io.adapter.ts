import fsSync from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { injectable } from "@codefast/di";
import type {
  CliDirectoryEntry,
  CliFileEncoding,
  CliFs,
  CliLogger,
} from "#/shell/application/ports/cli-io.port";
import type { CliRuntime } from "#/shell/application/ports/runtime.port";

function canonicalPathSyncNode(inputPath: string): string {
  try {
    return fsSync.realpathSync.native(inputPath);
  } catch {
    return path.resolve(inputPath);
  }
}

@injectable([])
export class NodeCliFsAdapter implements CliFs {
  existsSync = fsSync.existsSync;
  canonicalPathSync = canonicalPathSyncNode;
  statSync = fsSync.statSync;
  readFileSync = fsSync.readFileSync;
  writeFileSync = fsSync.writeFileSync;
  readdirSync = fsSync.readdirSync;
  readFile = (p: string, enc: CliFileEncoding) => fsPromises.readFile(p, enc);
  writeFile = (p: string, data: string, enc: CliFileEncoding) => fsPromises.writeFile(p, data, enc);
  readdir = async (p: string, opts?: { withFileTypes?: boolean }) => {
    const raw = await fsPromises.readdir(p, opts as Parameters<typeof fsPromises.readdir>[1]);
    if (!opts?.withFileTypes) {
      return raw as unknown as string[];
    }
    return raw as unknown as CliDirectoryEntry[];
  };
  rename = (oldPath: string, newPath: string) => fsPromises.rename(oldPath, newPath);
  unlink = (p: string) => fsPromises.unlink(p);
}

@injectable([])
export class NodeCliLoggerAdapter implements CliLogger {
  out(line: string): void {
    process.stdout.write(`${line}\n`);
  }
  err(line: string): void {
    process.stderr.write(`${line}\n`);
  }
}

@injectable([])
export class NodeCliRuntimeAdapter implements CliRuntime {
  cwd(): string {
    return process.cwd();
  }

  setExitCode(code: number): void {
    process.exitCode = code;
  }

  isStdoutTty(): boolean {
    return !!process.stdout.isTTY;
  }
}

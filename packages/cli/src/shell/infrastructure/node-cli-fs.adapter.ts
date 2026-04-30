import fsSync from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { injectable } from "@codefast/di";
import type {
  CliDirectoryEntry,
  CliFileEncoding,
  CliFs,
} from "#/shell/application/ports/cli-io.port";

@injectable([])
export class NodeCliFsAdapter implements CliFs {
  private canonicalPathSyncNode(inputPath: string): string {
    try {
      return fsSync.realpathSync.native(inputPath);
    } catch {
      return path.resolve(inputPath);
    }
  }

  existsSync = fsSync.existsSync;
  canonicalPathSync = (inputPath: string) => this.canonicalPathSyncNode(inputPath);
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

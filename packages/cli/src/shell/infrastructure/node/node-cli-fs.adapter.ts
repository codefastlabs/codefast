import fsSync from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { injectable } from "@codefast/di";
import type {
  CliFileEncoding,
  DirectoryEntry,
  FilesystemPort,
} from "#/shell/application/ports/outbound/cli-fs.port";

@injectable([])
export class NodeCliFsAdapter implements FilesystemPort {
  existsSync = fsSync.existsSync;
  statSync = fsSync.statSync;
  readFileSync = fsSync.readFileSync;
  writeFileSync = fsSync.writeFileSync;
  readdirSync = fsSync.readdirSync;

  canonicalPathSync = (inputPath: string) => this.canonicalPathSyncNode(inputPath);

  readFile = (p: string, enc: CliFileEncoding) => fsPromises.readFile(p, enc);

  writeFile = (p: string, data: string, enc: CliFileEncoding) => fsPromises.writeFile(p, data, enc);

  readdir = async (p: string, opts?: { withFileTypes?: boolean }) => {
    const raw = await fsPromises.readdir(p, opts as Parameters<typeof fsPromises.readdir>[1]);
    if (!opts?.withFileTypes) {
      return raw as unknown as string[];
    }
    return raw as unknown as DirectoryEntry[];
  };

  rename = (oldPath: string, newPath: string) => fsPromises.rename(oldPath, newPath);

  unlink = (p: string) => fsPromises.unlink(p);

  private canonicalPathSyncNode(inputPath: string): string {
    try {
      return fsSync.realpathSync.native(inputPath);
    } catch {
      return path.resolve(inputPath);
    }
  }
}

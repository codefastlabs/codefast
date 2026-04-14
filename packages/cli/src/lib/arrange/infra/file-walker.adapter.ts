import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import { walkTsxFiles } from "#lib/arrange/infra/walk";
import type { FileWalkerPort } from "#lib/arrange/application/ports/file-walker.port";

export class FileWalkerAdapter implements FileWalkerPort {
  constructor(private readonly logger?: CliLogger) {}

  walkTypeScriptFiles(rootDirectoryPath: string, fs: CliFs): string[] {
    try {
      return walkTsxFiles(rootDirectoryPath, fs);
    } catch (caughtError: unknown) {
      this.logger?.err(`[file-walker] ${messageFromCaughtUnknown(caughtError)}`);
      throw caughtError;
    }
  }
}

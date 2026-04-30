import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliFs, CliLogger } from "#/shell/application/ports/cli-io.port";
import { walkTsxFiles } from "#/shell/infrastructure/source-code/infrastructure/typescript-source-file-walker.service";
import type { FileWalkerPort } from "#/domains/arrange/application/ports/file-walker.port";
import { CliFsToken, CliLoggerToken } from "#/shell/application/cli-runtime.tokens";

@injectable([inject(CliLoggerToken), inject(CliFsToken)])
export class FileWalkerAdapter implements FileWalkerPort {
  constructor(
    private readonly logger: CliLogger,
    private readonly fs: CliFs,
  ) {}

  walkTypeScriptFiles(rootDirectoryPath: string): string[] {
    try {
      return walkTsxFiles(rootDirectoryPath, this.fs);
    } catch (caughtError: unknown) {
      this.logger.err(`[file-walker] ${messageFromCaughtUnknown(caughtError)}`);
      throw caughtError;
    }
  }
}

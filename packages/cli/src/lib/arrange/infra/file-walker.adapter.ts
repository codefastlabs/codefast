import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { walkTsxFiles } from "#/lib/shared/source-code/infra/tsx-file-walk.adapter";
import type { FileWalkerPort } from "#/lib/arrange/application/ports/file-walker.port";
import { CliFsToken, CliLoggerToken } from "#/lib/core/contracts/tokens";

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

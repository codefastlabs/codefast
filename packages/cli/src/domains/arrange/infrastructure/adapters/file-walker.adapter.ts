import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliLogger } from "#/shell/application/ports/outbound/cli-io.port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/outbound/typescript-source-file-walker.port";
import type { FileWalkerPort } from "#/domains/arrange/application/ports/outbound/file-walker.port";
import {
  CliLoggerToken,
  TypeScriptSourceFileWalkerPortToken,
} from "#/shell/application/cli-runtime.tokens";

@injectable([inject(CliLoggerToken), inject(TypeScriptSourceFileWalkerPortToken)])
export class FileWalkerAdapter implements FileWalkerPort {
  constructor(
    private readonly logger: CliLogger,
    private readonly sourceFileWalker: TypeScriptSourceFileWalkerPort,
  ) {}

  walkTypeScriptFiles(rootDirectoryPath: string): string[] {
    try {
      return this.sourceFileWalker.walkTsxFiles(rootDirectoryPath);
    } catch (caughtError: unknown) {
      this.logger.err(`[file-walker] ${messageFromCaughtUnknown(caughtError)}`);
      throw caughtError;
    }
  }
}

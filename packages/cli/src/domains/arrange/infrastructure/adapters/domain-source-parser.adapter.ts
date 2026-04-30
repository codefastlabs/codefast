import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/domain-source-parser.port";
import type { DomainSourceFile } from "#/domains/arrange/domain/ast/ast-node.model";
import { parseDomainSourceFile as parseDomainSourceFileFromTs } from "#/domains/arrange/infrastructure/adapters/typescript-ast-translator.adapter";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";

/**
 * {@link CliLogger} is optional for manual construction (e.g. integration tests); the container
 * always injects {@link CliLoggerToken}.
 */
@injectable([inject(CliLoggerToken)])
export class DomainSourceParserAdapter implements DomainSourceParserPort {
  constructor(private readonly logger?: CliLogger) {}

  parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile {
    try {
      return parseDomainSourceFileFromTs(filePath, sourceText);
    } catch (caughtError: unknown) {
      this.logger?.err(`[domain-source-parser] ${messageFromCaughtUnknown(caughtError)}`);
      throw caughtError;
    }
  }
}

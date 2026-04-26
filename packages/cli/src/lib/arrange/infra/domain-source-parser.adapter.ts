import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { DomainSourceFile } from "#/lib/arrange/domain/ast/ast-node.model";
import { parseDomainSourceFile as parseDomainSourceFileFromTs } from "#/lib/arrange/infra/ts-ast-translator.adapter";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";

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

/**
 * Default instance without diagnostics logging (tests and legacy imports).
 */
export const domainSourceParserAdapter = new DomainSourceParserAdapter();

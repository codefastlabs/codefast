import { inject, injectable } from "@codefast/di";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/outbound/domain-source-parser.port";
import { TypeScriptAstTranslator } from "#/domains/arrange/infrastructure/typescript-ast-translator";
import type { DomainSourceFile } from "#/domains/arrange/domain/ast/ast-node.model";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";

@injectable([inject(TypeScriptAstTranslator), inject(CliLoggerPortToken)])
export class DomainSourceParserAdapter implements DomainSourceParserPort {
  constructor(
    private readonly typescriptAstTranslator: TypeScriptAstTranslator,
    private readonly logger: CliLoggerPort,
  ) {}

  parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile {
    try {
      return this.typescriptAstTranslator.translateSourceFile(filePath, sourceText);
    } catch (caughtError: unknown) {
      this.logger.err(`[domain-source-parser] ${messageFromCaughtUnknown(caughtError)}`);
      throw caughtError;
    }
  }
}

import { inject, injectable } from "@codefast/di";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/domain-source-parser.port";
import { TypeScriptAstTranslator } from "#/domains/arrange/infrastructure/adapters/typescript-ast-translator.adapter";
import type { DomainSourceFile } from "#/domains/arrange/domain/ast/ast-node.model";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";

@injectable([inject(TypeScriptAstTranslator), inject(CliLoggerToken)])
export class DomainSourceParserAdapter implements DomainSourceParserPort {
  constructor(
    private readonly typescriptAstTranslator: TypeScriptAstTranslator,
    private readonly logger: CliLogger,
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

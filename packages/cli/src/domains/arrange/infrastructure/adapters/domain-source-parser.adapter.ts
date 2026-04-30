import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { CliLogger } from "#/shell/application/ports/cli-io.port";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/domain-source-parser.port";
import type { TypeScriptToDomainAstPort } from "#/domains/arrange/application/ports/typescript-to-domain-ast.port";
import type { DomainSourceFile } from "#/domains/arrange/domain/ast/ast-node.model";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import { TypeScriptToDomainAstPortToken } from "#/domains/arrange/contracts/tokens";

@injectable([inject(TypeScriptToDomainAstPortToken), inject(CliLoggerToken)])
export class DomainSourceParserAdapter implements DomainSourceParserPort {
  constructor(
    private readonly typescriptToDomainAst: TypeScriptToDomainAstPort,
    private readonly logger: CliLogger,
  ) {}

  parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile {
    try {
      return this.typescriptToDomainAst.translateSourceFile(filePath, sourceText);
    } catch (caughtError: unknown) {
      this.logger.err(`[domain-source-parser] ${messageFromCaughtUnknown(caughtError)}`);
      throw caughtError;
    }
  }
}

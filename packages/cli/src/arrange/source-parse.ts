import type { DomainSourceFile } from "#/arrange/domain/ast/ast-node.model";
import { TypeScriptAstTranslator } from "#/arrange/typescript-ast-translator";
import { logger } from "#/core/logger";
import { messageFrom } from "#/core/errors";

const translator = new TypeScriptAstTranslator();

export function parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile {
  try {
    return translator.translateSourceFile(filePath, sourceText);
  } catch (caughtError: unknown) {
    logger.err(`[domain-source-parser] ${messageFrom(caughtError)}`);
    throw caughtError;
  }
}

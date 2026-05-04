import type { DomainSourceFile } from "#/arrange/domain/ast/ast-node";
import { TypeScriptAstTranslator } from "#/arrange/typescript-ast-translator";
import { logger } from "#/core/logger";
import { messageFrom } from "#/core/errors";

const translator = new TypeScriptAstTranslator();

/**
 * @since 0.3.16-canary.0
 */
export function parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile {
  try {
    return translator.translateSourceFile(filePath, sourceText);
  } catch (caughtError: unknown) {
    logger.err(`[domain-source-parser] ${messageFrom(caughtError)}`);
    throw caughtError;
  }
}

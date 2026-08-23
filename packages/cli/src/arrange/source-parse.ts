import type { DomainSourceFile } from "#/arrange/domain/ast/ast-node";
import { TypeScriptAstTranslator } from "#/arrange/typescript-ast-translator";
import { messageFrom } from "#/core/errors";
import { logger } from "#/core/logger";

const translator = new TypeScriptAstTranslator();

/**
 * Parses source text into a domain source file via the shared `oxc-parser` translator.
 *
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

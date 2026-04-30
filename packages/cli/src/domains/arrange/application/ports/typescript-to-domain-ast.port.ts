import type { DomainSourceFile } from "#/domains/arrange/domain/ast/ast-node.model";

/**
 * Maps TypeScript source text to the arrange domain AST (no logging or use-case policy).
 */
export interface TypeScriptToDomainAstPort {
  translateSourceFile(filePath: string, sourceText: string): DomainSourceFile;
}

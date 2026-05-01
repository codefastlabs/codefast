import type { DomainSourceFile } from "#/domains/arrange/domain/ast/ast-node.model";

export interface DomainSourceParserPort {
  parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile;
}

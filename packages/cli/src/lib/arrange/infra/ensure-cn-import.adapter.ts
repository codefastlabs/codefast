import { ensureCnImport as ensureCnImportOnDomainSourceFile } from "#lib/arrange/domain/imports.domain";
import { parseDomainSourceFile } from "#lib/arrange/infra/ts-ast-translator.adapter";

/** Parses source then applies domain cn import injection rules (public CLI-style entry). */
export function ensureCnImport(
  sourceText: string,
  filePath: string,
  cnImportOverride?: string,
): string {
  return ensureCnImportOnDomainSourceFile(
    parseDomainSourceFile(filePath, sourceText),
    cnImportOverride,
  );
}

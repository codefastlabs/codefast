import {
  type DomainSourceFile,
  isDomainImportDeclaration,
  isDomainNamedImports,
  isDomainStringLiteral,
} from "#/lib/arrange/domain/ast/ast-node.model";

function sourceFileImportsCn(sourceFile: DomainSourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (!isDomainImportDeclaration(statement) || !statement.importClause) {
      continue;
    }
    const clause = statement.importClause;
    if (clause.name?.text === "cn") {
      return true;
    }
    if (clause.namedBindings && isDomainNamedImports(clause.namedBindings)) {
      for (const importedBinding of clause.namedBindings.elements) {
        if (importedBinding.name.text === "cn") {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Resolve the module specifier used when injecting a `cn` import into a file.
 */
export function cnModuleSpecifierForFile(filePath: string, override?: string): string {
  void filePath;
  if (override) {
    return override;
  }
  return "@codefast/tailwind-variants";
}

function findImportDeclarationFromModule(sourceFile: DomainSourceFile, moduleSpecifier: string) {
  for (const statement of sourceFile.statements) {
    if (!isDomainImportDeclaration(statement)) {
      continue;
    }
    const spec = statement.moduleSpecifier;
    if (isDomainStringLiteral(spec) && spec.text === moduleSpecifier) {
      return statement;
    }
  }
  return undefined;
}

export function ensureCnImport(sourceFile: DomainSourceFile, cnImportOverride?: string): string {
  const sourceText = sourceFile.text;
  if (sourceFileImportsCn(sourceFile)) {
    return sourceText;
  }

  const moduleSpecifier = cnModuleSpecifierForFile(sourceFile.fileName, cnImportOverride);
  const decl = findImportDeclarationFromModule(sourceFile, moduleSpecifier);

  if (
    decl?.importClause &&
    !decl.importClause.isTypeOnly &&
    decl.importClause.namedBindings &&
    isDomainNamedImports(decl.importClause.namedBindings)
  ) {
    const elements = decl.importClause.namedBindings.elements;
    if (elements.length > 0) {
      const pos = elements[0].pos;
      return `${sourceText.slice(0, pos)}cn, ${sourceText.slice(pos)}`;
    }
  }

  const importLine = `import { cn } from "${moduleSpecifier}";`;

  let firstImport = -1;
  for (const statement of sourceFile.statements) {
    if (isDomainImportDeclaration(statement)) {
      firstImport = statement.pos;
      break;
    }
  }

  const useClient = /^["']use client["'];?\s*\r?\n/.exec(sourceText);
  let insertAt: number;
  if (useClient) {
    insertAt = useClient[0].length;
  } else if (firstImport !== -1) {
    insertAt = firstImport;
  } else {
    insertAt = 0;
  }

  return `${sourceText.slice(0, insertAt)}${importLine}\n${sourceText.slice(insertAt)}`;
}

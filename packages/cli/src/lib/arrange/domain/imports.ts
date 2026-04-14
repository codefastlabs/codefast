import ts from "typescript";

function sourceFileImportsCn(sf: ts.SourceFile): boolean {
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) {
      continue;
    }
    const clause = statement.importClause;
    if (clause.name?.text === "cn") {
      return true;
    }
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
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

function findImportDeclarationFromModule(
  sf: ts.SourceFile,
  moduleSpecifier: string,
): ts.ImportDeclaration | undefined {
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    const spec = statement.moduleSpecifier;
    if (ts.isStringLiteral(spec) && spec.text === moduleSpecifier) {
      return statement;
    }
  }
  return undefined;
}

export function ensureCnImport(
  sourceText: string,
  filePath: string,
  cnImportOverride?: string,
): string {
  const sf = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  if (sourceFileImportsCn(sf)) {
    return sourceText;
  }

  const moduleSpecifier = cnModuleSpecifierForFile(filePath, cnImportOverride);
  const decl = findImportDeclarationFromModule(sf, moduleSpecifier);

  if (
    decl?.importClause &&
    !decl.importClause.isTypeOnly &&
    decl.importClause.namedBindings &&
    ts.isNamedImports(decl.importClause.namedBindings)
  ) {
    const elements = decl.importClause.namedBindings.elements;
    if (elements.length > 0) {
      const pos = elements[0].getStart(sf);
      return `${sourceText.slice(0, pos)}cn, ${sourceText.slice(pos)}`;
    }
  }

  const importLine = `import { cn } from "${moduleSpecifier}";`;

  let firstImport = -1;
  for (const statement of sf.statements) {
    if (ts.isImportDeclaration(statement)) {
      firstImport = statement.getStart(sf);
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

import path from "node:path";
import ts from "typescript";

function sourceFileImportsCn(sf: ts.SourceFile): boolean {
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const clause = st.importClause;
    if (clause.name?.text === "cn") return true;
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        if (el.name.text === "cn") return true;
      }
    }
  }
  return false;
}

export function cnModuleSpecifierForFile(filePath: string, override?: string): string {
  if (override) return override;
  const norm = path.normalize(filePath).replace(/\\/g, "/");
  if (norm.includes("/packages/ui/")) return "#lib/utils";
  return "@codefast/tailwind-variants";
}

function findImportDeclarationFromModule(
  sf: ts.SourceFile,
  moduleSpecifier: string,
): ts.ImportDeclaration | undefined {
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st)) continue;
    const spec = st.moduleSpecifier;
    if (ts.isStringLiteral(spec) && spec.text === moduleSpecifier) {
      return st;
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
  if (sourceFileImportsCn(sf)) return sourceText;

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
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      firstImport = st.getStart(sf);
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

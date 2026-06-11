import {
  forEachDomainChild,
  isDomainIdentifier,
  isDomainImportDeclaration,
  isDomainNamedImports,
  isDomainStringLiteral,
} from "#/arrange/domain/ast/ast-node";
import type { DomainAstNode, DomainImportSpecifier, DomainSourceFile } from "#/arrange/domain/ast/ast-node";
import { endAfterOptionalCommaFollowingInSource } from "#/core/source-text-edit";

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
function cnModuleSpecifierForFile(filePath: string, override?: string): string {
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

function cnIsUsedInBody(node: DomainAstNode): boolean {
  if (isDomainIdentifier(node) && node.text === "cn") {
    return true;
  }
  let found = false;
  forEachDomainChild(node, (child) => {
    if (!found) {
      found = cnIsUsedInBody(child);
    }
  });
  return found;
}

function removeCnSpecifier(
  sourceText: string,
  specifier: DomainImportSpecifier,
  allSpecifiers: ReadonlyArray<DomainImportSpecifier>,
): string {
  const idx = allSpecifiers.indexOf(specifier);
  if (idx === 0) {
    // First specifier: remove "cn, " up to the start of the next one
    const next = allSpecifiers[1];
    if (!next) {
      return sourceText;
    }
    return sourceText.slice(0, specifier.pos) + sourceText.slice(next.pos);
  }
  // Non-first specifier: remove from end of previous specifier to end of cn specifier
  // (covers the ", cn" including any trailing comma)
  const prev = allSpecifiers[idx - 1];
  if (!prev) {
    return sourceText;
  }
  const endWithTrailingComma = endAfterOptionalCommaFollowingInSource(sourceText, specifier.end);
  return sourceText.slice(0, prev.end) + sourceText.slice(endWithTrailingComma);
}

/**
 * After simplify rewrites, drop the `cn` import specifier when `cn` is no
 * longer referenced anywhere outside the import declarations.
 *
 * @since 0.3.16-canary.0
 */
export function dropCnImportIfUnused(sourceFile: DomainSourceFile): string {
  const sourceText = sourceFile.text;

  // Check if cn is still used in the file body (skip import statements)
  for (const stmt of sourceFile.statements) {
    if (isDomainImportDeclaration(stmt)) {
      continue;
    }
    if (cnIsUsedInBody(stmt)) {
      return sourceText;
    }
  }

  // Find the import declaration that contains cn
  for (const stmt of sourceFile.statements) {
    if (!isDomainImportDeclaration(stmt) || !stmt.importClause) {
      continue;
    }
    const clause = stmt.importClause;
    if (!clause.namedBindings || !isDomainNamedImports(clause.namedBindings)) {
      continue;
    }

    const elements = clause.namedBindings.elements;
    const cnSpecifier = elements.find((el) => el.name.text === "cn");
    if (!cnSpecifier) {
      continue;
    }

    if (elements.length === 1) {
      // cn is the only named import — remove the entire import line (including trailing newline)
      const lineEnd = sourceText.indexOf("\n", stmt.end);
      return (
        sourceText.slice(0, stmt.pos) + (lineEnd !== -1 ? sourceText.slice(lineEnd + 1) : sourceText.slice(stmt.end))
      );
    }

    return removeCnSpecifier(sourceText, cnSpecifier, elements);
  }

  return sourceText;
}

/**
 * @since 0.3.16-canary.0
 */
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
      const firstElement = elements[0];
      if (firstElement === undefined) {
        return sourceText;
      }
      const pos = firstElement.pos;
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

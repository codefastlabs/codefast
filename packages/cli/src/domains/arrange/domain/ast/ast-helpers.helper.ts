import { EMPTY_CN_TV_BINDINGS } from "#/domains/arrange/domain/constants.domain";
import {
  applyEditsDescending,
  indentOfLineContaining,
} from "#/shell/domain/source-text-edit.support";
import {
  isDomainIdentifier,
  isDomainImportDeclaration,
  isDomainNamedImports,
  isDomainNamespaceImport,
  isDomainPropertyAccessExpression,
  isDomainStringLiteral,
  lineOfSourcePosition,
} from "#/domains/arrange/domain/ast/ast-node.model";
import type {
  DomainAstNode,
  DomainCallExpression,
  DomainPropertyAssignment,
  DomainSourceFile,
} from "#/domains/arrange/domain/ast/ast-node.model";

/**
 * Known module specifiers that export `cn` / `tv`.
 */
const KNOWN_CN_TV_MODULES = new Set([
  "@codefast/tailwind-variants",
  "clsx",
  "class-variance-authority",
  // Backward compatibility only: keep detection for existing user code that still imports
  // from "tailwind-variants"; new code should prefer "@codefast/tailwind-variants".
  "tailwind-variants",
  "#lib/utils",
  "~/lib/utils",
  "@/lib/utils",
]);

/**
 * True for typical shadcn-style re-exports: `./utils`, `@/lib/utils`, `…/utils/…`,
 * or a dedicated `cn.ts` / `cn.tsx` module.
 */
function moduleLooksLikeCnTvReexport(moduleSpecifier: string): boolean {
  const norm = moduleSpecifier.replace(/\\/g, "/");
  if (/(?:^|[./])utils(?:\/|$)/.test(norm)) {
    return true;
  }
  if (/\/utils\//.test(norm) || /\/utils$/.test(norm)) {
    return true;
  }
  if (/(?:^|\/)cn\.tsx?$/.test(norm)) {
    return true;
  }
  return false;
}

/**
 * Build a set of local binding names that are imported from a known cn/tv
 * module in `sourceFile`.
 */
export function buildKnownCnTvBindings(sourceFile: DomainSourceFile): Set<string> {
  const bindings = new Set<string>();
  for (const stmt of sourceFile.statements) {
    if (!isDomainImportDeclaration(stmt) || !stmt.importClause) {
      continue;
    }
    if (stmt.importClause.isTypeOnly) {
      continue;
    }
    const spec = stmt.moduleSpecifier;
    if (!isDomainStringLiteral(spec)) {
      continue;
    }
    const moduleSpecifierText = spec.text;
    const isKnown = KNOWN_CN_TV_MODULES.has(moduleSpecifierText);
    if (!isKnown && !moduleLooksLikeCnTvReexport(moduleSpecifierText)) {
      continue;
    }

    const clause = stmt.importClause;
    if (clause.name) {
      bindings.add(clause.name.text);
    }
    const { namedBindings } = clause;
    if (!namedBindings) {
      continue;
    }
    if (isDomainNamedImports(namedBindings)) {
      for (const namedImport of namedBindings.elements) {
        bindings.add(namedImport.name.text);
      }
      continue;
    }
    if (isDomainNamespaceImport(namedBindings)) {
      bindings.add(namedBindings.name.text);
    }
  }
  return bindings;
}

/**
 * Returns true when `expr` is an identifier whose name matches `name` AND
 * that name is listed in `knownBindings` from a recognized import.
 */
export function isCnOrTvIdentifier(
  expr: DomainAstNode,
  name: "cn" | "tv",
  knownBindings: Set<string> = EMPTY_CN_TV_BINDINGS,
): boolean {
  if (knownBindings.size === 0) {
    return false;
  }
  if (isDomainIdentifier(expr) && expr.text === name) {
    return knownBindings.has(expr.text);
  }
  if (isDomainPropertyAccessExpression(expr) && expr.name.text === name) {
    return isDomainIdentifier(expr.expression) && knownBindings.has(expr.expression.text);
  }
  return false;
}

export function propertyAssignmentNameText(prop: DomainPropertyAssignment): string | undefined {
  if (isDomainIdentifier(prop.name)) {
    return prop.name.text;
  }
  if (isDomainStringLiteral(prop.name)) {
    return prop.name.text;
  }
  return undefined;
}

export function lineOf(sourceFile: DomainSourceFile, node: DomainAstNode): number {
  return lineOfSourcePosition(sourceFile.text, node.pos);
}

export { applyEditsDescending };

/**
 * Replace `cn(...)` nested in `tv({...})` with a plain string (one arg) or a string
 * array (multiple args). Returns undefined when there are zero arguments.
 */
export function unwrapCnInsideTvCallReplacement(
  call: DomainCallExpression,
  sourceText: string,
): string | undefined {
  const args = call.arguments;
  if (args.length === 0) {
    return undefined;
  }
  const baseIndent = indentOfLineContaining(sourceText, call.pos);
  const innerIndent = `${baseIndent}  `;
  if (args.length === 1) {
    const firstArg = args[0];
    if (firstArg === undefined) {
      return undefined;
    }
    return sourceText.slice(firstArg.pos, firstArg.end);
  }
  const lines: string[] = ["["];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) {
      throw new Error("invariant: unwrapCnInsideTvCall argument missing");
    }
    const piece = sourceText.slice(arg.pos, arg.end);
    // Trailing comma on every element — intentional (Prettier-compatible style;
    // keeps array diffs clean when arguments are later added or removed).
    const comma = i < args.length - 1 || args.length > 1 ? "," : "";
    lines.push(`${innerIndent}${piece}${comma}`);
  }
  lines.push(`${baseIndent}]`);
  return lines.join("\n");
}

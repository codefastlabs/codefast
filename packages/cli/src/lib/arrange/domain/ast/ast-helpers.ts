import ts from "typescript";
import { EMPTY_CN_TV_BINDINGS } from "#lib/arrange/domain/constants";

/** Known module specifiers that export `cn` / `tv`. */
export const KNOWN_CN_TV_MODULES = new Set([
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
export function moduleLooksLikeCnTvReexport(moduleSpecifier: string): boolean {
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
 * module in `sf`.
 */
export function buildKnownCnTvBindings(sf: ts.SourceFile): Set<string> {
  const bindings = new Set<string>();
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) {
      continue;
    }
    if (stmt.importClause.isTypeOnly) {
      continue;
    }
    const spec = stmt.moduleSpecifier;
    if (!ts.isStringLiteral(spec)) {
      continue;
    }
    const moduleSpecifier = spec.text;
    const isKnown = KNOWN_CN_TV_MODULES.has(moduleSpecifier);
    if (!isKnown && !moduleLooksLikeCnTvReexport(moduleSpecifier)) {
      continue;
    }

    const clause = stmt.importClause;
    if (clause.name) {
      bindings.add(clause.name.text);
    }
    if (!clause.namedBindings) {
      continue;
    }
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const namedImport of clause.namedBindings.elements) {
        bindings.add(namedImport.name.text);
      }
      continue;
    }
    bindings.add(clause.namedBindings.name.text);
  }
  return bindings;
}

/**
 * Returns true when `expr` is an identifier whose name matches `name` AND
 * that name is listed in `knownBindings` from a recognized import.
 */
export function isCnOrTvIdentifier(
  expr: ts.Expression,
  name: "cn" | "tv",
  knownBindings: Set<string> = EMPTY_CN_TV_BINDINGS,
): boolean {
  if (knownBindings.size === 0) {
    return false;
  }
  if (ts.isIdentifier(expr) && expr.text === name) {
    return knownBindings.has(expr.text);
  }
  if (ts.isPropertyAccessExpression(expr) && expr.name.text === name) {
    return ts.isIdentifier(expr.expression) && knownBindings.has(expr.expression.text);
  }
  return false;
}

export function propertyAssignmentNameText(prop: ts.PropertyAssignment): string | undefined {
  if (ts.isIdentifier(prop.name)) {
    return prop.name.text;
  }
  if (ts.isStringLiteral(prop.name)) {
    return prop.name.text;
  }
  return undefined;
}

export function lineOf(sf: ts.SourceFile, tsNode: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(tsNode.getStart(sf)).line + 1;
}

/**
 * Returns only the leading whitespace (tabs / spaces) of the line containing
 * `pos`.
 */
export function indentOfLineContaining(source: string, pos: number): string {
  const searchPos = Math.max(0, Math.min(pos, source.length));
  const prevLineBreak = Math.max(
    source.lastIndexOf("\n", searchPos - 1),
    source.lastIndexOf("\r", searchPos - 1),
  );
  const lineStart = prevLineBreak === -1 ? 0 : prevLineBreak + 1;

  let lineEnd = source.length;
  for (let i = lineStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\n" || ch === "\r") {
      lineEnd = i;
      break;
    }
  }

  const line = source.slice(lineStart, lineEnd);
  const indentMatch = /^[\t ]*/.exec(line);
  return indentMatch?.[0] ?? "";
}

export function applyEditsDescending(
  sourceText: string,
  edits: ReadonlyArray<{ start: number; end: number; replacement: string }>,
): string {
  const sorted = [...edits].sort((editA, editB) => editB.start - editA.start);
  let out = sourceText;
  for (const edit of sorted) {
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }
  return out;
}

/**
 * Replace `cn(...)` nested in `tv({...})` with a plain string (one arg) or a string
 * array (multiple args). Returns undefined when there are zero arguments.
 */
export function unwrapCnInsideTvCallReplacement(
  call: ts.CallExpression,
  sourceText: string,
  sf: ts.SourceFile,
): string | undefined {
  const args = call.arguments;
  if (args.length === 0) {
    return undefined;
  }
  const baseIndent = indentOfLineContaining(sourceText, call.getStart(sf));
  const innerIndent = `${baseIndent}  `;
  if (args.length === 1) {
    const firstArg = args[0]!;
    return sourceText.slice(firstArg.getStart(sf), firstArg.getEnd());
  }
  const lines: string[] = ["["];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const piece = sourceText.slice(arg.getStart(sf), arg.getEnd());
    // Trailing comma on every element — intentional (Prettier-compatible style;
    // keeps array diffs clean when arguments are later added or removed).
    const comma = i < args.length - 1 || args.length > 1 ? "," : "";
    lines.push(`${innerIndent}${piece}${comma}`);
  }
  lines.push(`${baseIndent}]`);
  return lines.join("\n");
}

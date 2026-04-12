import ts from "typescript";
import { EMPTY_CN_TV_BINDINGS } from "#lib/arrange/constants";

/** Known module specifiers that export `cn` / `tv`. */
export const KNOWN_CN_TV_MODULES = new Set([
  "@codefast/tailwind-variants",
  "clsx",
  "class-variance-authority",
  "tailwind-variants",
  "#lib/utils",
  "~/lib/utils",
  "@/lib/utils",
]);

/**
 * True for typical shadcn-style re-exports: `./utils`, `@/lib/utils`, `…/utils/…`,
 * or a dedicated `cn.ts` / `cn.tsx` module.
 */
export function moduleLooksLikeCnTvReexport(mod: string): boolean {
  const norm = mod.replace(/\\/g, "/");
  if (/(?:^|[./])utils(?:\/|$)/.test(norm)) return true;
  if (/\/utils\//.test(norm) || /\/utils$/.test(norm)) return true;
  if (/(?:^|\/)cn\.tsx?$/.test(norm)) return true;
  return false;
}

/**
 * Build a set of local binding names that are imported from a known cn/tv
 * module in `sf`.
 */
export function buildKnownCnTvBindings(sf: ts.SourceFile): Set<string> {
  const bindings = new Set<string>();
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
    const spec = stmt.moduleSpecifier;
    if (!ts.isStringLiteral(spec)) continue;
    const mod = spec.text;
    const isKnown = KNOWN_CN_TV_MODULES.has(mod);
    if (!isKnown && !moduleLooksLikeCnTvReexport(mod)) continue;

    const clause = stmt.importClause;
    if (clause.name) bindings.add(clause.name.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        bindings.add(el.name.text);
      }
    }
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
  if (!ts.isIdentifier(expr) || expr.text !== name) return false;
  if (knownBindings.size === 0) return false;
  return knownBindings.has(expr.text);
}

export function propertyAssignmentNameText(prop: ts.PropertyAssignment): string | undefined {
  if (ts.isIdentifier(prop.name)) return prop.name.text;
  if (ts.isStringLiteral(prop.name)) return prop.name.text;
  return undefined;
}

export function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

/**
 * Returns only the leading whitespace (tabs / spaces) of the line containing
 * `pos`.
 */
export function indentOfLineContaining(source: string, pos: number): string {
  let lineStart = pos;
  while (lineStart > 0) {
    const charBefore = source[lineStart - 1];
    if (charBefore === "\n" || charBefore === "\r") break;
    lineStart--;
  }
  const nextNewline = source.indexOf("\n", pos);
  const line = source.slice(lineStart, nextNewline === -1 ? undefined : nextNewline);
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
  if (args.length === 0) return undefined;
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
    const comma = i < args.length - 1 || args.length > 1 ? "," : "";
    lines.push(`${innerIndent}${piece}${comma}`);
  }
  lines.push(`${baseIndent}]`);
  return lines.join("\n");
}

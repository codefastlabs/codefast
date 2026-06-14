import {
  forEachDomainChild,
  isDomainArrayLiteralExpression,
  isDomainCallExpression,
  isDomainJsxAttribute,
  isDomainJsxExpression,
  isDomainObjectLiteralExpression,
  isDomainPropertyAssignment,
  isDomainSpreadElement,
  isDomainTailwindClassLiteral,
} from "#/arrange/domain/ast/ast-node";
import type {
  DomainAstNode,
  DomainCallExpression,
  DomainObjectLiteralExpression,
  DomainSourceFile,
} from "#/arrange/domain/ast/ast-node";
import { buildKnownCnTvBindings, isCnOrTvIdentifier } from "#/arrange/domain/ast/helpers";
import { MAX_OBJECT_DEPTH } from "#/arrange/domain/constants";
import { escapeTsStringLiteralContent } from "#/arrange/domain/source-text-formatters";
import { indentOfLineContaining } from "#/core/source-text-edit";

/**
 * @since 0.3.16-canary.0
 */
export type PlannedSimplifyEdit = {
  start: number;
  end: number;
  replacement: string;
  label: string;
};

function toFlatString(text: string): string {
  return `"${escapeTsStringLiteralContent(text.trim())}"`;
}

function joinLiterals(args: ReadonlyArray<DomainAstNode>): string {
  return args
    .filter(isDomainTailwindClassLiteral)
    .map((lit) => lit.text)
    .join(" ");
}

function isAllStaticLiterals(args: ReadonlyArray<DomainAstNode>): boolean {
  return args.length > 0 && args.every(isDomainTailwindClassLiteral);
}

// ---------------------------------------------------------------------------
// Mixed cn() merge: ALL static args → one string first, dynamic args follow
// ---------------------------------------------------------------------------

/**
 * For a cn() call that has both static and dynamic args:
 * - Merge ALL static string literals (regardless of position) into one string.
 * - Place the merged string first.
 * - Append all dynamic args in their original relative order.
 *
 * Returns `null` when nothing changes (0 statics, or already 1 static at arg[0]).
 */
function buildMixedCnReplacement(call: DomainCallExpression, sourceText: string): string | null {
  const args = [...call.arguments];
  if (args.length === 0) {
    return null;
  }

  const staticTexts: Array<string> = [];
  const dynamicSrcs: Array<string> = [];

  for (const arg of args) {
    if (isDomainTailwindClassLiteral(arg)) {
      staticTexts.push(arg.text);
    } else {
      dynamicSrcs.push(sourceText.slice(arg.pos, arg.end));
    }
  }

  if (staticTexts.length === 0) {
    return null;
  }

  // Already simplest form: 1 static arg already at the front.
  const firstArg = args[0];
  if (staticTexts.length === 1 && firstArg !== undefined && isDomainTailwindClassLiteral(firstArg)) {
    return null;
  }

  const flatStatic = staticTexts.join(" ").trim();
  const baseIndent = indentOfLineContaining(sourceText, call.pos);
  const argIndent = `${baseIndent}  `;
  const lines = [
    `${argIndent}"${escapeTsStringLiteralContent(flatStatic)}",`,
    ...dynamicSrcs.map((src) => `${argIndent}${src},`),
  ];
  return `cn(\n${lines.join("\n")}\n${baseIndent})`;
}

// ---------------------------------------------------------------------------
// tv() array collector
// ---------------------------------------------------------------------------

function collectTvArrayEdits(
  obj: DomainObjectLiteralExpression,
  results: Array<PlannedSimplifyEdit>,
  depth: number,
): void {
  if (depth > MAX_OBJECT_DEPTH) {
    return;
  }
  for (const prop of obj.properties) {
    if (!isDomainPropertyAssignment(prop)) {
      continue;
    }
    const init = prop.initializer;
    if (isDomainArrayLiteralExpression(init)) {
      const elements = [...init.elements];
      const hasSpread = elements.some(isDomainSpreadElement);
      if (!hasSpread && elements.length > 0 && isAllStaticLiterals(elements)) {
        results.push({
          start: init.pos,
          end: init.end,
          replacement: toFlatString(joinLiterals(elements)),
          label: "tv-array",
        });
      }
    } else if (isDomainObjectLiteralExpression(init)) {
      collectTvArrayEdits(init, results, depth + 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Public collector
// ---------------------------------------------------------------------------

/**
 * Collect all simplify edits for a source file:
 * - Arrays of pure string literals inside tv() slots → flat string
 * - cn() calls whose every argument is a static string literal → flat string (unwrap cn)
 * - cn() calls with mixed static + dynamic args → merge adjacent statics into one string
 * - JSX className={cn(...all-static...)} → className="flat string"
 *
 * @since 0.3.16-canary.0
 */
export function collectSimplifyTargets(sourceFile: DomainSourceFile): Array<PlannedSimplifyEdit> {
  const sourceText = sourceFile.text;
  const results: Array<PlannedSimplifyEdit> = [];
  const knownBindings = buildKnownCnTvBindings(sourceFile);
  const seenCnPos = new Set<number>();

  const visitNode = (node: DomainAstNode): void => {
    if (isDomainCallExpression(node)) {
      if (isCnOrTvIdentifier(node.expression, "tv", knownBindings)) {
        const arg0 = node.arguments[0];
        if (arg0 && isDomainObjectLiteralExpression(arg0)) {
          collectTvArrayEdits(arg0, results, 0);
        }
      } else if (isCnOrTvIdentifier(node.expression, "cn", knownBindings) && !seenCnPos.has(node.pos)) {
        seenCnPos.add(node.pos);
        const args = [...node.arguments];

        if (isAllStaticLiterals(args)) {
          // All static → remove cn() wrapper entirely
          const flat = joinLiterals(args);
          const parent = node.parent;
          if (parent && isDomainJsxExpression(parent) && parent.parent && isDomainJsxAttribute(parent.parent)) {
            // className={cn("a", "b")} → className="a b"
            results.push({
              start: parent.pos,
              end: parent.end,
              replacement: toFlatString(flat),
              label: "jsx-cn",
            });
          } else {
            results.push({
              start: node.pos,
              end: node.end,
              replacement: toFlatString(flat),
              label: "cn-static",
            });
          }
        } else {
          // Mixed static + dynamic → merge adjacent statics
          const replacement = buildMixedCnReplacement(node, sourceText);
          if (replacement !== null) {
            results.push({
              start: node.pos,
              end: node.end,
              replacement,
              label: "cn-merge",
            });
          }
        }
      }
    }
    forEachDomainChild(node, visitNode);
  };

  for (const stmt of sourceFile.statements) {
    visitNode(stmt);
  }

  return results;
}

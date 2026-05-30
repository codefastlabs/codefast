import { MAX_OBJECT_DEPTH } from "#/arrange/domain/constants";
import { escapeTsStringLiteralContent } from "#/arrange/domain/source-text-formatters";
import { buildKnownCnTvBindings, isCnOrTvIdentifier } from "#/arrange/domain/ast/helpers";
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
  DomainObjectLiteralExpression,
  DomainSourceFile,
} from "#/arrange/domain/ast/ast-node";

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

/**
 * Collect all simplify edits for a source file:
 * - Arrays of pure string literals inside tv() slots → flat string
 * - cn() calls whose every argument is a static string literal → flat string (unwrap cn)
 * - JSX className={cn(...all-static...)} → className="flat string"
 *
 * @since 0.3.16-canary.0
 */
export function collectSimplifyTargets(sourceFile: DomainSourceFile): Array<PlannedSimplifyEdit> {
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
      } else if (
        isCnOrTvIdentifier(node.expression, "cn", knownBindings) &&
        !seenCnPos.has(node.pos) &&
        isAllStaticLiterals([...node.arguments])
      ) {
        seenCnPos.add(node.pos);
        const flat = joinLiterals([...node.arguments]);
        const parent = node.parent;
        if (
          parent &&
          isDomainJsxExpression(parent) &&
          parent.parent &&
          isDomainJsxAttribute(parent.parent)
        ) {
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
      }
    }
    forEachDomainChild(node, visitNode);
  };

  for (const stmt of sourceFile.statements) {
    visitNode(stmt);
  }

  return results;
}

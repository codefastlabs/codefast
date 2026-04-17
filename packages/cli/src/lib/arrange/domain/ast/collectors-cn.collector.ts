import { MAX_CLASS_EXPR_DEPTH } from "#/lib/arrange/domain/constants.domain";
import type {
  ForEachStringLiteralInClassExpressionOptions,
  TailwindClassLiteral,
} from "#/lib/arrange/domain/types.domain";
import {
  DomainBinaryOperator,
  DomainSyntaxKind,
  type DomainAstNode,
  isDomainArrayLiteralExpression,
  isDomainTailwindClassLiteral,
} from "#/lib/arrange/domain/ast/ast-node.model";

export function forEachStringLiteralInClassExpression(
  expr: DomainAstNode,
  sink: (classLiteral: TailwindClassLiteral) => void,
  depth = 0,
  options?: ForEachStringLiteralInClassExpressionOptions,
): void {
  if (depth > MAX_CLASS_EXPR_DEPTH) {
    return;
  }

  if (isDomainTailwindClassLiteral(expr)) {
    sink(expr);
    return;
  }

  if (expr.kind === DomainSyntaxKind.ParenthesizedExpression) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (
    expr.kind === DomainSyntaxKind.AsExpression ||
    expr.kind === DomainSyntaxKind.SatisfiesExpression
  ) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (expr.kind === DomainSyntaxKind.NonNullExpression) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (expr.kind === DomainSyntaxKind.ConditionalExpression) {
    if (options?.descendIntoConditional === false) {
      return;
    }
    forEachStringLiteralInClassExpression(expr.whenTrue, sink, depth + 1, options);
    forEachStringLiteralInClassExpression(expr.whenFalse, sink, depth + 1, options);
    return;
  }

  if (
    expr.kind === DomainSyntaxKind.BinaryExpression &&
    expr.operator === DomainBinaryOperator.Plus
  ) {
    forEachStringLiteralInClassExpression(expr.left, sink, depth + 1, options);
    forEachStringLiteralInClassExpression(expr.right, sink, depth + 1, options);
    return;
  }

  if (isDomainArrayLiteralExpression(expr)) {
    for (const arrayElement of expr.elements) {
      if (arrayElement.kind === DomainSyntaxKind.SpreadElement) {
        continue;
      }
      forEachStringLiteralInClassExpression(arrayElement, sink, depth + 1, options);
    }
  }
}

export function isUnsafeLiteralForCnStyleApplySplit(classLiteral: TailwindClassLiteral): boolean {
  return classLiteral.parent !== null && isDomainArrayLiteralExpression(classLiteral.parent);
}

export const CN_APPLY_LITERAL_WALK_OPTS: ForEachStringLiteralInClassExpressionOptions = {
  descendIntoConditional: false,
};

export function collectUnconditionalTailwindLiteralsFromCnArguments(
  args: readonly DomainAstNode[],
): TailwindClassLiteral[] {
  const staticLits: TailwindClassLiteral[] = [];
  for (const arg of args) {
    if (isDomainTailwindClassLiteral(arg)) {
      if (!isUnsafeLiteralForCnStyleApplySplit(arg)) {
        staticLits.push(arg);
      }
    } else {
      forEachStringLiteralInClassExpression(
        arg,
        (lit) => {
          if (!isUnsafeLiteralForCnStyleApplySplit(lit)) {
            staticLits.push(lit);
          }
        },
        0,
        CN_APPLY_LITERAL_WALK_OPTS,
      );
    }
  }
  return staticLits;
}

import ts from "typescript";
import { MAX_CLASS_EXPR_DEPTH } from "#lib/arrange/domain/constants";
import type {
  ForEachStringLiteralInClassExpressionOptions,
  TailwindClassLiteral,
} from "#lib/arrange/domain/types";

export function forEachStringLiteralInClassExpression(
  expr: ts.Expression,
  sink: (classLiteral: TailwindClassLiteral) => void,
  depth = 0,
  options?: ForEachStringLiteralInClassExpressionOptions,
): void {
  if (depth > MAX_CLASS_EXPR_DEPTH) {
    return;
  }

  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    sink(expr);
    return;
  }

  if (ts.isParenthesizedExpression(expr)) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr)) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (ts.isNonNullExpression(expr)) {
    forEachStringLiteralInClassExpression(expr.expression, sink, depth + 1, options);
    return;
  }

  if (ts.isConditionalExpression(expr)) {
    if (options?.descendIntoConditional === false) {
      return;
    }
    forEachStringLiteralInClassExpression(expr.whenTrue, sink, depth + 1, options);
    forEachStringLiteralInClassExpression(expr.whenFalse, sink, depth + 1, options);
    return;
  }

  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    forEachStringLiteralInClassExpression(expr.left, sink, depth + 1, options);
    forEachStringLiteralInClassExpression(expr.right, sink, depth + 1, options);
    return;
  }

  if (ts.isArrayLiteralExpression(expr)) {
    for (const arrayElement of expr.elements) {
      if (ts.isSpreadElement(arrayElement)) {
        continue;
      }
      forEachStringLiteralInClassExpression(arrayElement, sink, depth + 1, options);
    }
  }
}

export function isUnsafeLiteralForCnStyleApplySplit(classLiteral: TailwindClassLiteral): boolean {
  return ts.isArrayLiteralExpression(classLiteral.parent);
}

export const CN_APPLY_LITERAL_WALK_OPTS: ForEachStringLiteralInClassExpressionOptions = {
  descendIntoConditional: false,
};

export function collectUnconditionalTailwindLiteralsFromCnArguments(
  args: ts.NodeArray<ts.Expression>,
): TailwindClassLiteral[] {
  const staticLits: TailwindClassLiteral[] = [];
  for (const arg of args) {
    if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
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

export function mergeCnUnconditionalLiteralPoolForTest(
  argsSnippet: string,
  options?: { callee?: string },
): string {
  const callee = options?.callee ?? "cn";
  const sourceText = `${callee}(${argsSnippet});`;
  const sf = ts.createSourceFile(
    "mergeCnUnconditionalLiteralPoolForTest.ts",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const stmt = sf.statements[0];
  if (!ts.isExpressionStatement(stmt)) {
    throw new Error("expected expression statement");
  }
  const call = stmt.expression;
  if (
    !ts.isCallExpression(call) ||
    !ts.isIdentifier(call.expression) ||
    call.expression.text !== callee
  ) {
    throw new Error(`expected ${callee}(...) call`);
  }
  return collectUnconditionalTailwindLiteralsFromCnArguments(call.arguments)
    .map((literal) => literal.text)
    .join(" ");
}

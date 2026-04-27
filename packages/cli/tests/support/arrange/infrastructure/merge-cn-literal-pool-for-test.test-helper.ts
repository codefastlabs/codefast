import {
  isDomainCallExpression,
  isDomainExpressionStatement,
  isDomainIdentifier,
} from "#/lib/arrange/domain/ast/ast-node.model";
import { collectUnconditionalTailwindLiteralsFromCnArguments } from "#/lib/arrange/domain/ast/collectors-cn.collector";
import { parseDomainSourceFile } from "#/lib/arrange/infrastructure/ts-ast-translator.util";

/**
 * Test / REPL helper: parse `callee(<snippet>)` and return merged unconditional literal text.
 * Lives in infrastructure because parsing uses the TypeScript-backed translator.
 */
export function mergeCnUnconditionalLiteralPoolForTest(
  argsSnippet: string,
  options?: { callee?: string },
): string {
  const callee = options?.callee ?? "cn";
  const sourceText = `${callee}(${argsSnippet});`;
  const domainSf = parseDomainSourceFile("mergeCnUnconditionalLiteralPoolForTest.ts", sourceText);
  const stmt = domainSf.statements[0];
  if (stmt === undefined) {
    throw new Error("expected one statement");
  }
  if (!isDomainExpressionStatement(stmt)) {
    throw new Error("expected expression statement");
  }
  const call = stmt.expression;
  if (
    !isDomainCallExpression(call) ||
    !isDomainIdentifier(call.expression) ||
    call.expression.text !== callee
  ) {
    throw new Error(`expected ${callee}(...) call`);
  }
  return collectUnconditionalTailwindLiteralsFromCnArguments(call.arguments)
    .map((literal) => literal.text)
    .join(" ");
}

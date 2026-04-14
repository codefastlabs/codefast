import ts from "typescript";
import type { JsxClassNameStatic } from "#lib/arrange/types";

export function jsxClassNameStaticLiteral(
  jsxClassNameAttribute: ts.JsxAttribute,
): JsxClassNameStatic | undefined {
  if (
    !ts.isIdentifier(jsxClassNameAttribute.name) ||
    jsxClassNameAttribute.name.text !== "className"
  )
    return undefined;
  const init = jsxClassNameAttribute.initializer;
  if (!init) return undefined;

  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return { lit: init, valueNode: init };
  }
  if (ts.isJsxExpression(init) && init.expression) {
    const jsxExpressionBody = init.expression;
    if (
      ts.isStringLiteral(jsxExpressionBody) ||
      ts.isNoSubstitutionTemplateLiteral(jsxExpressionBody)
    ) {
      return { lit: jsxExpressionBody, valueNode: init };
    }
  }
  return undefined;
}

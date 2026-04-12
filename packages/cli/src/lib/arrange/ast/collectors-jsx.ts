import ts from "typescript";
import type { JsxClassNameStatic } from "#lib/arrange/types";

export function jsxClassNameStaticLiteral(attr: ts.JsxAttribute): JsxClassNameStatic | undefined {
  if (!ts.isIdentifier(attr.name) || attr.name.text !== "className") return undefined;
  const init = attr.initializer;
  if (!init) return undefined;

  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return { lit: init, valueNode: init };
  }
  if (ts.isJsxExpression(init) && init.expression) {
    const ex = init.expression;
    if (ts.isStringLiteral(ex) || ts.isNoSubstitutionTemplateLiteral(ex)) {
      return { lit: ex, valueNode: init };
    }
  }
  return undefined;
}

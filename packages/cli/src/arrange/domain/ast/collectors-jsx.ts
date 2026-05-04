import {
  isDomainIdentifier,
  isDomainJsxExpression,
  isDomainTailwindClassLiteral,
} from "#/arrange/domain/ast/ast-node";
import type { DomainJsxAttribute } from "#/arrange/domain/ast/ast-node";
import type { JsxClassNameStatic } from "#/arrange/domain/types";

export function jsxClassNameStaticLiteral(
  jsxClassNameAttribute: DomainJsxAttribute,
): JsxClassNameStatic | undefined {
  if (
    !isDomainIdentifier(jsxClassNameAttribute.name) ||
    jsxClassNameAttribute.name.text !== "className"
  ) {
    return undefined;
  }
  const init = jsxClassNameAttribute.initializer;
  if (!init) {
    return undefined;
  }

  if (isDomainTailwindClassLiteral(init)) {
    return { lit: init, valueNode: init };
  }
  if (isDomainJsxExpression(init) && init.expression) {
    const jsxExpressionBody = init.expression;
    if (isDomainTailwindClassLiteral(jsxExpressionBody)) {
      return { lit: jsxExpressionBody, valueNode: init };
    }
  }
  return undefined;
}

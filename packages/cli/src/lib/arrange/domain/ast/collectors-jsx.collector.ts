import {
  type DomainJsxAttribute,
  isDomainIdentifier,
  isDomainJsxExpression,
  isDomainTailwindClassLiteral,
} from "#/lib/arrange/domain/ast/ast-node.model";
import type { JsxClassNameStatic } from "#/lib/arrange/domain/types.domain";

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

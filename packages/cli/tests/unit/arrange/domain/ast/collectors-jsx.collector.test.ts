import { jsxClassNameStaticLiteral } from "#/lib/arrange/domain/ast/collectors-jsx.collector";
import {
  findFirstDomainDescendantWhere,
  isDomainJsxAttribute,
} from "#/lib/arrange/domain/ast/ast-node.model";
import { parseDomainSourceFile } from "#/lib/arrange/infrastructure/ts-ast-translator.adapter";

function firstJsxClassAttr(source: string) {
  const domainSf = parseDomainSourceFile("x.tsx", source);
  const attr = findFirstDomainDescendantWhere(domainSf, isDomainJsxAttribute);
  if (!attr || !isDomainJsxAttribute(attr)) {
    throw new Error("expected jsx attribute");
  }
  return attr;
}

describe("jsxClassNameStaticLiteral", () => {
  it("extracts direct string literal className", () => {
    const attr = firstJsxClassAttr('const node = <div className="flex gap-2" />;');
    const result = jsxClassNameStaticLiteral(attr);
    expect(result?.lit.text).toBe("flex gap-2");
  });

  it("extracts className string inside JSX expression", () => {
    const attr = firstJsxClassAttr('const node = <div className={"flex gap-2"} />;');
    const result = jsxClassNameStaticLiteral(attr);
    expect(result?.lit.text).toBe("flex gap-2");
  });
});

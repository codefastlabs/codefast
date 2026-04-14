import ts from "typescript";
import { jsxClassNameStaticLiteral } from "#lib/arrange/domain/ast/collectors-jsx";

function firstJsxClassAttr(source: string): ts.JsxAttribute {
  const sf = ts.createSourceFile("x.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const stmt = sf.statements[0] as ts.VariableStatement;
  const decl = stmt.declarationList.declarations[0]!;
  const jsx = decl.initializer as ts.JsxSelfClosingElement;
  const attr = jsx.attributes.properties[0];
  if (!attr || !ts.isJsxAttribute(attr)) throw new Error("expected jsx attribute");
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

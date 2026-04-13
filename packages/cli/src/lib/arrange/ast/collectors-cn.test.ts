import ts from "typescript";
import {
  forEachStringLiteralInClassExpression,
  mergeCnUnconditionalLiteralPoolForTest,
} from "#lib/arrange";
import { MAX_CLASS_EXPR_DEPTH } from "#lib/arrange/constants";

describe("forEachStringLiteralInClassExpression", () => {
  function literalsFromArgSnippet(
    snippet: string,
    walk?: { descendIntoConditional?: boolean },
  ): string[] {
    const sf = ts.createSourceFile(
      "x.ts",
      `cn(${snippet});`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const stmt = sf.statements[0] as ts.ExpressionStatement;
    const call = stmt.expression as ts.CallExpression;
    const arg0 = call.arguments[0]!;
    const out: string[] = [];
    forEachStringLiteralInClassExpression(arg0, (n) => out.push(n.text), 0, walk);
    return out;
  }

  it("collects both branches of conditionals by default", () => {
    expect(literalsFromArgSnippet('x ? "a" : "b"')).toEqual(["a", "b"]);
  });

  it("skips conditional branches when configured", () => {
    expect(literalsFromArgSnippet('x ? "a" : "b"', { descendIntoConditional: false })).toEqual([]);
  });

  it("walks nested arrays and assertions", () => {
    expect(literalsFromArgSnippet('["p", (("q" as const))]')).toEqual(["p", "q"]);
  });

  it("documents that traversal stops safely when class expression depth exceeds the configured limit", () => {
    let expr = '"deep-token"';
    for (let i = 0; i < MAX_CLASS_EXPR_DEPTH + 2; i += 1) {
      expr = `[${expr}]`;
    }
    const sf = ts.createSourceFile(
      "x.ts",
      `cn(${expr});`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const stmt = sf.statements[0] as ts.ExpressionStatement;
    const call = stmt.expression as ts.CallExpression;
    const arg0 = call.arguments[0]!;
    const out: string[] = [];
    expect(() => {
      forEachStringLiteralInClassExpression(arg0, (n) => out.push(n.text), 0);
    }).not.toThrow();
    expect(out).toEqual([]);
  });
});

describe("mergeCnUnconditionalLiteralPoolForTest", () => {
  it("does not merge classes from mutually exclusive ternary branches", () => {
    const pool = mergeCnUnconditionalLiteralPoolForTest(
      '"flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center"',
    );
    expect(pool).toBe("flex flex-1 justify-between leading-none");
  });

  it("collects only unconditional literals", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('"a b", cond ? "c" : "d"')).toBe("a b");
  });

  it("supports aliased callee names", () => {
    expect(
      mergeCnUnconditionalLiteralPoolForTest('"a b", cond ? "c" : "d"', { callee: "cx" }),
    ).toBe("a b");
  });

  it("returns empty when every arg is ternary", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('x ? "a" : "b"')).toBe("");
  });

  it("skips cn([...]) array arg literals for apply pool", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('["foo", nest ? "a" : "b"]')).toBe("");
  });

  it("collects parenthesized string literal arg", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest('(("flex gap-2" as const))')).toBe("flex gap-2");
  });

  it("collects no-substitution template literal arg", () => {
    expect(mergeCnUnconditionalLiteralPoolForTest("`flex gap-2`")).toBe("flex gap-2");
  });
});

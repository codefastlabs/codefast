import ts from "typescript";
import {
  KNOWN_CN_TV_MODULES,
  applyEditsDescending,
  buildKnownCnTvBindings,
  isCnOrTvIdentifier,
  lineOf,
  moduleLooksLikeCnTvReexport,
  unwrapCnInsideTvCallReplacement,
} from "#lib/arrange";
import { indentOfLineContaining } from "#lib/arrange/ast/utils";

function parseCallee(source: string): ts.Expression {
  const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const stmt = sf.statements[0];
  if (!ts.isExpressionStatement(stmt)) throw new Error("expected expression statement");
  if (!ts.isCallExpression(stmt.expression)) throw new Error("expected call expression");
  return stmt.expression.expression;
}

describe("indentOfLineContaining", () => {
  it("handles CRLF files", () => {
    const src = "a\r\n  b\r\n\tc";
    expect(indentOfLineContaining(src, src.indexOf("b"))).toBe("  ");
  });

  it("handles CR-only line endings", () => {
    const src = "a\r\t  b\rc";
    expect(indentOfLineContaining(src, src.indexOf("b"))).toBe("\t  ");
  });

  it("supports pos at start and end of source", () => {
    const src = "x\n  y\n";
    expect(indentOfLineContaining(src, 0)).toBe("");
    expect(indentOfLineContaining(src, src.length)).toBe("");
  });

  it("returns mixed tab/space indentation", () => {
    const src = "\t  line";
    expect(indentOfLineContaining(src, src.indexOf("line"))).toBe("\t  ");
  });
});

describe("applyEditsDescending", () => {
  it("returns original text for empty edits", () => {
    expect(applyEditsDescending("abc", [])).toBe("abc");
  });

  it("applies multiple edits at start/middle/end", () => {
    const out = applyEditsDescending("abcdef", [
      { start: 0, end: 1, replacement: "A" },
      { start: 2, end: 4, replacement: "CD" },
      { start: 5, end: 6, replacement: "F" },
    ]);
    expect(out).toBe("AbCDeF");
  });
});

describe("buildKnownCnTvBindings", () => {
  it("collects default, named alias, and namespace bindings", () => {
    const sf = ts.createSourceFile(
      "x.ts",
      [
        'import tvDefault, { cn as cx } from "tailwind-variants";',
        'import * as tw from "tailwind-variants";',
      ].join("\n"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    expect(buildKnownCnTvBindings(sf)).toEqual(new Set(["tvDefault", "cx", "tw"]));
  });

  it("ignores type-only and unknown-module imports", () => {
    const sf = ts.createSourceFile(
      "x.ts",
      ['import type { cn } from "tailwind-variants";', 'import { cn } from "lodash";'].join("\n"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    expect(buildKnownCnTvBindings(sf)).toEqual(new Set<string>());
  });
});

describe("known cn/tv module helpers", () => {
  it("includes canonical shadcn-style module specifiers", () => {
    expect(KNOWN_CN_TV_MODULES.has("#lib/utils")).toBe(true);
    expect(KNOWN_CN_TV_MODULES.has("@codefast/tailwind-variants")).toBe(true);
  });

  it.each([
    ["./utils", true],
    ["pkg/utils/cn", true],
    ["./cn.ts", true],
    ["lodash", false],
  ] as const)("moduleLooksLikeCnTvReexport(%s) -> %s", (mod, expected) => {
    expect(moduleLooksLikeCnTvReexport(mod)).toBe(expected);
  });
});

describe("isCnOrTvIdentifier", () => {
  const known = new Set(["cn", "tv", "tw"]);

  it("matches identifier calls", () => {
    expect(isCnOrTvIdentifier(parseCallee("cn('a');"), "cn", known)).toBe(true);
    expect(isCnOrTvIdentifier(parseCallee("tv({});"), "tv", known)).toBe(true);
  });

  it("matches property access with known namespace binding", () => {
    expect(isCnOrTvIdentifier(parseCallee("tw.cn('a');"), "cn", known)).toBe(true);
    expect(isCnOrTvIdentifier(parseCallee("tw.tv({});"), "tv", known)).toBe(true);
  });

  it("returns false for unknown namespace and non-identifier base", () => {
    expect(isCnOrTvIdentifier(parseCallee("utils2.cn('a');"), "cn", known)).toBe(false);
    expect(isCnOrTvIdentifier(parseCallee("getNs().cn('a');"), "cn", known)).toBe(false);
  });
});

describe("unwrapCnInsideTvCallReplacement", () => {
  it("unwraps single arg to argument source", () => {
    const src = 'cn("flex gap-2")';
    const sf = ts.createSourceFile("x.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const expr = (sf.statements[0] as ts.ExpressionStatement).expression as ts.CallExpression;
    expect(unwrapCnInsideTvCallReplacement(expr, src, sf)).toBe('"flex gap-2"');
  });

  it("unwraps multiple args to multiline array", () => {
    const src = 'cn("flex gap-2", "text-sm")';
    const sf = ts.createSourceFile("x.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const expr = (sf.statements[0] as ts.ExpressionStatement).expression as ts.CallExpression;
    expect(unwrapCnInsideTvCallReplacement(expr, src, sf)).toBe(
      ["[", '  "flex gap-2",', '  "text-sm",', "]"].join("\n"),
    );
  });

  it("returns undefined for zero args", () => {
    const sf = ts.createSourceFile("x.ts", "cn()", ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const expr = (sf.statements[0] as ts.ExpressionStatement).expression as ts.CallExpression;
    expect(unwrapCnInsideTvCallReplacement(expr, "cn()", sf)).toBeUndefined();
  });
});

describe("lineOf", () => {
  it("returns 1-based line number for node start", () => {
    const src = ["const a = 1;", "const b = 2;", "const c = 3;"].join("\n");
    const sf = ts.createSourceFile("x.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const stmt = sf.statements[1]!;
    expect(lineOf(sf, stmt)).toBe(2);
  });
});

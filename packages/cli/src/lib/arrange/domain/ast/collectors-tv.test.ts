import ts from "typescript";
import { buildKnownCnTvBindings } from "#lib/arrange";
import {
  collectCnCallsInsideTv,
  collectGroupableStringNodes,
  listAllCnCallsInsideTvInSourceFile,
  slotClassString,
  traverseTvObject,
} from "#lib/arrange/domain/ast/collectors-tv";
import { MAX_OBJECT_DEPTH } from "#lib/arrange/domain/constants";

describe("collectGroupableStringNodes", () => {
  it("collects cn/tv static class slots eligible for grouping", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3"),
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(slotClassString(nodes[0]!)).toContain("flex gap-2");
  });

  it("collects tv array slots without cn()", () => {
    const source = `import { tv } from "@codefast/tailwind-variants";
export const styles = tv({
  base: ["flex gap-2 text-sm rounded-md border px-3", "shadow-xs"],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.some((stringNode) => slotClassString(stringNode).includes("shadow-xs"))).toBe(
      true,
    );
  });

  it("collects compoundVariants className string slots", () => {
    const source = `import { tv } from "@codefast/tailwind-variants";
export const styles = tv({
  compoundVariants: [{ className: "flex gap-2 text-sm rounded-md border px-3" }],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it("collects compoundVariants class array with mixed strings and cn()", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({
  compoundVariants: [{ class: ["py-1", cn("flex gap-2 text-sm rounded-md border px-3")] }],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.some((stringNode) => slotClassString(stringNode).includes("flex gap-2"))).toBe(
      true,
    );
  });

  it("collects direct cn(...) entries inside tv arrays and ignores unsafe nested array literals", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({
  base: [cn(["skip-a", "skip-b"]), cn("flex gap-2 text-sm rounded-md border px-3")],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(
      nodes.some((stringNode) => slotClassString(stringNode).includes("flex gap-2 text-sm")),
    ).toBe(true);
    expect(nodes.some((stringNode) => slotClassString(stringNode).includes("skip-a"))).toBe(false);
  });

  it("collects compoundVariants class set directly to cn(...) call", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({
  compoundVariants: [{ class: cn("flex gap-2 text-sm rounded-md border px-3") }],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(
      nodes.some((stringNode) => slotClassString(stringNode).includes("rounded-md border px-3")),
    ).toBe(true);
  });

  it("returns empty when file has no cn/tv candidates", () => {
    const sf = ts.createSourceFile(
      "x.ts",
      "export const only = 1;",
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    expect(collectGroupableStringNodes(sf)).toEqual([]);
  });

  it("documents that tv object traversal stops safely when nesting exceeds the configured depth limit", () => {
    let nestedObject = '{ className: "flex gap-2 text-sm rounded-md border px-3" }';
    for (let i = 0; i < MAX_OBJECT_DEPTH + 2; i += 1) {
      nestedObject = `{ layer${i}: ${nestedObject} }`;
    }
    const source = `import { tv } from "@codefast/tailwind-variants";
export const styles = tv(${nestedObject});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    expect(() => collectGroupableStringNodes(sf)).not.toThrow();
    expect(collectGroupableStringNodes(sf)).toEqual([]);
  });

  it("accepts legacy tailwind-variants import for tv slot collection (backward compat)", () => {
    const source = `import { cn, tv } from "tailwind-variants";
export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3"),
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(slotClassString(nodes[0]!)).toContain("flex gap-2");
  });
});

describe("tv collector helpers", () => {
  it("traverseTvObject visits nested className/class string literals and cn call literals", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
const cfg = {
  base: [{ className: ["flex gap-2", "text-sm"] }, { class: cn("rounded-md border", "px-3") }],
  variants: {
    intent: { primary: { className: "font-medium shadow-xs" } },
  },
};
tv(cfg);
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const knownBindings = buildKnownCnTvBindings(sf);
    const stmt = sf.statements[1] as ts.VariableStatement;
    const decl = stmt.declarationList.declarations[0]!;
    const obj = decl.initializer as ts.ObjectLiteralExpression;
    const visited: string[] = [];
    traverseTvObject(
      sf,
      obj,
      (classLiteral) => {
        visited.push(classLiteral.text);
      },
      0,
      knownBindings,
    );

    expect(visited).toEqual(
      expect.arrayContaining([
        "flex gap-2",
        "text-sm",
        "rounded-md border",
        "px-3",
        "font-medium shadow-xs",
      ]),
    );
  });

  it("collectCnCallsInsideTv finds cn calls from arrays, class fields, and nested objects", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
tv({
  base: [cn("flex gap-2"), { class: cn("text-sm rounded-md") }],
  variants: {
    intent: {
      primary: { className: cn("border px-3") },
    },
  },
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const knownBindings = buildKnownCnTvBindings(sf);
    const tvCall = (sf.statements[1] as ts.ExpressionStatement).expression as ts.CallExpression;
    const tvObj = tvCall.arguments[0] as ts.ObjectLiteralExpression;

    const calls = collectCnCallsInsideTv(sf, tvObj, knownBindings, 0);
    expect(calls).toHaveLength(3);
    expect(calls.map((call) => call.getText(sf))).toEqual(
      expect.arrayContaining(['cn("flex gap-2")', 'cn("text-sm rounded-md")', 'cn("border px-3")']),
    );
  });

  it("listAllCnCallsInsideTvInSourceFile collects cn calls only from tv() object arguments", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
cn("outside call should not be counted");
tv({
  base: [cn("inside-tv one"), { className: cn("inside-tv two") }],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const knownBindings = buildKnownCnTvBindings(sf);
    const calls = listAllCnCallsInsideTvInSourceFile(sf, knownBindings);
    expect(calls).toHaveLength(2);
    expect(calls.map((call) => call.getText(sf))).toEqual(
      expect.arrayContaining(['cn("inside-tv one")', 'cn("inside-tv two")']),
    );
  });
});

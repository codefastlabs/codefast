import ts from "typescript";
import { collectGroupableStringNodes, slotClassString } from "#lib/arrange/ast/collectors-tv";

describe("collectGroupableStringNodes", () => {
  it("collects cn/tv static class slots eligible for grouping", () => {
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

  it("collects tv array slots without cn()", () => {
    const source = `import { tv } from "tailwind-variants";
export const styles = tv({
  base: ["flex gap-2 text-sm rounded-md border px-3", "shadow-xs"],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.some((n) => slotClassString(n).includes("shadow-xs"))).toBe(true);
  });

  it("collects compoundVariants className string slots", () => {
    const source = `import { tv } from "tailwind-variants";
export const styles = tv({
  compoundVariants: [{ className: "flex gap-2 text-sm rounded-md border px-3" }],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it("collects compoundVariants class array with mixed strings and cn()", () => {
    const source = `import { cn, tv } from "tailwind-variants";
export const styles = tv({
  compoundVariants: [{ class: ["py-1", cn("flex gap-2 text-sm rounded-md border px-3")] }],
});
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const nodes = collectGroupableStringNodes(sf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.some((n) => slotClassString(n).includes("flex gap-2"))).toBe(true);
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
});

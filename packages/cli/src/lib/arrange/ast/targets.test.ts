import ts from "typescript";
import { collectGroupableStringNodes } from "#lib/arrange/ast/collectors-tv";
import {
  collectGroupTargets,
  formatCnCallReplacement,
  planGroupEditForTarget,
} from "#lib/arrange/ast/targets";

describe("formatCnCallReplacement", () => {
  it("keeps multiline trailing comma behavior explicit for multi-arg cn calls", () => {
    const source = `import { cn } from "tailwind-variants";
export function Row(className: string) {
  return cn("flex gap-2 text-sm rounded-md border px-3", className);
}
`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const item = collectGroupableStringNodes(sf)[0]!;
    const out = formatCnCallReplacement(item, source, false);
    expect(out).toContain("className,");
    expect(out).toContain('"flex gap-2"');
  });
});

describe("collectGroupTargets + planGroupEditForTarget", () => {
  it("collects JSX className targets in tsx files", () => {
    const source = `export function C() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    const sf = ts.createSourceFile(
      "x.tsx",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const targets = collectGroupTargets(sf, "x.tsx");
    expect(targets.some((t) => t.kind === "jsxClassName")).toBe(true);
  });

  it("plans undefined when groups length <= 1", () => {
    const source = `import { cn } from "tailwind-variants"; cn("flex gap-2");`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const targets = collectGroupTargets(sf, "x.ts");
    const cnTarget = targets.find((t) => t.kind === "cnArg");
    expect(cnTarget).toBeDefined();
    const plan = planGroupEditForTarget(cnTarget!, source, false);
    expect(plan).toBeUndefined();
  });

  it("includes trailing className when withClassName=true", () => {
    const source = `import { cn } from "tailwind-variants";
export function C(className: string) {
  return cn("flex gap-2 text-sm rounded-md border px-3 font-medium", className);
}`;
    const sf = ts.createSourceFile("x.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const targets = collectGroupTargets(sf, "x.ts");
    const cnTarget = targets.find((t) => t.kind === "cnArg");
    const plan = planGroupEditForTarget(cnTarget!, source, true);
    expect(plan?.replacement).toContain("className");
  });
});

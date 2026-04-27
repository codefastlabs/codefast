import { collectGroupableStringNodes } from "#/lib/arrange/domain/ast/collectors-tv.collector";
import {
  collectGroupTargets,
  formatCnCallReplacement,
  planGroupEditForTarget,
} from "#/lib/arrange/domain/ast/targets.model";
import { parseDomainSourceFile } from "#/lib/arrange/infrastructure/ts-ast-translator.util";

describe("formatCnCallReplacement", () => {
  it("keeps multiline trailing comma behavior explicit for multi-arg cn calls", () => {
    const source = `import { cn } from "@codefast/tailwind-variants";
export function Row(className: string) {
  return cn("flex gap-2 text-sm rounded-md border px-3", className);
}
`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const stringNode = collectGroupableStringNodes(domainSf)[0];
    if (stringNode === undefined) {
      throw new Error("expected string node");
    }
    const out = formatCnCallReplacement(stringNode, source, false);
    expect(out).toContain("className,");
    expect(out).toContain('"flex gap-2"');
  });
});

describe("collectGroupTargets + planGroupEditForTarget", () => {
  it("collects JSX className targets in tsx files", () => {
    const source = `export function C() {
  return <div className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-card" />;
}`;
    const domainSf = parseDomainSourceFile("x.tsx", source);
    const targets = collectGroupTargets(domainSf, "x.tsx");
    expect(targets.some((groupTarget) => groupTarget.kind === "jsxClassName")).toBe(true);
  });

  it("plans undefined when groups length <= 1", () => {
    const source = `import { cn } from "@codefast/tailwind-variants"; cn("flex gap-2");`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const targets = collectGroupTargets(domainSf, "x.ts");
    const cnTarget = targets.find((groupTarget) => groupTarget.kind === "cnArg");
    if (cnTarget === undefined) {
      throw new Error("expected cnArg target");
    }
    const plan = planGroupEditForTarget(cnTarget, source, false);
    expect(plan).toBeUndefined();
  });

  it("includes trailing className when withClassName=true", () => {
    const source = `import { cn } from "@codefast/tailwind-variants";
export function C(className: string) {
  return cn("flex gap-2 text-sm rounded-md border px-3 font-medium", className);
}`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const targets = collectGroupTargets(domainSf, "x.ts");
    const cnTarget = targets.find((groupTarget) => groupTarget.kind === "cnArg");
    if (cnTarget === undefined) {
      throw new Error("expected cnArg target");
    }
    const plan = planGroupEditForTarget(cnTarget, source, true);
    expect(plan?.replacement).toContain("className");
  });

  it("accepts legacy tailwind-variants import when planning cn target edits (backward compat)", () => {
    const source = `import { cn } from "tailwind-variants";
export function C(className: string) {
  return cn("flex gap-2 text-sm rounded-md border px-3 font-medium", className);
}`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const targets = collectGroupTargets(domainSf, "x.ts");
    const cnTarget = targets.find((groupTarget) => groupTarget.kind === "cnArg");
    if (cnTarget === undefined) {
      throw new Error("expected cnArg target");
    }
    const plan = planGroupEditForTarget(cnTarget, source, true);
    expect(plan?.replacement).toContain("className");
  });
});

import {
  buildKnownCnTvBindings,
  isCnOrTvIdentifier,
} from "#/lib/arrange/domain/ast/ast-helpers.helper";
import {
  collectCnCallsInsideTv,
  collectGroupableStringNodes,
  listAllCnCallsInsideTvInSourceFile,
  slotClassString,
  traverseTvObject,
} from "#/lib/arrange/domain/ast/collectors-tv.collector";
import { MAX_OBJECT_DEPTH } from "#/lib/arrange/domain/constants.domain";
import {
  type DomainObjectLiteralExpression,
  type DomainSourceFile,
  forEachDomainDescendantFromSourceFile,
  isDomainCallExpression,
  isDomainObjectLiteralExpression,
} from "#/lib/arrange/domain/ast/ast-node.model";
import { parseDomainSourceFile } from "#/lib/arrange/infra/ts-ast-translator.adapter";

function firstTvConfigObject(domainSf: DomainSourceFile): DomainObjectLiteralExpression {
  const knownBindings = buildKnownCnTvBindings(domainSf);
  let found: DomainObjectLiteralExpression | undefined;
  forEachDomainDescendantFromSourceFile(domainSf, (n) => {
    if (found) {
      return;
    }
    if (!isDomainCallExpression(n)) {
      return;
    }
    if (!isCnOrTvIdentifier(n.expression, "tv", knownBindings)) {
      return;
    }
    const arg0 = n.arguments[0];
    if (arg0 && isDomainObjectLiteralExpression(arg0)) {
      found = arg0;
    }
  });
  if (!found) {
    throw new Error("expected tv({ ... }) object literal");
  }
  return found;
}

describe("collectGroupableStringNodes", () => {
  it("collects cn/tv static class slots eligible for grouping", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3"),
});
`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const nodes = collectGroupableStringNodes(domainSf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(slotClassString(nodes[0]!)).toContain("flex gap-2");
  });

  it("collects tv array slots without cn()", () => {
    const source = `import { tv } from "@codefast/tailwind-variants";
export const styles = tv({
  base: ["flex gap-2 text-sm rounded-md border px-3", "shadow-xs"],
});
`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const nodes = collectGroupableStringNodes(domainSf);
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
    const domainSf = parseDomainSourceFile("x.ts", source);
    const nodes = collectGroupableStringNodes(domainSf);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it("collects compoundVariants class array with mixed strings and cn()", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({
  compoundVariants: [{ class: ["py-1", cn("flex gap-2 text-sm rounded-md border px-3")] }],
});
`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const nodes = collectGroupableStringNodes(domainSf);
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
    const domainSf = parseDomainSourceFile("x.ts", source);
    const nodes = collectGroupableStringNodes(domainSf);
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
    const domainSf = parseDomainSourceFile("x.ts", source);
    const nodes = collectGroupableStringNodes(domainSf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(
      nodes.some((stringNode) => slotClassString(stringNode).includes("rounded-md border px-3")),
    ).toBe(true);
  });

  it("returns empty when file has no cn/tv candidates", () => {
    const domainSf = parseDomainSourceFile("x.ts", "export const only = 1;");
    expect(collectGroupableStringNodes(domainSf)).toEqual([]);
  });

  it("documents that tv object traversal stops safely when nesting exceeds the configured depth limit", () => {
    let nestedObject = '{ className: "flex gap-2 text-sm rounded-md border px-3" }';
    for (let i = 0; i < MAX_OBJECT_DEPTH + 2; i += 1) {
      nestedObject = `{ layer${i}: ${nestedObject} }`;
    }
    const source = `import { tv } from "@codefast/tailwind-variants";
export const styles = tv(${nestedObject});
`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    expect(() => collectGroupableStringNodes(domainSf)).not.toThrow();
    expect(collectGroupableStringNodes(domainSf)).toEqual([]);
  });

  it("accepts legacy tailwind-variants import for tv slot collection (backward compat)", () => {
    const source = `import { cn, tv } from "tailwind-variants";
export const styles = tv({
  base: cn("flex gap-2 text-sm rounded-md border px-3"),
});
`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const nodes = collectGroupableStringNodes(domainSf);
    expect(nodes.length).toBeGreaterThan(0);
    expect(slotClassString(nodes[0]!)).toContain("flex gap-2");
  });
});

describe("tv collector helpers", () => {
  it("traverseTvObject visits nested className/class string literals and cn call literals", () => {
    const source = `import { cn, tv } from "@codefast/tailwind-variants";
export const styles = tv({
  base: [{ className: ["flex gap-2", "text-sm"] }, { class: cn("rounded-md border", "px-3") }],
  variants: {
    intent: { primary: { className: "font-medium shadow-xs" } },
  },
});
`;
    const domainSf = parseDomainSourceFile("x.ts", source);
    const knownBindings = buildKnownCnTvBindings(domainSf);
    const obj = firstTvConfigObject(domainSf);
    const visited: string[] = [];
    traverseTvObject(
      domainSf,
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
    const domainSf = parseDomainSourceFile("x.ts", source);
    const knownBindings = buildKnownCnTvBindings(domainSf);
    const tvObj = firstTvConfigObject(domainSf);

    const calls = collectCnCallsInsideTv(domainSf, tvObj, knownBindings, 0);
    expect(calls).toHaveLength(3);
    expect(calls.map((call) => domainSf.text.slice(call.pos, call.end))).toEqual(
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
    const domainSf = parseDomainSourceFile("x.ts", source);
    const knownBindings = buildKnownCnTvBindings(domainSf);
    const calls = listAllCnCallsInsideTvInSourceFile(domainSf, knownBindings);
    expect(calls).toHaveLength(2);
    expect(calls.map((call) => domainSf.text.slice(call.pos, call.end))).toEqual(
      expect.arrayContaining(['cn("inside-tv one")', 'cn("inside-tv two")']),
    );
  });
});

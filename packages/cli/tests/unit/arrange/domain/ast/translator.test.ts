import { describe, expect, it } from "vitest";

import type { DomainAstNode } from "#arrange/domain/ast/ast-node";
import { TypeScriptAstTranslator } from "#arrange/domain/ast/translator";

/** Every node reachable from the file's statements, through each field that holds a node or a list of them. */
function collectNodes(roots: ReadonlyArray<DomainAstNode>): Array<DomainAstNode> {
  const nodes: Array<DomainAstNode> = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }
    if (typeof value !== "object" || value === null || !("kind" in value) || !("pos" in value)) {
      return;
    }
    const node = value as DomainAstNode;
    if (nodes.includes(node)) {
      return;
    }
    nodes.push(node);
    for (const [key, child] of Object.entries(node)) {
      if (key !== "parent") {
        visit(child);
      }
    }
  };
  visit(roots);
  return nodes;
}

describe("TypeScriptAstTranslator", () => {
  it("replaces every child it builds a parent ahead of", () => {
    // One of each node the translator builds before its children: import, member access, property,
    // spread, parentheses, assertions, conditional, binary, statement and JSX expression.
    const source = [
      `import { cn } from "#lib/utils";`,
      `import * as icons from "#lib/icons";`,
      `const a = cn(tokens.base, { tone: "quiet", ...rest }, [first, ...more]);`,
      `const b = (value as string) satisfies string;`,
      `const c = maybe!.field;`,
      `const d = flag ? "on" : "off" + suffix;`,
      `run();`,
      `const e = <div className={cn("flex")} />;`,
    ].join("\n");
    const sourceFile = new TypeScriptAstTranslator().translateSourceFile("/virtual/x.tsx", source);
    const nodes = collectNodes(sourceFile.statements);

    expect(nodes.length).toBeGreaterThan(20);
    expect(nodes.filter((node) => node.pos < 0)).toStrictEqual([]);
  });
});

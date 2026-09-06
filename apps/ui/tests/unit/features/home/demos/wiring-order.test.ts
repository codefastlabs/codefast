import type { ContainerGraphJson } from "@codefast/di";
import { describe, expect, it } from "vitest";

import { NODE_WIDTH, constructionOrder, layoutGraph, nodeColumns } from "#/features/home/demos/wiring-order";

const node = (id: string, tokenName: string): ContainerGraphJson["nodes"][number] => ({
  id,
  tokenName,
  tokenKey: tokenName,
  kind: "class",
  scope: "singleton",
  fromParent: false,
});

const edge = (from: string, to: string): ContainerGraphJson["edges"][number] => ({ from, to, optional: false });

// Root depends on A and B; A depends on C; B depends on C too.
const graph: ContainerGraphJson = {
  nodes: [node("1", "Root"), node("2", "A"), node("3", "B"), node("4", "C")],
  edges: [edge("1", "2"), edge("1", "3"), edge("2", "4"), edge("3", "4")],
  includesParent: false,
};

describe("constructionOrder", () => {
  it("lists every dependency before what depends on it, once", () => {
    expect(constructionOrder(graph, "1")).toEqual(["4", "2", "3", "1"]);
  });

  it("returns just the root when nothing depends on anything", () => {
    expect(constructionOrder({ ...graph, edges: [] }, "1")).toEqual(["1"]);
  });
});

describe("nodeColumns", () => {
  it("puts the root in column 0 and a shared dependency one past its deepest dependent", () => {
    expect([...nodeColumns(graph)]).toEqual([
      ["1", 0],
      ["2", 1],
      ["3", 1],
      ["4", 2],
    ]);
  });
});

describe("layoutGraph", () => {
  it("places columns left to right and connects each edge right edge to left edge", () => {
    const layout = layoutGraph(graph);
    const byId = new Map(layout.nodes.map((placed) => [placed.node.id, placed]));

    expect(byId.get("1")?.x).toBe(0);
    expect(byId.get("4")?.x).toBeGreaterThan(byId.get("2")?.x ?? 0);
    expect(layout.width).toBeGreaterThan(NODE_WIDTH * 3);

    const rootToA = layout.edges.find((placed) => placed.from === "1" && placed.to === "2");

    expect(rootToA?.x1).toBe(NODE_WIDTH);
    expect(rootToA?.x2).toBe(byId.get("2")?.x);
  });
});

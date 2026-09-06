import type { ContainerGraphJson } from "@codefast/di";
import { describe, expect, it } from "vitest";

import {
  NODE_HEIGHT,
  NODE_WIDTH,
  constructionOrder,
  edgePath,
  layoutGraph,
  nodeColumns,
} from "#/features/home/demos/wiring-order";

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

// Root depends on A, B and C; A depends on C, so C sits two columns out and Root → C crosses column 1.
const spanning: ContainerGraphJson = {
  nodes: [node("1", "Root"), node("2", "A"), node("3", "B"), node("4", "C")],
  edges: [edge("1", "2"), edge("1", "3"), edge("1", "4"), edge("2", "4")],
  includesParent: false,
};

describe("layoutGraph waypoints", () => {
  it("threads an edge that crosses a column through the gap between that column's nodes", () => {
    const layout = layoutGraph(spanning);
    const byId = new Map(layout.nodes.map((placed) => [placed.node.id, placed]));
    const crossing = layout.edges.find((placed) => placed.from === "1" && placed.to === "4");
    const a = byId.get("2");
    const b = byId.get("3");

    expect(a && b && crossing).toBeTruthy();

    if (!a || !b || !crossing) {
      return;
    }

    const [top, bottom] = [a, b].toSorted((left, right) => left.y - right.y);

    expect(crossing.waypoints).toEqual([
      { x: a.x, y: ((top?.y ?? 0) + NODE_HEIGHT + (bottom?.y ?? 0)) / 2 },
      { x: a.x + NODE_WIDTH, y: ((top?.y ?? 0) + NODE_HEIGHT + (bottom?.y ?? 0)) / 2 },
    ]);

    for (const waypoint of crossing.waypoints) {
      for (const placed of [a, b]) {
        expect(waypoint.y < placed.y || waypoint.y > placed.y + NODE_HEIGHT).toBe(true);
      }
    }
  });

  it("gives an edge between neighbouring columns no waypoints", () => {
    const layout = layoutGraph(spanning);

    expect(layout.edges.find((placed) => placed.from === "1" && placed.to === "2")?.waypoints).toEqual([]);
  });
});

describe("edgePath", () => {
  it("runs level through every waypoint and bends only between them", () => {
    const path = edgePath({
      from: "1",
      to: "4",
      x1: 176,
      y1: 134,
      x2: 496,
      y2: 98,
      waypoints: [
        { x: 248, y: 134 },
        { x: 424, y: 134 },
      ],
    });

    expect(path).toBe("M176 134 C 212 134, 212 134, 248 134 C 284 134, 388 134, 424 134 C 459.5 134, 459.5 98, 495 98");
  });

  it("keeps the two-column form for an edge with no waypoints", () => {
    expect(edgePath({ from: "1", to: "2", x1: 176, y1: 26, x2: 248, y2: 98, waypoints: [] })).toBe(
      "M176 26 C 211.5 26, 211.5 98, 247 98",
    );
  });
});

import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { toReactFlowGraph } from "#/introspection/graph-adapters/reactflow";
import { token } from "#/token";

describe("toReactFlowGraph", () => {
  it("maps nodes with grid positions and edges with stable ids", () => {
    const configToken = token<number>("config");
    const serviceToken = token<{ config: number }>("service");
    const container = Container.create();
    container.bind(configToken).toConstantValue(1);
    container.bind(serviceToken).toResolved((config) => ({ config }), [configToken]);

    const graph = container.generateDependencyGraph();
    const flow = toReactFlowGraph(graph);

    expect(flow.nodes).toHaveLength(graph.nodes.length);
    expect(flow.edges).toHaveLength(graph.edges.length);
    for (const node of flow.nodes) {
      expect(node.position).toEqual({ x: expect.any(Number), y: expect.any(Number) });
      expect(node.data.label).toEqual(expect.any(String));
    }
    expect(flow.edges[0]).toMatchObject({
      id: "edge-0",
      source: graph.edges[0]!.from,
      target: graph.edges[0]!.to,
    });
  });
});

import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { toCytoscapeGraph } from "#/introspection/graph-adapters/cytoscape";
import { token } from "#/token";

describe("toCytoscapeGraph", () => {
  it("emits one node element per binding and one edge element per dependency", () => {
    const configToken = token<number>("config");
    const serviceToken = token<{ config: number }>("service");
    const container = Container.create();
    container.bind(configToken).toConstantValue(1);
    container.bind(serviceToken).toResolved((config) => ({ config }), [configToken]);

    const graph = container.generateDependencyGraph();
    const elements = toCytoscapeGraph(graph);

    const edges = elements.filter((element) => "source" in element.data);
    const nodes = elements.filter((element) => !("source" in element.data));
    expect(nodes).toHaveLength(graph.nodes.length);
    expect(edges).toHaveLength(graph.edges.length);
    expect(nodes.map((node) => (node.data as { label: string }).label)).toEqual(
      expect.arrayContaining(["config", "service"]),
    );
    expect(edges[0]?.data).toMatchObject({ id: "edge-0" });
  });
});

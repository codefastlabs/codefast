import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { inject } from "#decorators/inject";
import { toCytoscapeGraph } from "#introspection/graph-adapters/cytoscape";

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

  it("carries a named dependency's label and slot name onto the edge", () => {
    const depToken = token<string>("cy:dep");
    const consumerToken = token<{ dep: string }>("cy:consumer");
    const container = Container.create();
    container.bind(depToken).toConstantValue("primary-value").whenNamed("primary");
    container.bind(consumerToken).toResolved((dep: string) => ({ dep }), [inject(depToken, { name: "primary" })]);

    const elements = toCytoscapeGraph(container.generateDependencyGraph());
    const namedEdge = elements.find(
      (element) => "source" in element.data && (element.data as { slotName?: string }).slotName === "primary",
    );

    expect(namedEdge).toBeDefined();
    expect((namedEdge!.data as { label?: string }).label).toBe("name:primary");
  });
});

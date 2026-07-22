import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { toDotGraph } from "#/introspection/graph-adapters/dot";
import { token } from "#/token";

describe("toDotGraph", () => {
  it("renders a digraph with every node and edge", () => {
    const configToken = token<number>("config");
    const serviceToken = token<{ config: number }>("service");
    const container = Container.create();
    container.bind(configToken).toConstantValue(1);
    container.bind(serviceToken).toResolved((config) => ({ config }), [configToken]);

    const graph = container.generateDependencyGraph();
    const dot = toDotGraph(graph);

    expect(dot).toMatch(/^digraph/);
    expect(dot).toContain("config");
    expect(dot).toContain("service");
    expect(dot.trimEnd()).toMatch(/}$/);
    for (const edge of graph.edges) {
      expect(dot).toContain(`"${edge.from}" -> "${edge.to}"`);
    }
  });
});

import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { toDotGraph } from "#/introspection/graph-adapters/dot";

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

  it("escapes quotes in token names so they cannot inject DOT structure", () => {
    const hostileToken = token<number>('a"] ; malicious [label="pwn');
    const container = Container.create();
    container.bind(hostileToken).toConstantValue(1);

    const dot = toDotGraph(container.generateDependencyGraph());

    // One node, no edges: header, rankdir, the node line, and the closing brace.
    expect(dot.split("\n")).toHaveLength(4);
    expect(dot).toContain('a\\"] ; malicious [label=\\"pwn');
  });
});

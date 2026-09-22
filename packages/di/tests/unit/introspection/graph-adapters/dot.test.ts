import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";
import { optional } from "#injection/descriptor";
import { toDotGraph } from "#introspection/graph-adapters/dot";

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

  it("dashes an unbound-optional placeholder node", () => {
    const metricsToken = token<number>("dot:metrics");

    @injectable([optional(metricsToken)])
    class Service {
      constructor(readonly metrics: number | undefined) {}
    }
    const container = Container.create();
    container.bind(Service).toSelf().singleton();

    const dot = toDotGraph(container.generateDependencyGraph());

    // The placeholder for the optional-but-unbound dependency renders dashed.
    expect(dot).toContain('style="dashed"');
  });

  it("dashes a parent-owned node when the parent is included", () => {
    const sharedToken = token<number>("dot:shared");
    const localToken = token<{ shared: number }>("dot:local");
    const parent = Container.create();
    parent.bind(sharedToken).toConstantValue(1);
    const child = parent.createChild();
    child.bind(localToken).toResolved((shared: number) => ({ shared }), [sharedToken]);

    const dot = toDotGraph(child.generateDependencyGraph({ includeParent: true }));

    // The parent-owned binding renders dashed under the child's graph.
    expect(dot).toContain('style="dashed"');
  });
});

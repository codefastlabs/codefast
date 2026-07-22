import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { injectable } from "#/decorators/injectable";
import { token } from "#/token";

function buildContainer(): { container: ReturnType<typeof Container.create> } {
  const configToken = token<number>("config");
  @injectable([configToken])
  class Service {
    constructor(readonly config: number) {}
  }
  const container = Container.create();
  container.bind(configToken).toConstantValue(42);
  container.bind(Service).toSelf().singleton();
  return { container };
}

describe("generateDependencyGraph", () => {
  it("emits one node per binding and edges for class dependencies", () => {
    const { container } = buildContainer();
    const graph = container.generateDependencyGraph();

    const names = graph.nodes.map((node) => node.tokenName);
    expect(names).toContain("config");
    expect(names).toContain("Service");

    const serviceNode = graph.nodes.find((node) => node.tokenName === "Service");
    const configNode = graph.nodes.find((node) => node.tokenName === "config");
    expect(serviceNode?.kind).toBe("class");
    expect(serviceNode?.scope).toBe("singleton");
    expect(configNode?.kind).toBe("constant");
    expect(graph.edges).toContainEqual(expect.objectContaining({ from: serviceNode!.id, to: configNode!.id }));
  });

  it("marks parent-owned bindings when a child includes the parent chain", () => {
    const configToken = token<number>("config");
    const root = Container.create();
    root.bind(configToken).toConstantValue(1);
    const child = root.createChild();
    child.bind(token<string>("local")).toConstantValue("x");

    const withParent = child.generateDependencyGraph({ includeParent: true });
    expect(withParent.includesParent).toBe(true);
    const parentNode = withParent.nodes.find((node) => node.tokenName === "config");
    expect(parentNode?.fromParent).toBe(true);

    const withoutParent = child.generateDependencyGraph();
    expect(withoutParent.nodes.map((node) => node.tokenName)).not.toContain("config");
  });
});

import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { inject, injectAll, optional } from "#/decorators/inject";
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

  it("draws an edge from a child binding to the parent binding that satisfies it", () => {
    const configToken = token<number>("config");
    @injectable([configToken])
    class Service {
      constructor(readonly config: number) {}
    }
    const root = Container.create();
    root.bind(configToken).toConstantValue(1);
    const child = root.createChild();
    child.bind(Service).toSelf().singleton();

    const graph = child.generateDependencyGraph({ includeParent: true });
    const serviceNode = graph.nodes.find((node) => node.tokenName === "Service");
    const configNode = graph.nodes.find((node) => node.tokenName === "config");

    expect(configNode?.fromParent).toBe(true);
    expect(graph.edges).toContainEqual(expect.objectContaining({ from: serviceNode!.id, to: configNode!.id }));
  });

  it("marks optional dependencies on the edge label", () => {
    const metricsToken = token<number>("metrics");
    @injectable([optional(metricsToken)])
    class Service {
      constructor(readonly metrics: number | undefined) {}
    }
    const container = Container.create();
    container.bind(metricsToken).toConstantValue(1);
    container.bind(Service).toSelf().singleton();

    const graph = container.generateDependencyGraph();
    const serviceNode = graph.nodes.find((node) => node.tokenName === "Service");

    expect(graph.edges).toContainEqual(expect.objectContaining({ from: serviceNode!.id, label: "[0] optional" }));
  });

  it("keeps an optional-but-unbound dependency visible via an unbound placeholder node", () => {
    const metricsToken = token<number>("metrics");
    @injectable([optional(metricsToken)])
    class Service {
      constructor(readonly metrics: number | undefined) {}
    }
    const container = Container.create();
    container.bind(Service).toSelf().singleton();

    const graph = container.generateDependencyGraph();
    const placeholder = graph.nodes.find((node) => node.tokenName === "metrics");
    const serviceNode = graph.nodes.find((node) => node.tokenName === "Service");

    expect(placeholder).toMatchObject({ id: "unbound:metrics", kind: "unbound", scope: "unbound" });
    expect(graph.edges).toContainEqual({ from: serviceNode!.id, to: "unbound:metrics", label: "[0] optional" });
  });

  it("omits a required-but-unbound dependency (validate() owns that story)", () => {
    const missingToken = token<number>("missing");
    @injectable([missingToken])
    class Service {
      constructor(readonly missing: number) {}
    }
    const container = Container.create();
    container.bind(Service).toSelf().singleton();

    const graph = container.generateDependencyGraph();

    expect(graph.nodes.map((node) => node.tokenName)).not.toContain("missing");
    expect(graph.edges).toEqual([]);
  });

  it("draws every multi-binding edge for injectAll, labeled by slot name", () => {
    const validatorToken = token<string>("validator");
    @injectable([injectAll(validatorToken)])
    class Composite {
      constructor(readonly validators: Array<string>) {}
    }
    const container = Container.create();
    container.bind(validatorToken).toConstantValue("a").whenNamed("first");
    container.bind(validatorToken).toConstantValue("b").whenNamed("second");
    container.bind(Composite).toSelf().singleton();

    const graph = container.generateDependencyGraph();
    const compositeNode = graph.nodes.find((node) => node.tokenName === "Composite");
    const validatorIds = graph.nodes.filter((node) => node.tokenName === "validator").map((node) => node.id);
    const fanOut = graph.edges.filter((edge) => edge.from === compositeNode!.id);

    expect(fanOut.map((edge) => edge.to).sort()).toEqual([...validatorIds].sort());
    expect(fanOut.map((edge) => edge.label ?? "").sort()).toEqual(["name:first", "name:second"]);
  });

  it("labels a named class-constructor dependency with its slot name", () => {
    const configToken = token<number>("config");
    @injectable([inject(configToken, { name: "primary" })])
    class Service {
      constructor(readonly config: number) {}
    }
    const container = Container.create();
    container.bind(configToken).toConstantValue(1).whenNamed("primary");
    container.bind(configToken).toConstantValue(2).whenNamed("secondary");
    container.bind(Service).toSelf().singleton();

    const graph = container.generateDependencyGraph();
    const serviceNode = graph.nodes.find((node) => node.tokenName === "Service");
    const fanOut = graph.edges.filter((edge) => edge.from === serviceNode!.id);

    expect(fanOut).toHaveLength(1);
    expect(fanOut[0]!.label).toBe("name:primary");
  });
});

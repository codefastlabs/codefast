import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { injectAll, optional } from "#/injection/descriptor";

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

  it("reports an optional dependency as a field, not only in the label", () => {
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

    expect(graph.edges).toContainEqual(
      expect.objectContaining({ from: serviceNode!.id, label: "[0] optional", optional: true }),
    );
  });

  it("keeps required edges marked not-optional", () => {
    const { container } = buildContainer();
    const graph = container.generateDependencyGraph();

    expect(graph.edges.every((edge) => edge.optional === false)).toBe(true);
  });

  it("distinguishes two tokens that share a display name", () => {
    const first = token<number>("config");
    const second = token<number>("config");
    const container = Container.create();
    container.bind(first).toConstantValue(1);
    container.bind(second).toConstantValue(2);

    const graph = container.generateDependencyGraph();
    const keys = graph.nodes.filter((node) => node.tokenName === "config").map((node) => node.tokenKey);

    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
  });

  it("gives the same token the same key across graphs", () => {
    const configToken = token<number>("config");
    const container = Container.create();
    container.bind(configToken).toConstantValue(1);

    const first = container.generateDependencyGraph().nodes[0]!.tokenKey;
    const second = container.generateDependencyGraph().nodes[0]!.tokenKey;

    expect(second).toBe(first);
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

    expect(placeholder).toMatchObject({ tokenName: "metrics", kind: "unbound", scope: "unbound" });
    expect(graph.edges).toContainEqual({
      from: serviceNode!.id,
      to: placeholder!.id,
      label: "[0] optional",
      optional: true,
    });
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
    expect(fanOut.map((edge) => edge.slotName ?? "").sort()).toEqual(["first", "second"]);
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
    expect(fanOut[0]!.slotName).toBe("primary");
    expect(fanOut[0]!.label).toBe("name:primary");
  });
});

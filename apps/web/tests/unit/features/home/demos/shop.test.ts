import { MissingScopeContextError } from "@codefast/di";
import { describe, expect, it } from "vitest";

import { OrderServiceToken, createShop } from "#/features/home/demos/shop";

describe("createShop", () => {
  it("derives a graph rooted at OrderService with its five dependencies", () => {
    const { graph } = createShop();
    const root = graph.nodes.find((node) => node.tokenName === "OrderService");

    expect(root).toBeDefined();
    expect(graph.edges.filter((edge) => edge.from === root?.id)).toHaveLength(5);
    expect(graph.nodes.map((node) => node.scope)).toEqual(expect.arrayContaining(["singleton", "scoped", "transient"]));
  });

  it("binds OrderService as a singleton on request, for the captive case", () => {
    const { graph } = createShop({ orderService: "singleton" });

    expect(graph.nodes.find((node) => node.tokenName === "OrderService")?.scope).toBe("singleton");
  });

  it("refuses to resolve the scoped context from the root container", () => {
    const { container } = createShop();

    expect(() => container.resolve(OrderServiceToken)).toThrow(MissingScopeContextError);
  });

  it("reuses singletons across request scopes and renews the scoped context and transient gateway", () => {
    const { container } = createShop();
    const first = container.createChild().resolve(OrderServiceToken);
    const second = container.createChild().resolve(OrderServiceToken);

    expect(second.logger).toBe(first.logger);
    expect(second.catalog).toBe(first.catalog);
    expect(second.context).not.toBe(first.context);
    expect(second.payments.instance).not.toBe(first.payments.instance);
    expect(first.place("SKU-42")).toMatch(/^pay-\d+ for 42\.00 USD$/);
  });
});

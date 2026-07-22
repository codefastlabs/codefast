/**
 * Characterization tests for the chain-versioned lookup memo and the compiled
 * class plans: every mutation that must invalidate a warmed cache (rebind,
 * unbind, late activation hooks, alias retargeting, parent-chain edits) is
 * pinned here through the public container API only.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { injectable } from "#/decorators/injectable";
import { postConstruct } from "#/decorators/lifecycle-decorators";
import { TokenNotBoundError } from "#/errors";
import { token } from "#/token";

const WARM_ITERATIONS = 5;

function warm(resolveOnce: () => unknown): void {
  for (let index = 0; index < WARM_ITERATIONS; index += 1) {
    resolveOnce();
  }
}

describe("lookup memo invalidation", () => {
  it("rebind replaces a warmed constant", () => {
    const configToken = token<number>("config");
    const container = Container.create();
    container.bind(configToken).toConstantValue(1);
    warm(() => container.resolve(configToken));

    container.rebind(configToken).toConstantValue(2);
    expect(container.resolve(configToken)).toBe(2);
  });

  it("unbind makes a warmed token throw TokenNotBoundError", () => {
    const configToken = token<number>("config");
    const container = Container.create();
    container.bind(configToken).toConstantValue(1);
    warm(() => container.resolve(configToken));

    container.unbind(configToken);
    expect(() => container.resolve(configToken)).toThrow(TokenNotBoundError);
  });

  it("a child sees a parent rebind after warming the chain walk", () => {
    const configToken = token<number>("config");
    const root = Container.create();
    root.bind(configToken).toConstantValue(1);
    const child = root.createChild().createChild();
    warm(() => child.resolve(configToken));

    root.rebind(configToken).toConstantValue(2);
    expect(child.resolve(configToken)).toBe(2);
  });

  it("binding a shadow in the child overrides a warmed parent hit", () => {
    const configToken = token<number>("config");
    const root = Container.create();
    root.bind(configToken).toConstantValue(1);
    const child = root.createChild();
    warm(() => child.resolve(configToken));

    child.bind(configToken).toConstantValue(99);
    expect(child.resolve(configToken)).toBe(99);
    expect(root.resolve(configToken)).toBe(1);
  });

  it("alias retargeting is observed after the alias fold was warmed", () => {
    const implementationA = token<string>("impl-a");
    const implementationB = token<string>("impl-b");
    const facadeToken = token<string>("facade");
    const container = Container.create();
    container.bind(implementationA).toConstantValue("A");
    container.bind(implementationB).toConstantValue("B");
    container.bind(facadeToken).toAlias(implementationA);
    warm(() => container.resolve(facadeToken));

    container.rebind(facadeToken).toAlias(implementationB);
    expect(container.resolve(facadeToken)).toBe("B");
  });
});

describe("compiled class-plan invalidation", () => {
  it("rebinding a transient class dependency reaches the next instance", () => {
    const leafToken = token<{ readonly tag: string }>("leaf");
    @injectable([leafToken])
    class Service {
      constructor(readonly leaf: { readonly tag: string }) {}
    }
    const serviceToken = token<Service>("service");
    const container = Container.create();
    container.bind(leafToken).toConstantValue({ tag: "before" });
    container.bind(serviceToken).to(Service).transient();
    warm(() => container.resolve(serviceToken));

    container.rebind(leafToken).toConstantValue({ tag: "after" });
    expect(container.resolve(serviceToken).leaf.tag).toBe("after");
  });

  it("an activation hook registered after warm resolves fires on the next resolve", () => {
    @injectable()
    class Payload {
      activated = false;
    }
    const payloadToken = token<Payload>("payload");
    const container = Container.create();
    container.bind(payloadToken).to(Payload).transient();
    warm(() => container.resolve(payloadToken));
    expect(container.resolve(payloadToken).activated).toBe(false);

    container.onActivation(payloadToken, (_ctx, instance) => {
      instance.activated = true;
      return instance;
    });
    expect(container.resolve(payloadToken).activated).toBe(true);
  });

  it("postConstruct keeps firing on every transient resolve, warm or cold", () => {
    let constructedCount = 0;
    @injectable()
    class Widget {
      @postConstruct()
      ready(): void {
        constructedCount += 1;
      }
    }
    const widgetToken = token<Widget>("widget");
    const container = Container.create();
    container.bind(widgetToken).to(Widget).transient();

    warm(() => container.resolve(widgetToken));
    expect(constructedCount).toBe(WARM_ITERATIONS);
  });

  it("a singleton dependency materialized through the plan fallback is cached once", () => {
    let factoryCalls = 0;
    const connectionToken = token<{ readonly id: number }>("connection");
    @injectable([connectionToken])
    class Repository {
      constructor(readonly connection: { readonly id: number }) {}
    }
    const repositoryToken = token<Repository>("repository");
    const container = Container.create();
    container
      .bind(connectionToken)
      .toDynamic(() => {
        factoryCalls += 1;
        return { id: factoryCalls };
      })
      .singleton();
    container.bind(repositoryToken).to(Repository).transient();

    warm(() => container.resolve(repositoryToken));
    expect(factoryCalls).toBe(1);
    expect(container.resolve(repositoryToken).connection.id).toBe(1);
  });

  it("transient class instances stay fresh once the plan is warm", () => {
    @injectable()
    class Leaf {}
    @injectable([Leaf])
    class Holder {
      constructor(readonly leaf: Leaf) {}
    }
    const container = Container.create();
    container.bind(Leaf).toSelf().transient();
    container.bind(Holder).toSelf().transient();

    const seen = new Set<Holder>();
    const seenLeaves = new Set<Leaf>();
    for (let index = 0; index < WARM_ITERATIONS; index += 1) {
      const holder = container.resolve(Holder);
      seen.add(holder);
      seenLeaves.add(holder.leaf);
    }
    expect(seen.size).toBe(WARM_ITERATIONS);
    expect(seenLeaves.size).toBe(WARM_ITERATIONS);
  });
});

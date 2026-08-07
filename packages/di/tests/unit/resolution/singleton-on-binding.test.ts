/**
 * A singleton instance lives on its binding, not in a per-container table. That is sound only
 * because a binding belongs to exactly one container — these tests pin the consequences that
 * design has to get right: the shared-across-the-chain read, invalidation on unbind and rebind,
 * enumeration for disposal, and a cached `undefined` staying distinguishable from a cache miss.
 */
import { describe, expect, it, vi } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";

describe("singleton caching", () => {
  it("gives a child container the parent's instance, not a second one", () => {
    const serviceToken = token<{ n: number }>("singleton-shared");
    let built = 0;
    const parent = Container.create();
    parent
      .bind(serviceToken)
      .toDynamic(() => ({ n: (built += 1) }))
      .singleton();

    const childA = parent.createChild();
    const childB = parent.createChild();

    const fromParent = parent.resolve(serviceToken);
    expect(childA.resolve(serviceToken)).toBe(fromParent);
    expect(childB.resolve(serviceToken)).toBe(fromParent);
    expect(built).toBe(1);
  });

  it("caches an undefined value rather than re-running the factory", () => {
    const maybeToken = token<undefined>("singleton-undefined");
    const factory = vi.fn(() => undefined);
    const container = Container.create();
    container.bind(maybeToken).toDynamic(factory).singleton();

    expect(container.resolve(maybeToken)).toBeUndefined();
    expect(container.resolve(maybeToken)).toBeUndefined();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("drops the instance on unbind so a later bind builds a fresh one", () => {
    const serviceToken = token<{ n: number }>("singleton-unbound");
    let built = 0;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => ({ n: (built += 1) }))
      .singleton();

    expect(container.resolve(serviceToken).n).toBe(1);
    container.unbind(serviceToken);
    container
      .bind(serviceToken)
      .toDynamic(() => ({ n: (built += 1) }))
      .singleton();

    expect(container.resolve(serviceToken).n).toBe(2);
    expect(container.inspect().cachedSingletonCount).toBe(1);
  });

  it("drops the instance on rebind", () => {
    const serviceToken = token<string>("singleton-rebound");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => "first")
      .singleton();
    expect(container.resolve(serviceToken)).toBe("first");

    container
      .rebind(serviceToken)
      .toDynamic(() => "second")
      .singleton();

    expect(container.resolve(serviceToken)).toBe("second");
  });

  it("counts only what is actually materialized", () => {
    const eagerToken = token<number>("singleton-counted");
    const lazyToken = token<number>("singleton-uncounted");
    const container = Container.create();
    container
      .bind(eagerToken)
      .toDynamic(() => 1)
      .singleton();
    container
      .bind(lazyToken)
      .toDynamic(() => 2)
      .singleton();

    expect(container.inspect().cachedSingletonCount).toBe(0);
    container.resolve(eagerToken);
    expect(container.inspect().cachedSingletonCount).toBe(1);
    container.resolve(eagerToken);
    expect(container.inspect().cachedSingletonCount).toBe(1);
    container.resolve(lazyToken);
    expect(container.inspect().cachedSingletonCount).toBe(2);
  });

  it("deactivates every cached singleton on dispose", async () => {
    const firstToken = token<{ id: string }>("singleton-dispose-first");
    const secondToken = token<{ id: string }>("singleton-dispose-second");
    const deactivated: Array<string> = [];

    const container = Container.create();
    container
      .bind(firstToken)
      .toDynamic(() => ({ id: "first" }))
      .singleton();
    container
      .bind(secondToken)
      .toDynamic(() => ({ id: "second" }))
      .singleton();
    container.onDeactivation(firstToken, (instance: { id: string }) => {
      deactivated.push(instance.id);
    });
    container.onDeactivation(secondToken, (instance: { id: string }) => {
      deactivated.push(instance.id);
    });

    container.resolve(firstToken);
    container.resolve(secondToken);
    await container.dispose();

    expect(deactivated.toSorted()).toEqual(["first", "second"]);
  });

  it("clears every instance on unbindAll", () => {
    const alphaToken = token<number>("singleton-clear-alpha");
    const betaToken = token<number>("singleton-clear-beta");
    let built = 0;
    const container = Container.create();
    for (const t of [alphaToken, betaToken]) {
      container
        .bind(t)
        .toDynamic(() => (built += 1))
        .singleton();
    }
    container.resolve(alphaToken);
    container.resolve(betaToken);
    expect(built).toBe(2);

    container.unbindAll();
    expect(container.inspect().cachedSingletonCount).toBe(0);

    container
      .bind(alphaToken)
      .toDynamic(() => (built += 1))
      .singleton();
    expect(container.resolve(alphaToken)).toBe(3);
  });
});

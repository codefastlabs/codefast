/**
 * Owner-routing and concurrency races: a singleton belongs to the container that binds it — every
 * lane must materialize it there — and container-level hooks belong to the binding's owner. The
 * async lanes must never construct one cached instance twice under concurrency.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { AsyncResolutionError } from "#/errors/errors";

const depToken = token<string>("owner.dep");

describe("resolveAll owner-routing for singletons", () => {
  it("materializes a parent-owned singleton at the parent, with the parent's dependencies", async () => {
    const serviceToken = token<{ dep: string }>("owner.svc");
    const parent = Container.create();
    parent.bind(depToken).toConstantValue("parent-dep");
    parent
      .bind(serviceToken)
      .toResolved((dep) => ({ dep }), [depToken])
      .singleton();
    const child = parent.createChild();
    child.bind(depToken).toConstantValue("child-dep");

    const [viaChild] = child.resolveAll(serviceToken);
    expect(viaChild?.dep).toBe("parent-dep");
    expect(parent.resolve(serviceToken)).toBe(viaChild);

    // The child never owned it, so the child's teardown must not evict or deactivate it.
    await child.dispose();
    expect(parent.resolve(serviceToken)).toBe(viaChild);
  });

  it("dedups a parent singleton between child resolveAllAsync and parent resolveAsync", async () => {
    const serviceToken = token<object>("owner.async-svc");
    let constructed = 0;
    const parent = Container.create();
    parent
      .bind(serviceToken)
      .toDynamicAsync(async () => {
        constructed += 1;
        await Promise.resolve();
        return {};
      })
      .singleton();
    const child = parent.createChild();

    const [fromChild, fromParent] = await Promise.all([
      child.resolveAllAsync(serviceToken),
      parent.resolveAsync(serviceToken),
    ]);

    expect(constructed).toBe(1);
    expect(fromChild[0]).toBe(fromParent);
  });
});

describe("sync resolve during an in-flight async materialization", () => {
  it("refuses to double-construct a singleton being materialized asynchronously", async () => {
    const serviceToken = token<object>("race.singleton");
    let constructed = 0;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => {
        constructed += 1;
        return {};
      })
      .singleton();

    const pending = container.resolveAsync(serviceToken);
    expect(() => container.resolve(serviceToken)).toThrow(AsyncResolutionError);

    const instance = await pending;
    expect(constructed).toBe(1);
    expect(container.resolve(serviceToken)).toBe(instance);
  });
});

describe("scoped async in-flight dedup", () => {
  it("constructs one scoped instance for concurrent resolveAsync calls", async () => {
    const serviceToken = token<object>("race.scoped");
    let constructed = 0;
    const root = Container.create();
    root
      .bind(serviceToken)
      .toDynamicAsync(async () => {
        constructed += 1;
        await Promise.resolve();
        return {};
      })
      .scoped();
    const child = root.createChild();

    const [first, second] = await Promise.all([child.resolveAsync(serviceToken), child.resolveAsync(serviceToken)]);

    expect(constructed).toBe(1);
    expect(first).toBe(second);
  });
});

describe("container-level hooks belong to the binding's owner", () => {
  it("fires the parent's hook for a parent-owned transient resolved through a child", () => {
    const serviceToken = token<{ tags: Array<string> }>("hooks.transient");
    const parent = Container.create();
    parent
      .bind(serviceToken)
      .toDynamic(() => ({ tags: [] }))
      .transient();
    parent.onActivation(serviceToken, (_ctx, instance) => {
      instance.tags.push("parent");
      return instance;
    });
    const child = parent.createChild();

    expect(child.resolve(serviceToken).tags).toEqual(["parent"]);
    expect(parent.resolve(serviceToken).tags).toEqual(["parent"]);
  });

  it("does not fire a child-registered hook for a parent-owned binding", () => {
    const serviceToken = token<{ tags: Array<string> }>("hooks.child-registered");
    const parent = Container.create();
    parent
      .bind(serviceToken)
      .toDynamic(() => ({ tags: [] }))
      .transient();
    const child = parent.createChild();
    child.onActivation(serviceToken, (_ctx, instance) => {
      instance.tags.push("child");
      return instance;
    });

    expect(child.resolve(serviceToken).tags).toEqual([]);
  });

  it("fires the parent's hook for a parent-owned constant resolved through a child", () => {
    const serviceToken = token<{ decorated: boolean }>("hooks.constant");
    const parent = Container.create();
    parent.bind(serviceToken).toConstantValue({ decorated: false });
    parent.onActivation(serviceToken, (_ctx, instance) => {
      instance.decorated = true;
      return instance;
    });
    const child = parent.createChild();

    expect(child.resolve(serviceToken).decorated).toBe(true);
  });

  it("invalidates a child's compiled plan when the parent registers a hook afterwards", () => {
    class PlanService {
      tags: Array<string> = [];
    }
    const parent = Container.create();
    parent.bind(PlanService).toSelf().transient();
    const child = parent.createChild();

    // Warm resolves so the child compiles a hook-free plan for the parent-owned binding.
    for (let index = 0; index < 25; index += 1) {
      child.resolve(PlanService);
    }

    parent.onActivation(PlanService, (_ctx, instance) => {
      instance.tags.push("late-hook");
      return instance;
    });

    expect(child.resolve(PlanService).tags).toEqual(["late-hook"]);
  });
});

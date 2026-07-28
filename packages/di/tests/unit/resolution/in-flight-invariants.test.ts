/**
 * Two mechanisms keep mutable state on objects that outlive a single resolve: `binding.inFlight`
 * for sync cycle detection, and the pooled async-chain context. Both are correctness-critical on
 * their *failure* paths — a flag left set makes every later resolve report a cycle that is not
 * there, and a context released twice hands one chain's state to another. Neither had a test.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { AsyncResolutionError, CircularDependencyError } from "#/errors";
import { token } from "#/token";

describe("binding.inFlight is released on every exit path", () => {
  it("survives a factory that throws", () => {
    const serviceToken = token<string>("in-flight-throwing");
    let shouldThrow = true;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => {
        if (shouldThrow) {
          throw new Error("boom");
        }
        return "ok";
      })
      .transient();

    expect(() => container.resolve(serviceToken)).toThrow("boom");
    shouldThrow = false;

    // A leaked flag would make this report a circular dependency instead.
    expect(container.resolve(serviceToken)).toBe("ok");
  });

  it("survives a detected cycle, so the same binding resolves once the cycle is gone", () => {
    const alphaToken = token<string>("in-flight-cycle-alpha");
    const betaToken = token<string>("in-flight-cycle-beta");
    let cyclic = true;
    const container = Container.create();
    container
      .bind(alphaToken)
      .toDynamic((ctx) => (cyclic ? `a:${ctx.resolve(betaToken)}` : "a"))
      .transient();
    container
      .bind(betaToken)
      .toDynamic((ctx) => `b:${ctx.resolve(alphaToken)}`)
      .transient();

    expect(() => container.resolve(alphaToken)).toThrow(CircularDependencyError);
    cyclic = false;

    expect(container.resolve(betaToken)).toBe("b:a");
  });

  it("survives an async factory reached through the sync path", () => {
    const serviceToken = token<string>("in-flight-async-misuse");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic((() => Promise.resolve("late")) as unknown as () => string)
      .transient();

    expect(() => container.resolve(serviceToken)).toThrow(AsyncResolutionError);
    // A leaked flag would turn the second attempt into a false CircularDependencyError.
    expect(() => container.resolve(serviceToken)).toThrow(AsyncResolutionError);
  });

  it("releases the flag for every binding in a partially-built graph", () => {
    const leafToken = token<string>("in-flight-partial-leaf");
    const rootToken = token<string>("in-flight-partial-root");
    let leafFails = true;
    const container = Container.create();
    container
      .bind(leafToken)
      .toDynamic(() => {
        if (leafFails) {
          throw new Error("leaf failed");
        }
        return "leaf";
      })
      .transient();
    container
      .bind(rootToken)
      .toDynamic((ctx) => `root:${ctx.resolve(leafToken)}`)
      .transient();

    expect(() => container.resolve(rootToken)).toThrow("leaf failed");
    leafFails = false;

    // Both bindings were on the path when it unwound; either flag leaking breaks this.
    expect(container.resolve(rootToken)).toBe("root:leaf");
  });

  it("survives a throwing factory that also carries activation hooks", () => {
    // The hooked lane guards with the same flag as the unhooked one, so it owes the same release.
    const serviceToken = token<string>("in-flight-hooked-throwing");
    let shouldThrow = true;
    const container = Container.create();
    container.onActivation(serviceToken, (_ctx, instance) => `${instance}!`);
    container
      .bind(serviceToken)
      .toDynamic(() => {
        if (shouldThrow) {
          throw new Error("hooked boom");
        }
        return "ok";
      })
      .transient();

    expect(() => container.resolve(serviceToken)).toThrow("hooked boom");
    shouldThrow = false;

    expect(container.resolve(serviceToken)).toBe("ok!");
  });

  it("reports a cycle through a hooked binding, and resolves it once the cycle is gone", () => {
    const alphaToken = token<string>("in-flight-hooked-alpha");
    const betaToken = token<string>("in-flight-hooked-beta");
    let cyclic = true;
    const container = Container.create();
    container.onActivation(alphaToken, (_ctx, instance) => instance);
    container
      .bind(alphaToken)
      .toDynamic((ctx) => (cyclic ? `a:${ctx.resolve(betaToken)}` : "a"))
      .transient();
    container
      .bind(betaToken)
      .toDynamic((ctx) => `b:${ctx.resolve(alphaToken)}`)
      .transient();

    expect(() => container.resolve(alphaToken)).toThrow(CircularDependencyError);
    cyclic = false;

    expect(container.resolve(betaToken)).toBe("b:a");
  });

  it("a hook that re-resolves its own token reports a cycle, not a stack overflow", () => {
    const serviceToken = token<string>("in-flight-hook-reentrant");
    const container = Container.create();
    container.onActivation(serviceToken, (ctx, instance) => `${instance}:${ctx.resolve(serviceToken)}`);
    container
      .bind(serviceToken)
      .toDynamic(() => "value")
      .transient();

    expect(() => container.resolve(serviceToken)).toThrow(CircularDependencyError);
  });
});

describe("the async chain context is released on every exit path", () => {
  it("survives a factory that throws synchronously", async () => {
    const serviceToken = token<string>("chain-sync-throw");
    let shouldThrow = true;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamicAsync(() => {
        if (shouldThrow) {
          throw new Error("sync boom");
        }
        return Promise.resolve("ok");
      })
      .transient();

    await expect(container.resolveAsync(serviceToken)).rejects.toThrow("sync boom");
    shouldThrow = false;

    expect(await container.resolveAsync(serviceToken)).toBe("ok");
  });

  it("survives a rejected factory", async () => {
    const serviceToken = token<string>("chain-rejection");
    let shouldReject = true;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamicAsync(() => (shouldReject ? Promise.reject(new Error("async boom")) : Promise.resolve("ok")))
      .transient();

    await expect(container.resolveAsync(serviceToken)).rejects.toThrow("async boom");
    shouldReject = false;

    expect(await container.resolveAsync(serviceToken)).toBe("ok");
  });

  it("keeps two concurrent chains from sharing a context after one fails", async () => {
    const failingToken = token<string>("chain-concurrent-failing");
    const workingLeafToken = token<string>("chain-concurrent-leaf");
    const workingRootToken = token<string>("chain-concurrent-root");
    const container = Container.create();
    container
      .bind(failingToken)
      .toDynamicAsync(async () => {
        await Promise.resolve();
        throw new Error("failing chain");
      })
      .transient();
    container.bind(workingLeafToken).toConstantValue("leaf");
    container
      .bind(workingRootToken)
      .toDynamicAsync(async (ctx) => `root:${await ctx.resolveAsync(workingLeafToken)}`)
      .transient();

    const [failed, worked] = await Promise.allSettled([
      container.resolveAsync(failingToken),
      container.resolveAsync(workingRootToken),
    ]);

    expect(failed.status).toBe("rejected");
    expect(worked).toEqual({ status: "fulfilled", value: "root:leaf" });

    // A context released twice would let a later chain read another chain's path.
    expect(await container.resolveAsync(workingRootToken)).toBe("root:leaf");
  });

  it("still detects a genuine cycle after an unrelated chain failed", async () => {
    const brokenToken = token<string>("chain-cycle-broken");
    const cyclicToken = token<string>("chain-cycle-self");
    const container = Container.create();
    container
      .bind(brokenToken)
      .toDynamicAsync(() => Promise.reject(new Error("broken")))
      .transient();
    container
      .bind(cyclicToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(cyclicToken))
      .transient();

    await expect(container.resolveAsync(brokenToken)).rejects.toThrow("broken");
    await expect(container.resolveAsync(cyclicToken)).rejects.toThrow(CircularDependencyError);
  });
});

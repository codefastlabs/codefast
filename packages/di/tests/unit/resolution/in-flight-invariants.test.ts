/**
 * Cycle detection keeps mutable state that outlives a single level: `binding.inFlight`, read by both
 * the sync transient-dynamic lane and the async cascade, plus the cascade's own path and stack. All
 * of it is correctness-critical on the *failure* paths — a flag left set makes every later resolve
 * report a cycle that is not there, and a cascade that fails to pop hands one branch another's
 * ancestors.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import type { ResolutionContext } from "#/core/types";
import { AsyncResolutionError, CircularDependencyError } from "#/errors/errors";

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

describe("the async cascade is released on every exit path", () => {
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

describe("a nested cascade unwinds to exactly where it started", () => {
  /** Depth-3 chain whose middle level can be made to fail three different ways. */
  function buildThreeLevelChain(middle: (ctx: ResolutionContext) => Promise<string>): {
    container: Container;
    outer: ReturnType<typeof token<string>>;
  } {
    const leaf = token<string>("cascade-unwind-leaf");
    const mid = token<string>("cascade-unwind-mid");
    const outer = token<string>("cascade-unwind-outer");
    const container = Container.create();
    container.bind(leaf).toConstantValue("leaf");
    container.bind(mid).toDynamicAsync(middle).transient();
    container
      .bind(outer)
      .toDynamicAsync(async (ctx) => `outer:${await ctx.resolveAsync(mid)}`)
      .transient();
    return { container, outer };
  }

  it("clears a middle level's flag when its factory throws synchronously", async () => {
    let shouldThrow = true;
    const { container, outer } = buildThreeLevelChain(() => {
      if (shouldThrow) {
        throw new Error("mid boom");
      }
      return Promise.resolve("mid");
    });

    await expect(container.resolveAsync(outer)).rejects.toThrow("mid boom");
    shouldThrow = false;

    // A flag left set two levels down reports a cycle that is not there.
    expect(await container.resolveAsync(outer)).toBe("outer:mid");
  });

  it("clears a middle level's flag when its factory rejects", async () => {
    let shouldReject = true;
    const { container, outer } = buildThreeLevelChain(() =>
      shouldReject ? Promise.reject(new Error("mid rejected")) : Promise.resolve("mid"),
    );

    await expect(container.resolveAsync(outer)).rejects.toThrow("mid rejected");
    shouldReject = false;

    expect(await container.resolveAsync(outer)).toBe("outer:mid");
  });

  it("clears a middle level's flag when a deeper level reports a cycle", async () => {
    const cyclic = token<string>("cascade-unwind-cyclic");
    let goCyclic = true;
    const { container, outer } = buildThreeLevelChain(async (ctx) => (goCyclic ? ctx.resolveAsync(cyclic) : "mid"));
    container
      .bind(cyclic)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(cyclic))
      .transient();

    await expect(container.resolveAsync(outer)).rejects.toThrow(CircularDependencyError);
    goCyclic = false;

    expect(await container.resolveAsync(outer)).toBe("outer:mid");
  });

  it("leaves the cascade empty between chains, so a later diamond is not a cycle", async () => {
    const shared = token<string>("cascade-unwind-shared");
    const left = token<string>("cascade-unwind-left");
    const right = token<string>("cascade-unwind-right");
    const root = token<string>("cascade-unwind-root");
    const container = Container.create();
    container
      .bind(shared)
      .toDynamicAsync(async () => "s")
      .transient();
    container
      .bind(left)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(shared))
      .transient();
    container
      .bind(right)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(shared))
      .transient();
    container
      .bind(root)
      .toDynamicAsync(async (ctx) => (await Promise.all([ctx.resolveAsync(left), ctx.resolveAsync(right)])).join("+"))
      .transient();

    // A cascade that failed to pop would leave `shared` on the path for the second sibling.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(await container.resolveAsync(root)).toBe("s+s");
    }
  });

  it("reports only this chain's ancestors, so a missed pop fails here instead of recursing", async () => {
    // The cascade's arrays are shared across every chain a resolver runs. If a level fails to pop
    // them, the next chain sees the previous chain's names — and the only *other* symptom is that a
    // post-await request stops escaping, which recurses until the worker dies rather than failing.
    const leaf = token<string>("cascade-path-leaf");
    const root = token<string>("cascade-path-root");
    const seen: Array<ReadonlyArray<string>> = [];
    const container = Container.create();
    container
      .bind(leaf)
      .toDynamicAsync(async (ctx) => {
        seen.push([...ctx.graph.resolutionPath]);
        return "leaf";
      })
      .transient();
    container
      .bind(root)
      .toDynamicAsync(async (ctx) => `root:${await ctx.resolveAsync(leaf)}`)
      .transient();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(await container.resolveAsync(root)).toBe("root:leaf");
    }

    // Every chain sees exactly its own two levels, never an earlier chain's.
    expect(seen).toEqual([
      ["cascade-path-root", "cascade-path-leaf"],
      ["cascade-path-root", "cascade-path-leaf"],
      ["cascade-path-root", "cascade-path-leaf"],
    ]);
  });
});

describe("the reused root frames are only lent to one resolve at a time", () => {
  it("gives a nested container.resolve() its own pair, so it starts from an empty path", () => {
    const innerToken = token<string>("root-frames-inner");
    const outerToken = token<string>("root-frames-outer");
    const seen: Array<ReadonlyArray<string>> = [];
    const container = Container.create();
    container
      .bind(innerToken)
      .toDynamic((ctx) => {
        seen.push([...ctx.graph.resolutionPath]);
        return "inner";
      })
      .transient();
    container
      .bind(outerToken)
      // Deliberately the container, not `ctx` — a fresh root resolve, not a nested one.
      .toDynamic(() => `outer:${container.resolve(innerToken)}`)
      .transient();

    expect(container.resolve(outerToken)).toBe("outer:inner");
    // A shared pair handed to both would have shown the outer level as the inner one's ancestor.
    expect(seen).toEqual([["root-frames-inner"]]);
  });

  it("hands the pair back after a resolve throws, so later resolves still reuse it", () => {
    const failingToken = token<string>("root-frames-failing");
    const workingToken = token<string>("root-frames-working");
    const container = Container.create();
    container
      .bind(failingToken)
      .toDynamic(() => {
        throw new Error("root frames boom");
      })
      .transient();
    container
      .bind(workingToken)
      .toDynamic((ctx) => `ok:${String(ctx.graph.resolutionPath.length)}`)
      .transient();

    expect(() => container.resolve(failingToken)).toThrow("root frames boom");
    // Depth 1, not 2: the failed resolve popped its frame on the way out.
    expect(container.resolve(workingToken)).toBe("ok:1");
    expect(container.resolve(workingToken)).toBe("ok:1");
  });
});

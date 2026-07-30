/**
 * Async resolution semantics: dynamic-async chains, inflight singleton dedupe,
 * sync/async mixing errors, the ResolutionContext surface inside factories,
 * and the deep-chain paths past RESOLUTION_SET_THRESHOLD (32).
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { AsyncResolutionError, CircularDependencyError } from "#/errors";
import { token } from "#/token";

describe("async chains", () => {
  it("resolves a dynamic-async chain in order", async () => {
    const CHAIN_DEPTH = 8;
    const tokens = Array.from({ length: CHAIN_DEPTH }, (_value, index) => token<number>(`chain-${String(index)}`));
    const container = Container.create();
    container.bind(tokens[0]!).toConstantValue(0);
    for (let index = 1; index < CHAIN_DEPTH; index += 1) {
      const previousToken = tokens[index - 1]!;
      container
        .bind(tokens[index]!)
        .toDynamicAsync(async (ctx) => (await ctx.resolveAsync(previousToken)) + 1)
        .transient();
    }

    await expect(container.resolveAsync(tokens[CHAIN_DEPTH - 1]!)).resolves.toBe(CHAIN_DEPTH - 1);
  });

  it("rejects a sequential await of the same in-flight token as a cycle, but allows re-resolving after settle", async () => {
    const leafToken = token<number>("leaf");
    const doubleToken = token<number>("double");
    const container = Container.create();
    container
      .bind(leafToken)
      .toDynamicAsync(async () => 21)
      .transient();
    container
      .bind(doubleToken)
      .toDynamicAsync(async (ctx) => {
        const first = await ctx.resolveAsync(leafToken);
        const second = await ctx.resolveAsync(leafToken); // settled → path entry released
        return first + second;
      })
      .transient();

    await expect(container.resolveAsync(doubleToken)).resolves.toBe(42);
  });

  it("detects an async cycle through dynamic factories", async () => {
    const aToken = token<number>("a");
    const bToken = token<number>("b");
    const container = Container.create();
    container
      .bind(aToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(bToken))
      .transient();
    container
      .bind(bToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(aToken))
      .transient();

    await expect(container.resolveAsync(aToken)).rejects.toBeInstanceOf(CircularDependencyError);
  });

  it("names the cycle it detected, which is what the per-level bookkeeping is for", async () => {
    // The alternative to keeping this state is what a container without it does: recurse until the
    // stack overflows, reporting a RangeError that names nothing. The path in the message is the
    // whole return on the async lane's per-level cost — see ARCHITECTURE.md.
    const firstToken = token<number>("cycle-first");
    const secondToken = token<number>("cycle-second");
    const thirdToken = token<number>("cycle-third");
    const container = Container.create();
    container
      .bind(firstToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(secondToken))
      .transient();
    container
      .bind(secondToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(thirdToken))
      .transient();
    container
      .bind(thirdToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(firstToken))
      .transient();

    await expect(container.resolveAsync(firstToken)).rejects.toThrow(
      /cycle-first → cycle-second → cycle-third → cycle-first/,
    );
  });
});

describe("concurrent branches of one async chain", () => {
  /** A -> (B, C) in parallel, both -> D. Two siblings sharing a dependency is not a cycle. */
  function buildDiamondContainer(): { container: Container; rootToken: ReturnType<typeof token<number>> } {
    const sharedToken = token<number>("branch-shared");
    const leftToken = token<number>("branch-left");
    const rightToken = token<number>("branch-right");
    const rootToken = token<number>("branch-root");
    const container = Container.create();
    container
      .bind(sharedToken)
      .toDynamicAsync(async () => 1)
      .transient();
    container
      .bind(leftToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(sharedToken))
      .transient();
    container
      .bind(rightToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(sharedToken))
      .transient();
    container
      .bind(rootToken)
      .toDynamicAsync(async (ctx) => {
        const [left, right] = await Promise.all([ctx.resolveAsync(leftToken), ctx.resolveAsync(rightToken)]);
        return left + right;
      })
      .transient();
    return { container, rootToken };
  }

  it("resolves a diamond started in parallel from one factory", async () => {
    const { container, rootToken } = buildDiamondContainer();
    await expect(container.resolveAsync(rootToken)).resolves.toBe(2);
  });

  it("still reports a cycle inside one branch, with only that branch's path", async () => {
    const siblingToken = token<number>("sibling");
    const loopToken = token<number>("loop");
    const rootToken = token<number>("branch-cycle-root");
    const container = Container.create();
    container
      .bind(siblingToken)
      .toDynamicAsync(async () => 1)
      .transient();
    container
      .bind(loopToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(loopToken))
      .transient();
    container
      .bind(rootToken)
      .toDynamicAsync(async (ctx) => {
        const [sibling, looped] = await Promise.all([ctx.resolveAsync(siblingToken), ctx.resolveAsync(loopToken)]);
        return sibling + looped;
      })
      .transient();

    // The sibling branch must not appear in the path: it is not an ancestor of the cycle.
    await expect(container.resolveAsync(rootToken)).rejects.toThrow(/branch-cycle-root → loop → loop$/);
  });

  it("keeps branches independent past the resolution-set threshold", async () => {
    const DEPTH = 40;
    const chainTokens = Array.from({ length: DEPTH }, (_value, index) => token<number>(`deep-branch-${String(index)}`));
    const sharedToken = token<number>("deep-branch-shared");
    const container = Container.create();
    container
      .bind(sharedToken)
      .toDynamicAsync(async () => 1)
      .transient();
    container.bind(chainTokens[0]!).toConstantValue(0);
    for (let index = 1; index < DEPTH; index += 1) {
      const previous = chainTokens[index - 1]!;
      container
        .bind(chainTokens[index]!)
        .toDynamicAsync(async (ctx) => {
          const [previousValue, left, right] = await Promise.all([
            ctx.resolveAsync(previous),
            ctx.resolveAsync(sharedToken),
            ctx.resolveAsync(sharedToken),
          ]);
          return previousValue + left + right - 1;
        })
        .transient();
    }

    await expect(container.resolveAsync(chainTokens[DEPTH - 1]!)).resolves.toBe(DEPTH - 1);
  });

  it("reports a cycle whose every edge is requested after an await", async () => {
    // The cascade lane cannot see these edges — a continuation's ancestors are on no call stack — so
    // the request escapes to the branch lane, which accumulates its own path and catches the repeat.
    const firstToken = token<number>("post-first");
    const secondToken = token<number>("post-second");
    const container = Container.create();
    container
      .bind(firstToken)
      .toDynamicAsync(async (ctx) => {
        await Promise.resolve();
        return ctx.resolveAsync(secondToken);
      })
      .transient();
    container
      .bind(secondToken)
      .toDynamicAsync(async (ctx) => {
        await Promise.resolve();
        return ctx.resolveAsync(firstToken);
      })
      .transient();

    // Named from the first escaped level, not the true root: the ancestors before the escape were
    // never written down. See ARCHITECTURE.md — that is the cascade lane's price.
    await expect(container.resolveAsync(firstToken)).rejects.toThrow(/post-second → post-first → post-second/);
  });

  it("leaves nothing behind between chains", async () => {
    const { container, rootToken } = buildDiamondContainer();
    await Promise.all(Array.from({ length: 8 }, () => container.resolveAsync(rootToken)));
    // A chain that leaked a path entry would make the next one report a cycle that is not there.
    await expect(container.resolveAsync(rootToken)).resolves.toBe(2);
  });
});

describe("async singletons", () => {
  it("dedupes concurrent materialization through the inflight cache", async () => {
    let factoryCalls = 0;
    const connectionToken = token<number>("connection");
    const container = Container.create();
    container
      .bind(connectionToken)
      .toDynamicAsync(async () => {
        factoryCalls += 1;
        await Promise.resolve();
        return factoryCalls;
      })
      .singleton();

    const [first, second, third] = await Promise.all([
      container.resolveAsync(connectionToken),
      container.resolveAsync(connectionToken),
      container.resolveAsync(connectionToken),
    ]);
    expect(factoryCalls).toBe(1);
    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(third).toBe(1);
  });

  it("throws AsyncResolutionError when a sync resolve hits an async binding", () => {
    const asyncToken = token<number>("async-value");
    const container = Container.create();
    container
      .bind(asyncToken)
      .toDynamicAsync(async () => 1)
      .singleton();

    expect(() => container.resolve(asyncToken)).toThrow(AsyncResolutionError);
  });

  it("resolveAsync returns a cached async singleton without re-running the factory", async () => {
    let factoryCalls = 0;
    const configToken = token<number>("config");
    const container = Container.create();
    container
      .bind(configToken)
      .toDynamicAsync(async () => {
        factoryCalls += 1;
        return 5;
      })
      .singleton();

    await container.resolveAsync(configToken);
    await container.resolveAsync(configToken);
    expect(factoryCalls).toBe(1);
  });
});

describe("optional and resolveAll variants", () => {
  it("resolveOptionalAsync returns undefined on miss and the value on hit", async () => {
    const boundToken = token<number>("bound");
    const unboundToken = token<number>("unbound");
    const container = Container.create();
    container
      .bind(boundToken)
      .toDynamicAsync(async () => 9)
      .transient();

    await expect(container.resolveOptionalAsync(boundToken)).resolves.toBe(9);
    await expect(container.resolveOptionalAsync(unboundToken)).resolves.toBeUndefined();
  });

  it("resolveAllAsync resolves every candidate, sync and async alike", async () => {
    const handlerToken = token<string>("handler");
    const container = Container.create();
    container.bind(handlerToken).toConstantValue("sync");
    container
      .bind(handlerToken)
      .toDynamicAsync(async () => "async")
      .whenNamed("late");

    await expect(container.resolveAllAsync(handlerToken)).resolves.toEqual(expect.arrayContaining(["sync", "async"]));
  });
});

describe("ResolutionContext surface inside factories", () => {
  it("exposes resolveOptional, resolveAll, and the constraint graph", () => {
    const missingToken = token<number>("missing");
    const itemToken = token<string>("item");
    const probeToken = token<{
      optionalMiss: number | undefined;
      all: Array<string>;
      path: ReadonlyArray<string>;
      parentName: string | undefined;
    }>("probe");

    const container = Container.create();
    container.bind(itemToken).toConstantValue("one");
    container.bind(itemToken).toConstantValue("two").whenNamed("second");
    container
      .bind(probeToken)
      .toDynamic((ctx) => ({
        optionalMiss: ctx.resolveOptional(missingToken),
        all: ctx.resolveAll(itemToken),
        path: [...ctx.graph.resolutionPath],
        parentName: ctx.graph.parent?.tokenName,
      }))
      .transient();

    const probe = container.resolve(probeToken);
    expect(probe.optionalMiss).toBeUndefined();
    expect(probe.all).toEqual(expect.arrayContaining(["one", "two"]));
    expect(probe.path).toContain("probe");
  });
});

describe("deep chains past the resolution-set threshold", () => {
  function bindDeepChain(
    container: ReturnType<typeof Container.create>,
    depth: number,
  ): ReturnType<typeof token<number>> {
    const tokens = Array.from({ length: depth }, (_value, index) => token<number>(`deep-${String(index)}`));
    container.bind(tokens[0]!).toConstantValue(0);
    for (let index = 1; index < depth; index += 1) {
      const previousToken = tokens[index - 1]!;
      container
        .bind(tokens[index]!)
        .toDynamic((ctx) => ctx.resolve(previousToken) + 1)
        .transient();
    }
    return tokens[depth - 1]!;
  }

  it("resolves a 64-deep sync dynamic chain (deep path engaged)", () => {
    const container = Container.create();
    const leafToken = bindDeepChain(container, 64);
    expect(container.resolve(leafToken)).toBe(63);
  });

  it("detects a cycle introduced at depth beyond the threshold", () => {
    const DEPTH = 40;
    const tokens = Array.from({ length: DEPTH }, (_value, index) => token<number>(`cyclic-${String(index)}`));
    const container = Container.create();
    // Leaf points back to the top of the chain → cycle spans the whole depth.
    container
      .bind(tokens[0]!)
      .toDynamic((ctx) => ctx.resolve(tokens[DEPTH - 1]!))
      .transient();
    for (let index = 1; index < DEPTH; index += 1) {
      const previousToken = tokens[index - 1]!;
      container
        .bind(tokens[index]!)
        .toDynamic((ctx) => ctx.resolve(previousToken) + 1)
        .transient();
    }

    expect(() => container.resolve(tokens[DEPTH - 1]!)).toThrow(CircularDependencyError);
  });

  it("resolves a shared transient dep twice at deep level without a false cycle (diamond past threshold)", () => {
    // A deep node resolves the same transient-dynamic dependency twice in sequence. This is a
    // diamond, not a cycle: cycle detection must clear a binding's in-flight mark once its factory
    // returns, or the second resolve is wrongly rejected as circular.
    const DEPTH = 35;
    const container = Container.create();
    const chain = Array.from({ length: DEPTH }, (_value, index) => token<number>(`diamond-${String(index)}`));
    const sharedToken = token<number>("diamond-shared");
    container
      .bind(sharedToken)
      .toDynamic(() => 7)
      .transient();
    container.bind(chain[0]!).toConstantValue(0);
    for (let index = 1; index < DEPTH; index += 1) {
      const previousToken = chain[index - 1]!;
      if (index === 1) {
        // Deep level (resolved at path length >= threshold): resolve the shared dep twice.
        container
          .bind(chain[index]!)
          .toDynamic((ctx) => ctx.resolve(previousToken) + ctx.resolve(sharedToken) + ctx.resolve(sharedToken))
          .transient();
      } else {
        container
          .bind(chain[index]!)
          .toDynamic((ctx) => ctx.resolve(previousToken) + 1)
          .transient();
      }
    }

    expect(() => container.resolve(chain[DEPTH - 1]!)).not.toThrow();
  });

  it("resolves a 40-deep async dynamic chain (deep async fallback)", async () => {
    const DEPTH = 40;
    const tokens = Array.from({ length: DEPTH }, (_value, index) => token<number>(`deep-async-${String(index)}`));
    const container = Container.create();
    container.bind(tokens[0]!).toConstantValue(0);
    for (let index = 1; index < DEPTH; index += 1) {
      const previousToken = tokens[index - 1]!;
      container
        .bind(tokens[index]!)
        .toDynamicAsync(async (ctx) => (await ctx.resolveAsync(previousToken)) + 1)
        .transient();
    }

    await expect(container.resolveAsync(tokens[DEPTH - 1]!)).resolves.toBe(DEPTH - 1);
  });
});

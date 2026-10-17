/**
 * A singleton or scoped binding started on the async lane is readable synchronously by a later
 * sibling in the same tick. The fan-out starts siblings in order, so the sibling that reads the
 * singleton through a `toDynamic` factory's `ctx.resolve`, an accessor or a top-level `resolve` runs
 * while the first is still "in flight" — and the async lane must have cached whatever it built
 * without awaiting, exactly as the sync lane would have, or the sync guard refuses a value that
 * exists. Every shape here is held to the sync lane on a fresh container, one construction, one
 * shared instance.
 */
import { describe, expect, it } from "vitest";

import type { Container } from "#container/container";
import { Container as ContainerStatic } from "#container/container";
import { tag } from "#core/tag";
import type { Token } from "#core/token";
import { token } from "#core/token";
import type { ResolutionContext } from "#core/types";
import { inject } from "#decorators/inject";
import { injectable } from "#decorators/injectable";
import { AsyncResolutionError } from "#errors";
import { injectAll, optional } from "#injection/descriptor";
import type { DiagnosableContainer, ResolutionDiagnostics } from "#introspection/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#introspection/diagnostics";
import { PLAN_CODEGEN_THRESHOLD } from "#resolution/plan/codegen";
import { whenParentIs } from "#resolution/select/constraints";

interface Materialised {
  readonly singleton: object;
  readonly reader: unknown;
}

/** A graph under test: bound into a fresh container, the root the lanes resolve, and how often the singleton was built. */
interface Shape {
  readonly build: (container: Container) => void;
  readonly root: Token<Materialised>;
  readonly constructed: () => number;
}

function diagnostics(container: unknown): ResolutionDiagnostics {
  return (container as DiagnosableContainer)[RESOLUTION_DIAGNOSTICS]();
}

/** Both lanes' answers for one shape, each on a fresh container. */
interface LaneAnswers {
  readonly fromAsync: Materialised;
  readonly fromSync: Materialised;
}

/**
 * Resolves the shape's root on the async lane of one fresh container and on the sync lane of
 * another, holding each to one construction and one shared instance; the caller holds the two
 * answers to each other.
 */
async function materialiseOnBothLanes(
  shape: Shape,
  host: (container: Container) => Container = (container) => container,
): Promise<LaneAnswers> {
  const asyncContainer = host(ContainerStatic.create());
  shape.build(asyncContainer);
  const before = shape.constructed();
  const fromAsync = await asyncContainer.resolveAsync(shape.root);
  expect(shape.constructed() - before).toBe(1);
  expect(fromAsync.reader).toBe(fromAsync.singleton);

  const syncContainer = host(ContainerStatic.create());
  shape.build(syncContainer);
  const fromSync = syncContainer.resolve(shape.root);
  expect(fromSync.reader).toBe(fromSync.singleton);
  return { fromAsync, fromSync };
}

/** The root every simple shape shares: the singleton first, then the sibling that reads it synchronously. */
function rootOver(
  container: Container,
  root: Token<Materialised>,
  singleton: Token<object>,
  reader: Token<unknown>,
): void {
  container
    .bind(root)
    .toResolved((first: object, second: unknown) => ({ singleton: first, reader: second }), [singleton, reader])
    .transient();
}

/** A singleton factory that fails until told otherwise, counting the instances it did build. */
function coldSingleton(): { factory: () => object; readonly built: () => number; succeed: () => void } {
  let failing = true;
  let built = 0;
  return {
    factory: () => {
      if (failing) {
        throw new Error("not yet");
      }
      built += 1;
      return {};
    },
    built: () => built,
    succeed: () => {
      failing = false;
    },
  };
}

describe("a singleton started on the async lane is readable synchronously by a later sibling", () => {
  it("the differential's counterexample: a tagged dynamic-async dependency over a tagged collection", async () => {
    const t0 = token<unknown>("sibling:T0");
    const k0 = tag<number>("sibling:k0");
    const k1 = tag<number>("sibling:k1");
    const k2 = tag<number>("sibling:k2");

    @injectable([inject(t0, { tags: [k2.of(2)] })])
    class N0 {
      constructor(readonly dep: unknown) {}
    }
    @injectable()
    class N1 {}
    @injectable()
    class N4 {}

    const build = (): Container => {
      const container = ContainerStatic.create();
      container.bind(t0).to(N0).transient();
      container.bind(t0).whenTagged(k0.of(0)).to(N1).singleton();
      container
        .bind(t0)
        .whenTagged(k1.of(1))
        .toDynamic((ctx) => ({ dynamic: 2, dep: ctx.resolve(t0, { tags: [k0.of(0)] }) }))
        .transient();
      container
        .bind(t0)
        .whenTagged(k2.of(2))
        .toDynamicAsync(async (ctx) => ({
          dynamic: 3,
          deps: await ctx.resolveAllAsync(t0, { tags: [k0.of(0), k1.of(1)] }),
        }))
        .transient();
      container.bind(t0).when(whenParentIs(t0)).to(N4).transient();
      return container;
    };

    const container = build();
    const cold = await container.resolveAsync(t0);
    const warm = await container.resolveAsync(t0);
    const interpreted = await build().resolveAsync(t0, {});

    const shape = { dep: { dynamic: 3, deps: [expect.any(N1), { dynamic: 2, dep: expect.any(N1) }] } };
    expect(cold).toBeInstanceOf(N0);
    expect(cold).toEqual(shape);
    expect(warm).toEqual(shape);
    expect(interpreted).toEqual(shape);
    // The collection's singleton member is the one the factory member read.
    const collection = (cold as N0).dep as { deps: [N1, { dep: N1 }] };
    expect(collection.deps[1].dep).toBe(collection.deps[0]);
  });

  it("the smallest shape: a resolved singleton, a factory reading it, a resolved root over both", async () => {
    const singleton = token<object>("sibling:Singleton");
    const reader = token<unknown>("sibling:Reader");
    const root = token<Materialised>("sibling:Root");
    let constructed = 0;
    const lanes = await materialiseOnBothLanes({
      root,
      constructed: () => constructed,
      build: (container) => {
        container
          .bind(singleton)
          .toResolved(() => {
            constructed += 1;
            return {};
          }, [])
          .singleton();
        container
          .bind(reader)
          .toDynamic((ctx) => ctx.resolve(singleton))
          .transient();
        rootOver(container, root, singleton, reader);
      },
    });
    expect(lanes.fromAsync).toEqual(lanes.fromSync);
  });

  describe("whatever builds the singleton without awaiting", () => {
    const dependency = token<number>("sibling:Dependency");
    const leaf = token<object>("sibling:Leaf");

    @injectable()
    class Bare {}

    @injectable([dependency, leaf])
    class WithDeps {
      constructor(
        readonly dependency: number,
        readonly leaf: object,
      ) {}
    }

    @injectable()
    class Transient {}

    const kinds: ReadonlyArray<[string, (container: Container, singleton: Token<object>) => void]> = [
      [
        "a class with no dependencies",
        (container, singleton) => {
          container.bind(singleton).to(Bare).singleton();
        },
      ],
      [
        "a class over a constant and a transient class",
        (container, singleton) => {
          container.bind(dependency).toConstantValue(1);
          container.bind(leaf).to(Transient).transient();
          container.bind(singleton).to(WithDeps).singleton();
        },
      ],
      [
        "a class with a synchronous onActivation of its own",
        (container, singleton) => {
          container
            .bind(singleton)
            .to(Bare)
            .singleton()
            .onActivation((_ctx, instance) => instance);
        },
      ],
      [
        "a class under a synchronous container-level onActivation",
        (container, singleton) => {
          container.bind(singleton).to(Bare).singleton();
          container.onActivation(singleton, (_ctx, instance) => instance);
        },
      ],
      [
        "a constant with an onActivation hook",
        (container, singleton) => {
          container
            .bind(singleton)
            .toConstantValue({})
            .onActivation((_ctx, instance) => instance);
        },
      ],
      [
        "a resolved factory over a constant",
        (container, singleton) => {
          container.bind(dependency).toConstantValue(1);
          container
            .bind(singleton)
            .toResolved((value: number) => ({ value }), [dependency])
            .singleton();
        },
      ],
    ];

    it.each(kinds)("%s", async (_name, bindSingleton) => {
      const singleton = token<object>("sibling:Singleton");
      const reader = token<unknown>("sibling:Reader");
      const root = token<Materialised>("sibling:Root");
      let seen = 0;
      const lanes = await materialiseOnBothLanes({
        root,
        constructed: () => seen,
        build: (container) => {
          bindSingleton(container, singleton);
          container.onActivation(singleton, (_ctx, instance) => {
            seen += 1;
            return instance;
          });
          container
            .bind(reader)
            .toDynamic((ctx) => ctx.resolve(singleton))
            .transient();
          rootOver(container, root, singleton, reader);
        },
      });
      expect(lanes.fromAsync).toEqual(lanes.fromSync);
    });
  });

  describe("however the sibling reads it", () => {
    const singleton = token<object>("sibling:Singleton");
    const reader = token<unknown>("sibling:Reader");
    const root = token<Materialised>("sibling:Root");

    @injectable()
    class Bare {}

    @injectable([injectAll(singleton)])
    class OverCollection {
      constructor(readonly all: ReadonlyArray<object>) {}
    }

    @injectable([optional(singleton)])
    class OverOptional {
      constructor(readonly maybe: object | undefined) {}
    }

    @injectable([])
    class OverAccessor {
      @inject(singleton) accessor singleton!: object;
    }

    function bindCountedSingleton(container: Container, count: () => void): void {
      container
        .bind(singleton)
        .to(Bare)
        .singleton()
        .onActivation((_ctx, instance) => {
          count();
          return instance;
        });
    }

    const readers: ReadonlyArray<[string, (container: Container) => void]> = [
      [
        "ctx.resolveOptional",
        (container) => {
          container.bind(reader).toDynamic((ctx) => ctx.resolveOptional(singleton));
        },
      ],
      [
        "ctx.resolveAll, unwrapped",
        (container) => {
          container.bind(reader).toDynamic((ctx) => ctx.resolveAll(singleton)[0]);
        },
      ],
      [
        "a transient class injecting the collection, resolved from a factory",
        (container) => {
          container.bind(OverCollection).toSelf().transient();
          container.bind(reader).toDynamic((ctx) => ctx.resolve(OverCollection).all[0]);
        },
      ],
      [
        "a transient class injecting it optionally, resolved from a factory",
        (container) => {
          container.bind(OverOptional).toSelf().transient();
          container.bind(reader).toDynamic((ctx) => ctx.resolve(OverOptional).maybe);
        },
      ],
      [
        "an accessor-injected sibling",
        (container) => {
          container.bind(OverAccessor).toSelf().transient();
          container.bind(reader).toDynamic((ctx) => ctx.resolve(OverAccessor).singleton);
        },
      ],
    ];

    it.each(readers)("%s", async (_name, bindReader) => {
      let constructed = 0;
      const lanes = await materialiseOnBothLanes({
        root,
        constructed: () => constructed,
        build: (container) => {
          bindCountedSingleton(container, () => {
            constructed += 1;
          });
          bindReader(container);
          rootOver(container, root, singleton, reader);
        },
      });
      expect(lanes.fromAsync).toEqual(lanes.fromSync);
    });

    it("an async factory's synchronous prefix", async () => {
      // The sync lane cannot resolve this reader at all, so the cold async answer is held to the warm one.
      let constructed = 0;
      const container = ContainerStatic.create();
      bindCountedSingleton(container, () => {
        constructed += 1;
      });
      container.bind(reader).toDynamicAsync(async (ctx) => ctx.resolve(singleton));
      rootOver(container, root, singleton, reader);

      const cold = await container.resolveAsync(root);
      const warm = await container.resolveAsync(root);
      expect(constructed).toBe(1);
      expect(cold.reader).toBe(cold.singleton);
      expect(warm).toEqual(cold);
    });

    it("by name", async () => {
      const named = token<object>("sibling:Named");
      let constructed = 0;
      const lanes = await materialiseOnBothLanes({
        root,
        constructed: () => constructed,
        build: (container) => {
          container
            .bind(named)
            .whenNamed("primary")
            .to(Bare)
            .singleton()
            .onActivation((_ctx, instance) => {
              constructed += 1;
              return instance;
            });
          container.bind(reader).toDynamic((ctx) => ctx.resolve(named, { name: "primary" }));
          container
            .bind(root)
            .toResolved(
              (first: object, second: unknown) => ({ singleton: first, reader: second }),
              [inject(named, { name: "primary" }), reader],
            )
            .transient();
        },
      });
      expect(lanes.fromAsync).toEqual(lanes.fromSync);
    });
  });

  describe("as collection members", () => {
    it("by tag: the singleton member, then a factory member reading it", async () => {
      const member = token<object>("sibling:Member");
      const key = tag<string>("sibling:role");
      let constructed = 0;
      const build = (container: Container): void => {
        container
          .bind(member)
          .whenTagged(key.of("direct"))
          .toResolved(() => {
            constructed += 1;
            return {};
          }, [])
          .singleton();
        container
          .bind(member)
          .whenTagged(key.of("read"))
          .toDynamic((ctx) => ctx.resolve(member, { tags: [key.of("direct")] }))
          .transient();
      };
      const request = { tags: [key.of("direct"), key.of("read")] };

      const asyncContainer = ContainerStatic.create();
      build(asyncContainer);
      const fromAsync = await asyncContainer.resolveAllAsync(member, request);
      expect(constructed).toBe(1);
      expect(fromAsync).toHaveLength(2);
      expect(fromAsync[1]).toBe(fromAsync[0]);

      const syncContainer = ContainerStatic.create();
      build(syncContainer);
      const fromSync = syncContainer.resolveAll(member, request);
      expect(constructed).toBe(2);
      expect(fromSync[1]).toBe(fromSync[0]);
    });

    it("via an alias: the alias to the singleton, then a factory member reading it", async () => {
      const member = token<object>("sibling:Member");
      const singleton = token<object>("sibling:Singleton");
      let constructed = 0;
      const build = (container: Container): void => {
        container
          .bind(singleton)
          .toResolved(() => {
            constructed += 1;
            return {};
          }, [])
          .singleton();
        // Members, so the second default-slot binding joins the first instead of displacing it.
        container.bind(member).many().toAlias(singleton);
        container
          .bind(member)
          .many()
          .toDynamic((ctx) => ctx.resolve(singleton))
          .transient();
      };

      const asyncContainer = ContainerStatic.create();
      build(asyncContainer);
      const fromAsync = await asyncContainer.resolveAllAsync(member);
      expect(constructed).toBe(1);
      expect(fromAsync).toHaveLength(2);
      expect(fromAsync[1]).toBe(fromAsync[0]);

      const syncContainer = ContainerStatic.create();
      build(syncContainer);
      const fromSync = syncContainer.resolveAll(member);
      expect(constructed).toBe(2);
      expect(fromSync[1]).toBe(fromSync[0]);
    });
  });

  it("scoped in a child, and a parent's singleton read from a child", async () => {
    const singleton = token<object>("sibling:Singleton");
    const reader = token<unknown>("sibling:Reader");
    const root = token<Materialised>("sibling:Root");
    let scopedBuilt = 0;
    const lanes = await materialiseOnBothLanes(
      {
        root,
        constructed: () => scopedBuilt,
        build: (child) => {
          child
            .bind(singleton)
            .toResolved(() => {
              scopedBuilt += 1;
              return {};
            }, [])
            .scoped();
          child.bind(reader).toDynamic((ctx) => ctx.resolve(singleton));
          rootOver(child, root, singleton, reader);
        },
      },
      (parent) => parent.createChild(),
    );
    expect(lanes.fromAsync).toEqual(lanes.fromSync);

    let parentBuilt = 0;
    const parent = ContainerStatic.create();
    parent
      .bind(singleton)
      .toResolved(() => {
        parentBuilt += 1;
        return {};
      }, [])
      .singleton();
    parent.bind(reader).toDynamic((ctx) => ctx.resolve(singleton));
    rootOver(parent, root, singleton, reader);
    const fromChild = await parent.createChild().resolveAsync(root);
    expect(parentBuilt).toBe(1);
    expect(fromChild.reader).toBe(fromChild.singleton);
    expect(parent.resolve(singleton)).toBe(fromChild.singleton);
  });

  it("across two top-level calls started in one tick, and a sync resolve right after an async one", async () => {
    const singleton = token<object>("sibling:Singleton");
    const reader = token<object>("sibling:Reader");
    let constructed = 0;
    const container = ContainerStatic.create();
    container
      .bind(singleton)
      .toResolved(() => {
        constructed += 1;
        return {};
      }, [])
      .singleton();
    container.bind(reader).toDynamic((ctx) => ctx.resolve(singleton));

    const pending = container.resolveAsync(singleton);
    const readNow = container.resolve(reader);
    const [instance, read] = await Promise.all([pending, container.resolveAsync(reader)]);
    expect(constructed).toBe(1);
    expect(readNow).toBe(instance);
    expect(read).toBe(instance);
  });

  it("inside a factory's own Promise.all", async () => {
    const singleton = token<object>("sibling:Singleton");
    const reader = token<object>("sibling:Reader");
    const root = token<[object, object]>("sibling:Pair");
    let constructed = 0;
    const container = ContainerStatic.create();
    container
      .bind(singleton)
      .toResolved(() => {
        constructed += 1;
        return {};
      }, [])
      .singleton();
    container.bind(reader).toDynamic((ctx) => ctx.resolve(singleton));
    container
      .bind(root)
      .toDynamicAsync((ctx: ResolutionContext) => Promise.all([ctx.resolveAsync(singleton), ctx.resolveAsync(reader)]))
      .transient();

    const [instance, read] = await container.resolveAsync(root);
    expect(constructed).toBe(1);
    expect(read).toBe(instance);
  });

  describe("through a compiled plan, with the singleton still cold", () => {
    // The first request interprets and the second compiles; the plan's own run count generates it,
    // so the run after that many failing runs is the first one the generated function serves.
    const tiers: ReadonlyArray<[string, number]> = [
      ["the closure tier", 1],
      ["the generated tier", PLAN_CODEGEN_THRESHOLD + 1],
    ];

    it.each(tiers)(
      "the async plan's escape caches it before the sibling that reads it starts (%s)",
      async (_tier, failingRuns) => {
        const singleton = token<object>("sibling:Singleton");
        const reader = token<unknown>("sibling:Reader");
        const root = token<Materialised>("sibling:Root");
        const cold = coldSingleton();
        const container = ContainerStatic.create();
        container.bind(singleton).toResolved(cold.factory, []).singleton();
        container.bind(reader).toDynamic((ctx) => ctx.resolve(singleton));
        rootOver(container, root, singleton, reader);

        for (let run = 0; run < failingRuns; run += 1) {
          await expect(container.resolveAsync(root)).rejects.toThrow("not yet");
        }
        cold.succeed();
        const materialised = await container.resolveAsync(root);
        expect(cold.built()).toBe(1);
        expect(materialised.reader).toBe(materialised.singleton);
        // The optimization must have been active, not merely the answer correct.
        expect(diagnostics(container).compiledAsyncPlanCount).toBe(1);
        expect(diagnostics(container).generatedPlanCount).toBe(failingRuns > 1 ? 1 : 0);
      },
    );

    it.each(tiers)("a sync plan reads it once the async lane has cached it (%s)", async (_tier, failingRuns) => {
      const singleton = token<object>("sibling:Singleton");
      const planned = token<{ singleton: object }>("sibling:Planned");
      const cold = coldSingleton();
      const container = ContainerStatic.create();
      container.bind(singleton).toResolved(cold.factory, []).singleton();
      container
        .bind(planned)
        .toResolved((instance: object) => ({ singleton: instance }), [singleton])
        .transient();
      for (let run = 0; run < failingRuns; run += 1) {
        expect(() => container.resolve(planned)).toThrow("not yet");
      }
      cold.succeed();

      const pending = container.resolveAsync(singleton);
      const fromPlan = container.resolve(planned);
      expect(cold.built()).toBe(1);
      await expect(pending).resolves.toBe(fromPlan.singleton);
      expect(diagnostics(container).compiledPlanCount).toBe(1);
      expect(diagnostics(container).generatedPlanCount).toBe(failingRuns > 1 ? 1 : 0);
    });
  });

  it("keeps refusing a singleton whose materialization is genuinely pending, and answers it once cached", async () => {
    const singleton = token<object>("sibling:Singleton");
    const reader = token<unknown>("sibling:Reader");
    const root = token<Materialised>("sibling:Root");
    const container = ContainerStatic.create();
    container
      .bind(singleton)
      .toDynamicAsync(async () => {
        await Promise.resolve();
        return {};
      })
      .singleton();
    container.bind(reader).toDynamic((ctx) => ctx.resolve(singleton));
    rootOver(container, root, singleton, reader);

    // The sync lane would have refused this read too: the value cannot exist in the reader's tick.
    await expect(container.resolveAsync(root)).rejects.toThrow(AsyncResolutionError);
    const warm = await container.resolveAsync(root);
    expect(warm.reader).toBe(warm.singleton);
  });
});

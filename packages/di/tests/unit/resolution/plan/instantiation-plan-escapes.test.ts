/**
 * A compiled plan may contain *escapes* — dependencies the compiler can't see through, which
 * re-enter the runtime resolver. These tests pin the contract that an escape is behaviourally
 * indistinguishable from never having compiled: same cycle detection, same constraint context,
 * same optional/multi/named semantics, same activation and scope errors.
 *
 * Plans only compile after the graph has been resolved once (lifecycle metadata discovery), so
 * every case warms first and then asserts on the compiled resolve.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import type { ConstraintContext, ResolutionContext } from "#/core/types";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { CircularDependencyError, MissingScopeContextError } from "#/errors/errors";
import { injectAll, optional } from "#/injection/descriptor";

const WARM_ITERATIONS = 5;

function warm(resolveOnce: () => unknown): void {
  for (let index = 0; index < WARM_ITERATIONS; index += 1) {
    resolveOnce();
  }
}

describe("escaped dependencies inside a compiled plan", () => {
  it("keeps the whole graph compiled around one dynamic dep", () => {
    const configToken = token<{ url: string }>("config");
    let factoryCalls = 0;

    @injectable([configToken])
    class Leaf {
      constructor(readonly config: { url: string }) {}
    }

    @injectable([Leaf])
    class Root {
      constructor(readonly leaf: Leaf) {}
    }

    const container = Container.create();
    container.bind(configToken).toDynamic(() => {
      factoryCalls += 1;
      return { url: "https://example.test" };
    });
    container.bind(Leaf).toSelf().transient();
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));
    factoryCalls = 0;

    const root = container.resolve(Root);
    expect(root.leaf.config.url).toBe("https://example.test");
    expect(factoryCalls).toBe(1);
  });

  it("an escaped factory that throws leaves the escape reusable", () => {
    const configToken = token<string>("escape-throwing-config");
    let shouldThrow = false;

    @injectable([configToken])
    class Root {
      constructor(readonly config: string) {}
    }

    const container = Container.create();
    container.bind(configToken).toDynamic(() => {
      if (shouldThrow) {
        throw new Error("boom");
      }
      return "ok";
    });
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    shouldThrow = true;
    expect(() => container.resolve(Root)).toThrow("boom");
    expect(() => container.resolve(Root)).toThrow("boom");

    shouldThrow = false;
    expect(container.resolve(Root).config).toBe("ok");
  });

  it("detects a cycle that closes through an escaped factory", () => {
    const spawnToken = token<unknown>("spawn");

    @injectable([spawnToken])
    class Root {
      constructor(readonly spawned: unknown) {}
    }

    const container = Container.create();
    container.bind(Root).toSelf().transient();
    container.bind(spawnToken).toDynamic((ctx: ResolutionContext) => ctx.resolve(Root));

    expect(() => container.resolve(Root)).toThrow(CircularDependencyError);
    // Warming cannot happen (the graph never resolves), so re-assert the compiled attempt too.
    expect(() => container.resolve(Root)).toThrow(CircularDependencyError);
  });

  it("reports the escaped cycle with the full path, root first", () => {
    const spawnToken = token<unknown>("spawn");

    @injectable([spawnToken])
    class Root {
      constructor(readonly spawned: unknown) {}
    }

    const container = Container.create();
    container.bind(Root).toSelf().transient();
    container.bind(spawnToken).toDynamic((ctx: ResolutionContext) => ctx.resolve(Root));

    let thrown: unknown;
    try {
      container.resolve(Root);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(CircularDependencyError);
    expect((thrown as CircularDependencyError).message).toContain("Root");
    expect((thrown as CircularDependencyError).message).toContain("spawn");
  });

  it("does not mistake a diamond for a cycle", () => {
    const sharedToken = token<{ id: number }>("shared");

    @injectable([sharedToken])
    class Left {
      constructor(readonly shared: { id: number }) {}
    }

    @injectable([sharedToken])
    class Right {
      constructor(readonly shared: { id: number }) {}
    }

    @injectable([Left, Right])
    class Root {
      constructor(
        readonly left: Left,
        readonly right: Right,
      ) {}
    }

    const container = Container.create();
    container.bind(sharedToken).toDynamic(() => ({ id: 7 }));
    container.bind(Left).toSelf().transient();
    container.bind(Right).toSelf().transient();
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    const root = container.resolve(Root);
    expect(root.left.shared.id).toBe(7);
    expect(root.right.shared.id).toBe(7);
  });

  it("gives an escaped constraint predicate the plan's ancestors", () => {
    const portToken = token<number>("port");
    const seenPaths: Array<Array<string>> = [];

    @injectable([portToken])
    class Leaf {
      constructor(readonly port: number) {}
    }

    @injectable([Leaf])
    class Root {
      constructor(readonly leaf: Leaf) {}
    }

    const container = Container.create();
    container.bind(Root).toSelf().transient();
    container.bind(Leaf).toSelf().transient();
    container
      .bind(portToken)
      .toDynamic(() => 8080)
      .when((ctx: ConstraintContext) => {
        seenPaths.push([...ctx.resolutionPath]);
        return true;
      })
      .transient();

    warm(() => container.resolve(Root));
    seenPaths.length = 0;

    expect(container.resolve(Root).leaf.port).toBe(8080);
    expect(seenPaths).toHaveLength(1);
    expect(seenPaths[0]).toEqual(["Root", "Leaf"]);
  });

  it("keeps optional semantics for an unbound optional param", () => {
    const missingToken = token<string>("missing");

    @injectable([optional(missingToken)])
    class Root {
      constructor(readonly maybe: string | undefined) {}
    }

    const container = Container.create();
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).maybe).toBeUndefined();
  });

  it("keeps multi semantics for a multi param", () => {
    const pluginToken = token<string>("plugin");

    @injectable([injectAll(pluginToken)])
    class Root {
      constructor(readonly plugins: Array<string>) {}
    }

    const container = Container.create();
    container.bind(pluginToken).toConstantValue("a").whenNamed("a");
    container.bind(pluginToken).toConstantValue("b").whenNamed("b");
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).plugins.toSorted()).toEqual(["a", "b"]);
  });

  it("keeps named-slot selection for a named param", () => {
    const driverToken = token<string>("driver");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("primary-driver").whenNamed("primary");
    container.bind(driverToken).toConstantValue("backup-driver").whenNamed("backup");
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).driver).toBe("primary-driver");
  });

  it("still throws for a scoped dep resolved outside a child", () => {
    const requestToken = token<{ id: string }>("request");

    @injectable([requestToken])
    class Root {
      constructor(readonly request: { id: string }) {}
    }

    const container = Container.create();
    container.bind(Root).toSelf().transient();
    container
      .bind(requestToken)
      .toDynamic(() => ({ id: "r1" }))
      .scoped();

    expect(() => container.resolve(Root)).toThrow(MissingScopeContextError);

    const child = container.createChild();
    warm(() => child.resolve(Root));
    expect(child.resolve(Root).request.id).toBe("r1");
  });

  it("runs an activation hook on an escaped dep", () => {
    const greetingToken = token<string>("greeting");

    @injectable([greetingToken])
    class Root {
      constructor(readonly greeting: string) {}
    }

    const container = Container.create();
    container.bind(Root).toSelf().transient();
    container
      .bind(greetingToken)
      .toDynamic(() => "hello")
      .transient()
      .onActivation((_ctx, value) => `${value}!`);

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).greeting).toBe("hello!");
  });

  it("materializes a singleton dep once, then reads it from cache", () => {
    const counterToken = token<{ count: number }>("counter");
    let constructions = 0;

    @injectable([counterToken])
    class Root {
      constructor(readonly counter: { count: number }) {}
    }

    const container = Container.create();
    container.bind(Root).toSelf().transient();
    container
      .bind(counterToken)
      .toDynamic(() => {
        constructions += 1;
        return { count: constructions };
      })
      .singleton();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).counter.count).toBe(1);
    expect(constructions).toBe(1);
  });
});

/**
 * A name-only dependency is settled at compile time when, and only when, the registry can settle it
 * without reading a resolution path. These pin the boundary: what may be baked in, what must stay on
 * the runtime path, and that a baked answer still tracks a rebind.
 *
 * Plans compile after the graph has resolved once, so every case warms before it asserts.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { NoMatchingBindingError } from "#/errors/errors";

const WARM_ITERATIONS = 5;

function warm(resolveOnce: () => unknown): void {
  for (let index = 0; index < WARM_ITERATIONS; index += 1) {
    resolveOnce();
  }
}

describe("a named dependency inside a compiled plan", () => {
  it("resolves the named constant, not the default one", () => {
    const driverToken = token<string>("named-plan-driver");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("default-driver");
    container.bind(driverToken).toConstantValue("primary-driver").whenNamed("primary");
    container.bind(driverToken).toConstantValue("backup-driver").whenNamed("backup");
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).driver).toBe("primary-driver");
  });

  it("bakes a named dependency into the async plan the same way", async () => {
    const driverToken = token<string>("named-plan-async-driver");
    const rootToken = token<{ driver: string }>("named-plan-async-root");

    const container = Container.create();
    container.bind(driverToken).toConstantValue("primary-driver").whenNamed("primary");
    container
      .bind(rootToken)
      .toResolvedAsync(async (driver: string) => ({ driver }), [inject(driverToken, { name: "primary" })] as const)
      .transient();

    for (let index = 0; index < WARM_ITERATIONS; index += 1) {
      await container.resolveAsync(rootToken);
    }

    expect((await container.resolveAsync(rootToken)).driver).toBe("primary-driver");
  });

  it("leaves an async named dependency to the runtime when its candidate carries a predicate", async () => {
    const driverToken = token<string>("named-plan-async-predicated-driver");
    const rootToken = token<{ driver: string }>("named-plan-async-predicated-root");

    const container = Container.create();
    container
      .bind(driverToken)
      .toConstantValue("primary-driver")
      .whenNamed("primary")
      .when(() => true);
    container
      .bind(rootToken)
      .toResolvedAsync(async (driver: string) => ({ driver }), [inject(driverToken, { name: "primary" })] as const)
      .transient();

    for (let index = 0; index < WARM_ITERATIONS; index += 1) {
      await container.resolveAsync(rootToken);
    }

    expect((await container.resolveAsync(rootToken)).driver).toBe("primary-driver");
  });

  it("resolves a named singleton to the named binding on its first materialization", () => {
    const driverToken = token<{ id: string }>("named-plan-singleton");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: { id: string }) {}
    }

    const container = Container.create();
    container
      .bind(driverToken)
      .toDynamic(() => ({ id: "default" }))
      .singleton();
    container
      .bind(driverToken)
      .toDynamic(() => ({ id: "primary" }))
      .whenNamed("primary")
      .singleton();
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    const first = container.resolve(Root).driver;

    expect(first.id).toBe("primary");
    // The cached read and the cold materialization are different branches of the same thunk.
    expect(container.resolve(Root).driver).toBe(first);
  });

  it("replays the name, not the default slot, when the named binding is opaque", () => {
    const driverToken = token<string>("named-plan-dynamic");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    // A factory is opaque to the compiler, so this dependency reaches the plan's terminal escape —
    // which resolves the default slot unless the escape carries the request that selected it.
    container.bind(driverToken).toDynamic(() => "default-driver");
    container
      .bind(driverToken)
      .toDynamic(() => "primary-driver")
      .whenNamed("primary");
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).driver).toBe("primary-driver");
  });

  it("leaves the selection to the runtime when the named candidate carries a predicate", () => {
    const driverToken = token<string>("named-plan-predicated");
    let admit = true;

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container
      .bind(driverToken)
      .toConstantValue("gated-driver")
      .whenNamed("primary")
      .when(() => admit);
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));
    expect(container.resolve(Root).driver).toBe("gated-driver");

    admit = false;

    expect(() => container.resolve(Root)).toThrow(NoMatchingBindingError);
  });

  it("tracks a rebind of the named dependency after the plan is cached", () => {
    const driverToken = token<string>("named-plan-rebound");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("first-driver").whenNamed("primary");
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));
    expect(container.resolve(Root).driver).toBe("first-driver");

    container.unbind(driverToken);
    container.bind(driverToken).toConstantValue("second-driver").whenNamed("primary");

    expect(container.resolve(Root).driver).toBe("second-driver");
  });

  it("still reports a name nothing is bound to", () => {
    const driverToken = token<string>("named-plan-missing");

    @injectable([inject(driverToken, { name: "absent" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("present-driver").whenNamed("present");
    container.bind(Root).toSelf().transient();

    expect(() => container.resolve(Root)).toThrow(NoMatchingBindingError);
  });

  it("resolves a named dependency owned by a parent from a child's compiled plan", () => {
    const driverToken = token<string>("named-plan-parent-owned");

    @injectable([inject(driverToken, { name: "primary" })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const parent = Container.create();
    parent.bind(driverToken).toConstantValue("parent-primary").whenNamed("primary");

    const child = parent.createChild();
    child.bind(Root).toSelf().transient();

    warm(() => child.resolve(Root));

    expect(child.resolve(Root).driver).toBe("parent-primary");
  });
});

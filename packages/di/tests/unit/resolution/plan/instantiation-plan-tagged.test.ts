/**
 * A single-tag dependency is settled at compile time when, and only when, the registry can settle it
 * without reading a resolution path — the named settlement's rule, on the tagged lane. These pin the
 * same boundary: what may be baked in, what must stay on the runtime path, and that a baked answer
 * still tracks a rebind.
 *
 * Plans compile after the graph has resolved once, so every case warms before it asserts.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
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

const Role = tag<string>("tagged-plan-role");
const Size = tag<string>("tagged-plan-size");

describe("a tagged dependency inside a compiled plan", () => {
  it("resolves the tagged constant, not the default one", () => {
    const driverToken = token<string>("tagged-plan-driver");

    @injectable([inject(driverToken, { tag: Role.of("primary") })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("default-driver");
    container.bind(driverToken).toConstantValue("primary-driver").whenTagged(Role.of("primary"));
    container.bind(driverToken).toConstantValue("backup-driver").whenTagged(Role.of("backup"));
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).driver).toBe("primary-driver");
  });

  it("resolves a tagged singleton to the tagged binding on its first materialization", () => {
    const driverToken = token<{ id: string }>("tagged-plan-singleton");

    @injectable([inject(driverToken, { tag: Role.of("primary") })])
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
      .whenTagged(Role.of("primary"))
      .singleton();
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    const first = container.resolve(Root).driver;

    expect(first.id).toBe("primary");
    // The cached read and the cold materialization are different branches of the same thunk.
    expect(container.resolve(Root).driver).toBe(first);
  });

  it("replays the tag, not the default slot, when the tagged binding is opaque", () => {
    const driverToken = token<string>("tagged-plan-dynamic");

    @injectable([inject(driverToken, { tag: Role.of("primary") })])
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
      .whenTagged(Role.of("primary"));
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).driver).toBe("primary-driver");
  });

  it("leaves the selection to the runtime when the tagged candidate carries a predicate", () => {
    const driverToken = token<string>("tagged-plan-predicated");
    let admit = true;

    @injectable([inject(driverToken, { tag: Role.of("primary") })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container
      .bind(driverToken)
      .toConstantValue("gated-driver")
      .whenTagged(Role.of("primary"))
      .when(() => admit);
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));
    expect(container.resolve(Root).driver).toBe("gated-driver");

    admit = false;

    expect(() => container.resolve(Root)).toThrow(NoMatchingBindingError);
  });

  it("tracks a rebind of the tagged dependency after the plan is cached", () => {
    const driverToken = token<string>("tagged-plan-rebound");

    @injectable([inject(driverToken, { tag: Role.of("primary") })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("first-driver").whenTagged(Role.of("primary"));
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));
    expect(container.resolve(Root).driver).toBe("first-driver");

    container.unbind(driverToken);
    container.bind(driverToken).toConstantValue("second-driver").whenTagged(Role.of("primary"));

    expect(container.resolve(Root).driver).toBe("second-driver");
  });

  it("still reports a tag nothing is bound to", () => {
    const driverToken = token<string>("tagged-plan-missing");

    @injectable([inject(driverToken, { tag: Role.of("absent") })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("present-driver").whenTagged(Role.of("present"));
    container.bind(Root).toSelf().transient();

    expect(() => container.resolve(Root)).toThrow(NoMatchingBindingError);
  });

  it("resolves a tagged dependency owned by a parent from a child's compiled plan", () => {
    const driverToken = token<string>("tagged-plan-parent-owned");

    @injectable([inject(driverToken, { tag: Role.of("primary") })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const parent = Container.create();
    parent.bind(driverToken).toConstantValue("parent-primary").whenTagged(Role.of("primary"));

    const child = parent.createChild();
    child.bind(Root).toSelf().transient();

    warm(() => child.resolve(Root));

    expect(child.resolve(Root).driver).toBe("parent-primary");
  });

  it("settles the tagged dependency on the async plan lane too", async () => {
    const driverToken = token<string>("tagged-plan-async");

    @injectable([inject(driverToken, { tag: Role.of("primary") })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("default-driver");
    container.bind(driverToken).toConstantValue("primary-driver").whenTagged(Role.of("primary"));
    container.bind(Root).toSelf().transient();

    for (let index = 0; index < WARM_ITERATIONS; index += 1) {
      await container.resolveAsync(Root);
    }

    expect((await container.resolveAsync(Root)).driver).toBe("primary-driver");
  });

  it("keeps a two-tag dependency on the runtime path, resolved correctly", () => {
    const driverToken = token<string>("tagged-plan-two-tags");

    @injectable([inject(driverToken, { tags: [Role.of("primary"), Size.of("large")] })])
    class Root {
      constructor(readonly driver: string) {}
    }

    const container = Container.create();
    container.bind(driverToken).toConstantValue("single-tag-driver").whenTagged(Role.of("primary"));
    container
      .bind(driverToken)
      .toConstantValue("two-tag-driver")
      .whenTagged(Role.of("primary"))
      .whenTagged(Size.of("large"));
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    // Most-specific-wins on tag count: the two-tag slot is the closer match for a two-tag request.
    expect(container.resolve(Root).driver).toBe("two-tag-driver");
  });
});

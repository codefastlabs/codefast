import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { token } from "#/token";
import type { BindingScope, ResolutionContext } from "#/types";

describe("Container public API inference", () => {
  it("resolveOptional widens to undefined union", () => {
    const T = token<string>("s");
    const container = Container.create();
    expectTypeOf(container.resolveOptional(T)).toEqualTypeOf<string | undefined>();
  });

  it("resolveOptionalAsync returns a promise of the optional union", async () => {
    const T = token<string>("s");
    const container = Container.create();
    const pending = container.resolveOptionalAsync(T);
    expectTypeOf(pending).toEqualTypeOf<Promise<string | undefined>>();
    await expect(pending).resolves.toBeUndefined();
  });

  it("resolveAll narrows to array of token value", () => {
    const T = token<number>("n");
    const container = Container.create();
    container.bind(T).toConstantValue(1).whenNamed("a");
    container.bind(T).toConstantValue(2).whenNamed("b");
    expectTypeOf(container.resolveAll(T)).toEqualTypeOf<number[]>();
    expect(container.resolveAll(T).length).toBe(2);
  });

  it("createChild resolves parent bindings with the same value type", () => {
    const T = token<{ id: "parent" }>("t");
    const parent = Container.create();
    parent.bind(T).toConstantValue({ id: "parent" });
    const child = parent.createChild();
    expectTypeOf(child.resolve(T)).toEqualTypeOf<{ id: "parent" }>();
  });

  it("toDynamic passes ResolutionContext to the factory", () => {
    const Out = token<string>("out");
    const container = Container.create();
    container.bind(Out).toDynamic((ctx) => {
      expectTypeOf(ctx).toMatchTypeOf<ResolutionContext>();
      return "ok";
    });
    expectTypeOf(container.resolve(Out)).toEqualTypeOf<string>();
    expect(container.resolve(Out)).toBe("ok");
  });

  it("resolve with name hint stays typed as token value", () => {
    const T = token<string>("s");
    const container = Container.create();
    container.bind(T).toConstantValue("primary").whenNamed("primary");
    expectTypeOf(container.resolve(T, { name: "primary" })).toEqualTypeOf<string>();
  });

  it("toResolvedAsync preserves async factory return type", async () => {
    const A = token<{ a: true }>("A");
    const Out = token<{ out: true }>("out");
    const container = Container.create();
    container.bind(A).toConstantValue({ a: true });
    container.bind(Out).toResolvedAsync(
      async (dep) => {
        expectTypeOf(dep).toEqualTypeOf<{ a: true }>();
        return { out: true };
      },
      [A],
    );
    const resolved = await container.resolveAsync(Out);
    expectTypeOf(resolved).toEqualTypeOf<{ out: true }>();
    expect(resolved).toEqual({ out: true });
  });
});

describe("alias bindings expose transient scope in snapshots", () => {
  it("lookupBindings scope for alias is transient", () => {
    const A = token<{ id: 1 }>("A");
    const B = token<{ id: 1 }>("B");
    const container = Container.create();
    container.bind(A).toConstantValue({ id: 1 });
    container.bind(B).toAlias(A).whenDefault();
    const snapshots = container.lookupBindings(B);
    expect(snapshots.length).toBeGreaterThan(0);
    expectTypeOf(snapshots[0]!.scope).toEqualTypeOf<BindingScope>();
    expect(snapshots[0]!.scope).toBe("transient");
  });
});

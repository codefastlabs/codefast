import { expectTypeOf } from "expect-type";
import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { token } from "#/token";
import type { BindingScope, ResolutionContext } from "#/types";

describe("Container public API inference", () => {
  it("resolveOptional widens to undefined union", () => {
    const StringToken = token<string>("s");
    const container = Container.create();
    expectTypeOf(container.resolveOptional(StringToken)).toEqualTypeOf<string | undefined>();
  });

  it("resolveOptionalAsync returns a promise of the optional union", async () => {
    const StringToken = token<string>("s");
    const container = Container.create();
    const pendingString = container.resolveOptionalAsync(StringToken);
    expectTypeOf(pendingString).toEqualTypeOf<Promise<string | undefined>>();
    await expect(pendingString).resolves.toBeUndefined();
  });

  it("resolveAll narrows to array of token value", () => {
    const NumberToken = token<number>("n");
    const container = Container.create();
    container.bind(NumberToken).toConstantValue(1).whenNamed("a");
    container.bind(NumberToken).toConstantValue(2).whenNamed("b");
    expectTypeOf(container.resolveAll(NumberToken)).toEqualTypeOf<Array<number>>();
    expect(container.resolveAll(NumberToken).length).toBe(2);
  });

  it("createChild resolves parent bindings with the same value type", () => {
    const ParentValueToken = token<{ id: "parent" }>("t");
    const parent = Container.create();
    parent.bind(ParentValueToken).toConstantValue({ id: "parent" });
    const child = parent.createChild();
    expectTypeOf(child.resolve(ParentValueToken)).toEqualTypeOf<{ id: "parent" }>();
  });

  it("toDynamic passes ResolutionContext to the factory", () => {
    const OutputToken = token<string>("out");
    const container = Container.create();
    container.bind(OutputToken).toDynamic((context) => {
      expectTypeOf(context).toMatchTypeOf<ResolutionContext>();
      return "ok";
    });
    expectTypeOf(container.resolve(OutputToken)).toEqualTypeOf<string>();
    expect(container.resolve(OutputToken)).toBe("ok");
  });

  it("resolve with name hint stays typed as token value", () => {
    const StringToken = token<string>("s");
    const container = Container.create();
    container.bind(StringToken).toConstantValue("primary").whenNamed("primary");
    expectTypeOf(container.resolve(StringToken, { name: "primary" })).toEqualTypeOf<string>();
  });

  it("toResolvedAsync preserves async factory return type", async () => {
    const DepToken = token<{ a: true }>("A");
    const OutputToken = token<{ out: true }>("out");
    const container = Container.create();
    container.bind(DepToken).toConstantValue({ a: true });
    container.bind(OutputToken).toResolvedAsync(
      async (dep) => {
        expectTypeOf(dep).toEqualTypeOf<{ a: true }>();
        return { out: true };
      },
      [DepToken],
    );
    const resolved = await container.resolveAsync(OutputToken);
    expectTypeOf(resolved).toEqualTypeOf<{ out: true }>();
    expect(resolved).toEqual({ out: true });
  });
});

describe("alias bindings expose transient scope in snapshots", () => {
  it("lookupBindings scope for alias is transient", () => {
    const SourceToken = token<{ id: 1 }>("A");
    const AliasToken = token<{ id: 1 }>("B");
    const container = Container.create();
    container.bind(SourceToken).toConstantValue({ id: 1 });
    container.bind(AliasToken).toAlias(SourceToken).whenDefault();
    const bindingSnapshots = container.lookupBindings(AliasToken);
    expect(bindingSnapshots.length).toBeGreaterThan(0);
    expectTypeOf(bindingSnapshots[0]!.scope).toEqualTypeOf<BindingScope>();
    expect(bindingSnapshots[0]!.scope).toBe("transient");
  });
});

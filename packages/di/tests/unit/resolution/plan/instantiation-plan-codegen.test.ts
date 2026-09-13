/**
 * A plan starts as a closure and, once it has run often enough, is generated as a function of its
 * own that takes the closure's place. Every case here heats a plan past that threshold and pins
 * that the generated tier behaves exactly as the closure did — escapes, singletons, accessors,
 * the async guard, cycle detection — and that nothing resolved a few times ever generates one.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import type { DiagnosableContainer, ResolutionDiagnostics } from "#/errors/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#/errors/diagnostics";
import { AsyncResolutionError, CircularDependencyError } from "#/errors/errors";
import { PLAN_CODEGEN_THRESHOLD } from "#/resolution/plan/plan-codegen";

function diagnose(container: unknown): ResolutionDiagnostics {
  return (container as DiagnosableContainer)[RESOLUTION_DIAGNOSTICS]();
}

// One resolve discovers lifecycle metadata, the next compiles the closure, and the closure's runs
// then reach the threshold — with a resolve or two to spare.
function heat(resolveOnce: () => unknown): void {
  for (let index = 0; index < PLAN_CODEGEN_THRESHOLD + 4; index += 1) {
    resolveOnce();
  }
}

describe("a hot plan is generated as a function of its own", () => {
  it("generates once past the threshold and constructs the same graph", () => {
    @injectable()
    class Leaf {}

    @injectable([Leaf, Leaf, Leaf, Leaf])
    class Root {
      constructor(
        readonly a: Leaf,
        readonly b: Leaf,
        readonly c: Leaf,
        readonly d: Leaf,
      ) {}
    }

    const container = Container.create();
    container.bind(Leaf).toSelf().transient();
    container.bind(Root).toSelf().transient();

    heat(() => container.resolve(Root));

    expect(diagnose(container).generatedPlanCount).toBe(1);
    expect(diagnose(container).builtSubsystems).toContain("resolver.planCodegen");
    const instance = container.resolve(Root);
    expect(instance.a).toBeInstanceOf(Leaf);
    expect(instance.d).toBeInstanceOf(Leaf);
    expect(instance.a).not.toBe(instance.b);
    expect(container.resolve(Root)).not.toBe(instance);
  });

  it("stays a closure below the threshold", () => {
    @injectable()
    class Service {}

    const container = Container.create();
    container.bind(Service).toSelf().transient();

    for (let index = 0; index < PLAN_CODEGEN_THRESHOLD - 1; index += 1) {
      container.resolve(Service);
    }

    expect(diagnose(container).compiledPlanCount).toBe(1);
    expect(diagnose(container).generatedPlanCount).toBe(0);
    expect(diagnose(container).builtSubsystems).not.toContain("resolver.planCodegen");
  });

  it("calls an escaped factory dependency on every generated run", () => {
    const leafToken = token<{ readonly n: number }>("codegen-factory-leaf");
    let calls = 0;

    @injectable([leafToken])
    class Root {
      constructor(readonly leaf: { readonly n: number }) {}
    }

    const container = Container.create();
    container
      .bind(leafToken)
      .toDynamic(() => {
        calls += 1;
        return { n: calls };
      })
      .transient();
    container.bind(Root).toSelf().transient();

    heat(() => container.resolve(Root));
    expect(diagnose(container).generatedPlanCount).toBe(1);

    const before = calls;
    const first = container.resolve(Root);
    const second = container.resolve(Root);

    expect(calls).toBe(before + 2);
    expect(first.leaf.n).toBe(before + 1);
    expect(second.leaf.n).toBe(before + 2);
  });

  it("serves a singleton dependency from its cache after generation", () => {
    @injectable()
    class Shared {}

    @injectable([Shared])
    class Root {
      constructor(readonly shared: Shared) {}
    }

    const container = Container.create();
    container.bind(Shared).toSelf().singleton();
    container.bind(Root).toSelf().transient();

    heat(() => container.resolve(Root));
    expect(diagnose(container).generatedPlanCount).toBe(1);

    const shared = container.resolve(Shared);
    expect(container.resolve(Root).shared).toBe(shared);
    expect(container.resolve(Root).shared).toBe(shared);
  });

  it("keeps a generated toResolved plan throwing on a factory that returns a promise", () => {
    const valueToken = token<number>("codegen-resolved-async");
    const container = Container.create();
    container.bind(valueToken).toResolved(() => Promise.resolve(1) as unknown as number, []);

    for (let index = 0; index < PLAN_CODEGEN_THRESHOLD + 4; index += 1) {
      expect(() => container.resolve(valueToken)).toThrow(AsyncResolutionError);
    }

    expect(diagnose(container).generatedPlanCount).toBe(1);
    expect(() => container.resolve(valueToken)).toThrow(AsyncResolutionError);
  });

  it("keeps an accessor-injected root resolving its accessor on the generated tier", () => {
    const depToken = token<string>("codegen-accessor-dep");

    @injectable([])
    class Root {
      @inject(depToken) accessor dep!: string;
    }

    const container = Container.create();
    container.bind(depToken).toConstantValue("accessed");
    container.bind(Root).toSelf().transient();

    heat(() => container.resolve(Root));

    expect(diagnose(container).generatedPlanCount).toBe(1);
    expect(container.resolve(Root).dep).toBe("accessed");
  });

  it("still detects a cycle that closes through an escaped dependency", () => {
    const leafToken = token<unknown>("codegen-cycling-leaf");
    let cycle = false;

    @injectable([leafToken])
    class Root {
      constructor(readonly leaf: unknown) {}
    }

    const container = Container.create();
    container
      .bind(leafToken)
      .toDynamic((ctx) => (cycle ? ctx.resolve(Root) : "leaf"))
      .transient();
    container.bind(Root).toSelf().transient();

    heat(() => container.resolve(Root));
    expect(diagnose(container).generatedPlanCount).toBe(1);

    cycle = true;

    expect(() => container.resolve(Root)).toThrow(CircularDependencyError);
  });

  it("generates again once a registry change has recompiled the plan", () => {
    const valueToken = token<number>("codegen-rebound-value");

    @injectable([valueToken])
    class Root {
      constructor(readonly value: number) {}
    }

    const container = Container.create();
    container.bind(valueToken).toConstantValue(1);
    container.bind(Root).toSelf().transient();

    heat(() => container.resolve(Root));
    expect(diagnose(container).generatedPlanCount).toBe(1);

    container.rebind(valueToken).toConstantValue(2);

    expect(container.resolve(Root).value).toBe(2);
    heat(() => container.resolve(Root));
    expect(diagnose(container).generatedPlanCount).toBe(2);
    expect(container.resolve(Root).value).toBe(2);
  });

  it("never generates for a child that resolves a parent-owned class a few times", () => {
    @injectable()
    class Handler {}

    const parent = Container.create();
    parent.bind(Handler).toSelf().transient();
    heat(() => parent.resolve(Handler));

    const child = parent.createChild();
    child.resolve(Handler);
    child.resolve(Handler);

    expect(diagnose(parent).generatedPlanCount).toBe(1);
    expect(diagnose(child).generatedPlanCount).toBe(0);
    expect(diagnose(child).builtSubsystems).not.toContain("resolver.planCodegen");
  });
});

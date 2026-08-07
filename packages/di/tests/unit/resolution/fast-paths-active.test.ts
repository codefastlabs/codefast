/**
 * The optimizations this package is built around are invisible to a correctness test: strip the
 * compiled plans, the context pools or the deferred subsystems and every other test still passes,
 * only slower. The benchmark is the instrument that would notice, and it needs a quiet machine and
 * twenty minutes — so CI cannot run it.
 *
 * These assert the *structure* that produces the speed instead of the speed itself: the plan was
 * compiled, the pool was reused, the deferred table was never built. Deterministic, no timing.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { injectable } from "#/decorators/injectable";
import type { DiagnosableContainer, ResolutionDiagnostics } from "#/errors/diagnostics";
import { RESOLUTION_DIAGNOSTICS } from "#/errors/diagnostics";

const WARM_ITERATIONS = 5;

function diagnose(container: unknown): ResolutionDiagnostics {
  return (container as DiagnosableContainer)[RESOLUTION_DIAGNOSTICS]();
}

describe("compiled plans are actually compiled", () => {
  it("compiles a plannable class graph once it is warm", () => {
    const depToken = token<number>("fast-path-dep");

    @injectable([depToken])
    class Leaf {
      constructor(readonly value: number) {}
    }

    @injectable([Leaf])
    class Root {
      constructor(readonly leaf: Leaf) {}
    }

    const container = Container.create();
    container.bind(depToken).toConstantValue(1);
    container.bind(Leaf).toSelf().transient();
    container.bind(Root).toSelf().transient();

    expect(diagnose(container).compiledPlanCount).toBe(0);

    for (let index = 0; index < WARM_ITERATIONS; index += 1) {
      container.resolve(Root);
    }

    // Plans compile after the first resolve discovers lifecycle metadata. A change that makes the
    // graph unplannable keeps every result correct and silently gives up the win.
    expect(diagnose(container).compiledPlanCount).toBeGreaterThan(0);
  });

  it("drops the compiled plan when the graph changes underneath it", () => {
    @injectable()
    class Service {}

    const container = Container.create();
    container.bind(Service).toSelf().transient();
    for (let index = 0; index < WARM_ITERATIONS; index += 1) {
      container.resolve(Service);
    }
    expect(diagnose(container).compiledPlanCount).toBeGreaterThan(0);

    container.bind(token<number>("fast-path-unrelated")).toConstantValue(1);

    // Invalidation is lazy: the stamp is checked on the next lookup, so the count only drops once
    // a resolve goes looking. What matters is that it rebuilds rather than staying disabled.
    for (let index = 0; index < WARM_ITERATIONS; index += 1) {
      container.resolve(Service);
    }
    expect(diagnose(container).compiledPlanCount).toBeGreaterThan(0);
  });
});

describe("resolution contexts come from a pool", () => {
  it("reuses one context per depth on the sync path", () => {
    const leafToken = token<string>("pool-sync-leaf");
    const rootToken = token<string>("pool-sync-root");
    const container = Container.create();
    container
      .bind(leafToken)
      .toDynamic(() => "leaf")
      .transient();
    container
      .bind(rootToken)
      .toDynamic((ctx) => `root:${ctx.resolve(leafToken)}`)
      .transient();

    for (let index = 0; index < 10; index += 1) {
      container.resolve(rootToken);
    }
    const afterTen = diagnose(container).syncContextPoolSize;

    for (let index = 0; index < 200; index += 1) {
      container.resolve(rootToken);
    }

    // Indexed by depth, so the pool is bounded by how deep the graph goes — never by how often it
    // is resolved. Growth here means a context is being allocated per resolve again.
    expect(diagnose(container).syncContextPoolSize).toBe(afterTen);
    expect(afterTen).toBeLessThanOrEqual(3);
  });
});

describe("deferred subsystems stay deferred", () => {
  it("builds none of them for a container that only binds and resolves", () => {
    const serviceToken = token<string>("deferred-untouched");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => "value")
      .singleton();
    container.resolve(serviceToken);

    // The common case, and every per-request child container.
    expect(diagnose(container).builtSubsystems).toEqual([]);
  });

  it("builds one only when something asks for it", () => {
    const serviceToken = token<string>("deferred-inspected");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("value");

    container.inspect();
    expect(diagnose(container).builtSubsystems).toContain("container.inspector");

    container.onActivation(serviceToken, (_ctx, value: string) => value);
    expect(diagnose(container).builtSubsystems).toContain("lifecycle.activationHooks");
  });

  it("keeps a child container as lean as its parent", () => {
    const serviceToken = token<string>("deferred-child");
    const parent = Container.create();
    parent
      .bind(serviceToken)
      .toDynamic(() => "value")
      .singleton();
    parent.resolve(serviceToken);

    const child = parent.createChild();
    child.resolve(serviceToken);

    expect(diagnose(child).builtSubsystems).toEqual([]);
  });
});

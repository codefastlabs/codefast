import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { injectable } from "#/decorators/injectable";
import { AsyncModuleLoadError, CircularDependencyError, ScopeViolationError } from "#/errors";
import { Module } from "#/module";
import { token } from "#/token";

describe("container.validate() — transitive scope + alias chain (SPEC §6.9)", () => {
  it("throws ScopeViolationError when a singleton transitively depends on a scoped binding", () => {
    @injectable([])
    class ScopedService {}

    const ScopedLeaf = token<ScopedService>("ScopedLeaf");

    @injectable([ScopedLeaf])
    class MidService {
      constructor(_scopedLeaf: ScopedService) {}
    }

    const Mid = token<MidService>("Mid");

    @injectable([Mid])
    class RootService {
      constructor(_midService: MidService) {}
    }

    const Root = token<RootService>("Root");

    const container = Container.create();
    container.bind(ScopedLeaf).to(ScopedService).scoped();
    container.bind(Mid).to(MidService).singleton();
    container.bind(Root).to(RootService).singleton();

    let thrown: unknown;
    try {
      container.validate();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ScopeViolationError);
    const details = (thrown as ScopeViolationError).details;
    expect(details.consumerScope).toBe("singleton");
    expect(details.dependencyScope).toBe("scoped");
    expect(details.path.length).toBeGreaterThanOrEqual(2);
    expect(details.path.some((segment) => segment.includes("ScopedLeaf"))).toBe(true);
  });

  it("follows toAlias to the terminal binding and detects singleton → scoped", () => {
    @injectable([])
    class LeafService {}

    const Leaf = token<LeafService>("Leaf");
    const Alias = token<LeafService>("Alias");

    @injectable([Alias])
    class RootViaAlias {
      constructor(_leaf: LeafService) {}
    }

    const container = Container.create();
    container.bind(Leaf).to(LeafService).scoped();
    container.bind(Alias).toAlias(Leaf);
    container.bind(RootViaAlias).toSelf().singleton();

    expect(() => container.validate()).toThrow(ScopeViolationError);
  });

  it("follows a multi-hop alias chain before checking scope", () => {
    @injectable([])
    class LeafService {}

    const Leaf = token<LeafService>("Leaf");
    const AliasHopB = token<LeafService>("HopB");
    const AliasHopA = token<LeafService>("HopA");

    @injectable([AliasHopA])
    class AliasConsumer {
      constructor(_leaf: LeafService) {}
    }

    const container = Container.create();
    container.bind(Leaf).to(LeafService).scoped();
    container.bind(AliasHopB).toAlias(Leaf);
    container.bind(AliasHopA).toAlias(AliasHopB);
    container.bind(AliasConsumer).toSelf().singleton();

    expect(() => container.validate()).toThrow(ScopeViolationError);
  });

  it("throws CircularDependencyError when an alias chain cycles during validation", () => {
    const CycleAliasA = token<unknown>("AliasCycleA");
    const CycleAliasB = token<unknown>("AliasCycleB");

    const container = Container.create();
    container.bind(CycleAliasA).toAlias(CycleAliasB);
    container.bind(CycleAliasB).toAlias(CycleAliasA);

    @injectable([CycleAliasA])
    class CycleRoot {
      constructor(_dependency: unknown) {}
    }

    container.bind(CycleRoot).toSelf().singleton();

    expect(() => container.validate()).toThrow(CircularDependencyError);
  });
});

describe("AsyncModuleLoadError", () => {
  it("walks toResolved() dependency tokens and detects singleton \u2192 transient", () => {
    @injectable([])
    class TransientService {}

    const TransientLeaf = token<TransientService>("ResolvedTransientLeaf");
    const Root = token<string>("ResolvedRoot");

    const container = Container.create();
    container.bind(TransientLeaf).to(TransientService).transient();
    container
      .bind(Root)
      .toResolved((leaf: TransientService) => `root:${leaf.constructor.name}`, [TransientLeaf])
      .singleton();

    let thrown: unknown;
    try {
      container.validate();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ScopeViolationError);
    const details = (thrown as ScopeViolationError).details;
    expect(details.consumerScope).toBe("singleton");
    expect(details.dependencyScope).toBe("transient");
  });

  it("accepts a toResolved() singleton whose dependencies are singletons", () => {
    @injectable([])
    class SingletonService {}

    const SingletonLeaf = token<SingletonService>("ResolvedSingletonLeaf");
    const Root = token<string>("ResolvedSingletonRoot");

    const container = Container.create();
    container.bind(SingletonLeaf).to(SingletonService).singleton();
    container
      .bind(Root)
      .toResolved((leaf: SingletonService) => `root:${leaf.constructor.name}`, [SingletonLeaf])
      .singleton();

    expect(() => container.validate()).not.toThrow();
  });

  it("treats a toDynamic terminal as opaque, so its declared scope is not checked", () => {
    // Documented behaviour (SPEC \u00a76.9): dynamic factories are not statically analyzable, so a
    // singleton depending on a transient *dynamic* binding is deliberately not reported. Pinned
    // here so the exemption stays a decision rather than drifting silently.
    const DynamicLeaf = token<string>("OpaqueDynamicLeaf");
    const Root = token<string>("OpaqueDynamicRoot");

    const container = Container.create();
    container
      .bind(DynamicLeaf)
      .toDynamic(() => "leaf")
      .transient();
    container
      .bind(Root)
      .toResolved((leaf: string) => `root:${leaf}`, [DynamicLeaf])
      .singleton();

    expect(() => container.validate()).not.toThrow();
  });

  it("throws when sync load receives an async module at runtime", () => {
    const asyncModule = Module.createAsync("async-mod", async () => {});
    const container = Container.create();
    expect(() => container.load(asyncModule as never)).toThrow(AsyncModuleLoadError);
  });
});

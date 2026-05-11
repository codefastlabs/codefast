import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { injectable } from "#/decorators/injectable";
import { Module } from "#/module";
import { AsyncModuleLoadError, CircularDependencyError, ScopeViolationError } from "#/errors";
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
  it("throws when sync load receives an async module at runtime", () => {
    const asyncModule = Module.createAsync("async-mod", async () => {});
    const container = Container.create();
    expect(() => container.load(asyncModule as never)).toThrow(AsyncModuleLoadError);
  });
});

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
      constructor(_leaf: ScopedService) {}
    }

    const Mid = token<MidService>("Mid");

    @injectable([Mid])
    class RootService {
      constructor(_mid: MidService) {}
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
    class LeafSvc {}

    const Leaf = token<LeafSvc>("Leaf");
    const Alias = token<LeafSvc>("Alias");

    @injectable([Alias])
    class RootViaAlias {
      constructor(_a: LeafSvc) {}
    }

    const container = Container.create();
    container.bind(Leaf).to(LeafSvc).scoped();
    container.bind(Alias).toAlias(Leaf);
    container.bind(RootViaAlias).toSelf().singleton();

    expect(() => container.validate()).toThrow(ScopeViolationError);
  });

  it("follows a multi-hop alias chain before checking scope", () => {
    @injectable([])
    class LeafSvc {}

    const Leaf = token<LeafSvc>("Leaf");
    const HopB = token<LeafSvc>("HopB");
    const HopA = token<LeafSvc>("HopA");

    @injectable([HopA])
    class Consumer {
      constructor(_h: LeafSvc) {}
    }

    const container = Container.create();
    container.bind(Leaf).to(LeafSvc).scoped();
    container.bind(HopB).toAlias(Leaf);
    container.bind(HopA).toAlias(HopB);
    container.bind(Consumer).toSelf().singleton();

    expect(() => container.validate()).toThrow(ScopeViolationError);
  });

  it("throws CircularDependencyError when an alias chain cycles during validation", () => {
    const A = token<unknown>("AliasCycleA");
    const B = token<unknown>("AliasCycleB");

    const container = Container.create();
    container.bind(A).toAlias(B);
    container.bind(B).toAlias(A);

    @injectable([A])
    class Root {
      constructor(_x: unknown) {}
    }

    container.bind(Root).toSelf().singleton();

    expect(() => container.validate()).toThrow(CircularDependencyError);
  });
});

describe("AsyncModuleLoadError", () => {
  it("throws when sync load receives an async module at runtime", () => {
    const asyncMod = Module.createAsync("async-mod", async () => {});
    const container = Container.create();
    expect(() => container.load(asyncMod as never)).toThrow(AsyncModuleLoadError);
  });
});

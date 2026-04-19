import { describe, expect, it } from "vitest";
import type { Binding } from "#/binding";
import { createBindingIdentifier } from "#/binding";
import { ScopeManager } from "#/scope";
import { DiError } from "#/errors";

describe("ScopeManager", () => {
  function createMockBinding(
    scope: "singleton" | "scoped" | "transient",
    onDeactivation?: (inst: unknown) => unknown,
  ): Binding<unknown> {
    return {
      id: createBindingIdentifier(),
      scope,
      kind: "constant",
      value: null,
      tags: new Map(),
      onDeactivation,
    } as Binding<unknown>;
  }

  it("getOrCreateAsync shares one in-flight factory for concurrent singleton resolves", async () => {
    const binding = createMockBinding("singleton");
    let factoryCalls = 0;
    const scope = ScopeManager.createRoot();
    const factory = async () => {
      factoryCalls += 1;
      await new Promise<void>((resolve) => {
        queueMicrotask(resolve);
      });
      return { marker: "one" };
    };

    const [first, second] = await Promise.all([
      scope.getOrCreateAsync(binding, factory),
      scope.getOrCreateAsync(binding, factory),
    ]);

    expect(factoryCalls).toBe(1);
    expect(first).toBe(second);
  });

  it("getOrCreateAsync shares one in-flight factory for concurrent scoped resolves", async () => {
    const binding = createMockBinding("scoped");
    let factoryCalls = 0;
    const scope = ScopeManager.createRoot();
    const factory = async () => {
      factoryCalls += 1;
      await new Promise<void>((resolve) => {
        queueMicrotask(resolve);
      });
      return { marker: "scoped-one" };
    };

    const [first, second] = await Promise.all([
      scope.getOrCreateAsync(binding, factory),
      scope.getOrCreateAsync(binding, factory),
    ]);

    expect(factoryCalls).toBe(1);
    expect(first).toBe(second);
  });

  it("dispose runs onDeactivation for scoped cached instances", () => {
    const deactivated: unknown[] = [];
    const instance = { k: "scoped-instance" };
    const binding = createMockBinding("scoped", (inst) => {
      deactivated.push(inst);
    });
    const scope = ScopeManager.createRoot();
    scope.getOrCreate(binding, () => instance);
    scope.dispose();
    expect(deactivated).toEqual([instance]);
  });

  it("throws DiError during sync dispose if onDeactivation returns a promise", () => {
    const binding = createMockBinding("singleton", () => Promise.resolve());
    const scope = ScopeManager.createRoot();
    scope.getOrCreate(binding, () => ({}));

    expect(() => {
      scope.dispose();
    }).toThrow(/onDeactivation returned a Promise; use disposeAsync/);
  });

  it("disposeAsync runs async onDeactivation cleanly", async () => {
    const binding = createMockBinding("scoped", async (inst: unknown) => {
      await Promise.resolve();
      (inst as { deactivated: boolean }).deactivated = true;
    });
    const scope = ScopeManager.createRoot();
    const inst = { deactivated: false };
    scope.getOrCreate(binding, () => inst);

    await scope.disposeAsync();
    expect(inst.deactivated).toBe(true);
  });

  it("releaseBinding removes binding and triggers onDeactivation", () => {
    let triggered = false;
    const binding = createMockBinding("singleton", () => {
      triggered = true;
    });
    const scope = ScopeManager.createRoot();
    scope.getOrCreate(binding, () => ({}));

    expect(scope.isBindingCached(binding)).toBe(true);
    scope.releaseBinding(binding);
    expect(scope.isBindingCached(binding)).toBe(false);
    expect(triggered).toBe(true);
  });

  it("releaseBinding throws DiError during sync release if onDeactivation returns a promise", () => {
    const binding = createMockBinding("singleton", () => Promise.resolve());
    const scope = ScopeManager.createRoot();
    scope.getOrCreate(binding, () => ({}));

    expect(() => {
      scope.releaseBinding(binding);
    }).toThrowError(DiError);
  });

  it("releaseBindingAsync handles async onDeactivation cleanly", async () => {
    const binding = createMockBinding("singleton", async (inst: unknown) => {
      await Promise.resolve();
      (inst as { released: boolean }).released = true;
    });
    const scope = ScopeManager.createRoot();
    const inst = { released: false };
    scope.getOrCreate(binding, () => inst);

    await scope.releaseBindingAsync(binding);
    expect(inst.released).toBe(true);
    expect(scope.isBindingCached(binding)).toBe(false);
  });

  it("isBindingCached is always false for transient bindings", () => {
    const binding = createMockBinding("transient");
    const scope = ScopeManager.createRoot();
    scope.getOrCreate(binding, () => ({}));
    expect(scope.isBindingCached(binding)).toBe(false);
  });

  it("child scope caches scoped instances but delegates singletons", () => {
    const bSingleton = createMockBinding("singleton");
    const bScoped = createMockBinding("scoped");

    const rootScope = ScopeManager.createRoot();
    const childScope = rootScope.createChildScope();

    childScope.getOrCreate(bSingleton, () => ({ type: "singleton" }));
    childScope.getOrCreate(bScoped, () => ({ type: "scoped" }));

    expect(rootScope.isBindingCached(bSingleton)).toBe(true);
    expect(childScope.isBindingCached(bSingleton)).toBe(true); // delegates correctly

    expect(rootScope.isBindingCached(bScoped)).toBe(false);
    expect(childScope.isBindingCached(bScoped)).toBe(true);
  });

  it("transient factories are executed every time without caching", async () => {
    let count = 0;
    const binding = createMockBinding("transient");
    const scope = ScopeManager.createRoot();
    const factory = () => ++count;

    expect(scope.getOrCreate(binding, factory)).toBe(1);
    expect(scope.getOrCreate(binding, factory)).toBe(2);

    const asyncFactory = async () => ++count;
    expect(await scope.getOrCreateAsync(binding, asyncFactory)).toBe(3);

    expect(scope.isBindingCached(binding)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { AsyncModule, Module } from "#/module";
import { token } from "#/token";

describe("Module", () => {
  it("is reusable across independent containers (pure description, no container ownership)", () => {
    const portToken = token<number>("module-reuse-port");
    const sharedModule = Module.create("shared", (moduleApi) => {
      moduleApi.bind(portToken).toConstantValue(3000);
    });

    const firstContainer = Container.fromModules(sharedModule);
    const secondContainer = Container.fromModules(sharedModule);

    expect(firstContainer.resolve(portToken)).toBe(3000);
    expect(secondContainer.resolve(portToken)).toBe(3000);

    firstContainer.rebind(portToken).toConstantValue(4000);
    expect(firstContainer.resolve(portToken)).toBe(4000);
    expect(secondContainer.resolve(portToken)).toBe(3000);
  });

  it("deduplicates repeated load(M) on the same container (spec §7.3)", () => {
    const portToken = token<number>("module-dedup-port");
    let setupRunCount = 0;
    const dedupedModule = Module.create("dedup", (moduleApi) => {
      setupRunCount += 1;
      moduleApi.bind(portToken).toConstantValue(setupRunCount);
    });

    const container = Container.create();
    container.load(dedupedModule);
    container.load(dedupedModule);
    container.load(dedupedModule);

    expect(setupRunCount).toBe(1);
    expect(container.resolve(portToken)).toBe(1);
  });

  it("deduplicates diamond import graphs (shared leaf imported by multiple parents runs once)", () => {
    const sharedValueToken = token<number>("module-diamond-shared");
    let leafSetupCount = 0;

    const leafModule = Module.create("leaf", (moduleApi) => {
      leafSetupCount += 1;
      moduleApi.bind(sharedValueToken).toConstantValue(42);
    });

    const leftBranchModule = Module.create("left", (moduleApi) => {
      moduleApi.import(leafModule);
    });

    const rightBranchModule = Module.create("right", (moduleApi) => {
      moduleApi.import(leafModule);
    });

    const rootModule = Module.create("root", (moduleApi) => {
      moduleApi.import(leftBranchModule, rightBranchModule);
    });

    const container = Container.fromModules(rootModule);
    expect(leafSetupCount).toBe(1);
    expect(container.resolve(sharedValueToken)).toBe(42);
  });

  it("deduplicates async module imports as well", async () => {
    const sharedValueToken = token<number>("module-async-dedup");
    let leafSetupCount = 0;

    const asyncLeafModule = Module.createAsync("async-leaf", async (moduleApi) => {
      await Promise.resolve();
      leafSetupCount += 1;
      moduleApi.bind(sharedValueToken).toConstantValue(leafSetupCount);
    });

    const asyncRootModule = Module.createAsync("async-root", async (moduleApi) => {
      moduleApi.import(asyncLeafModule, asyncLeafModule);
    });

    const container = await Container.fromModulesAsync(asyncLeafModule, asyncRootModule);
    expect(leafSetupCount).toBe(1);
    expect(container.resolve(sharedValueToken)).toBe(1);
  });

  it("unload removes only the bindings this container recorded for that module", () => {
    const alphaToken = token<string>("module-unload-alpha");
    const betaToken = token<string>("module-unload-beta");

    const unloadableModule = Module.create("unloadable", (moduleApi) => {
      moduleApi.bind(alphaToken).toConstantValue("alpha");
      moduleApi.bind(betaToken).toConstantValue("beta");
    });

    const container = Container.fromModules(unloadableModule);
    expect(container.resolve(alphaToken)).toBe("alpha");
    container.unload(unloadableModule);

    expect(container.has(alphaToken)).toBe(false);
    expect(container.has(betaToken)).toBe(false);
  });

  it("unload errors when the module was never loaded on this container", () => {
    const neverLoadedModule = Module.create("never-loaded", () => undefined);
    const emptyContainer = Container.create();
    expect(() => {
      emptyContainer.unload(neverLoadedModule);
    }).toThrow(/not loaded/i);
  });

  it("AsyncModule is exposed and `createAsync` returns it", async () => {
    const valueToken = token<number>("module-async-type");
    const exposedAsyncModule = Module.createAsync("async-exposed", async (moduleApi) => {
      await Promise.resolve();
      moduleApi.bind(valueToken).toConstantValue(7);
    });
    expect(exposedAsyncModule).toBeInstanceOf(AsyncModule);

    const container = await Container.fromModulesAsync(exposedAsyncModule);
    expect(container.resolve(valueToken)).toBe(7);
  });

  it("successfully imports a sync module from an async module", async () => {
    const container = Container.create();
    const syncConstantToken = token<string>("val");
    const SyncM = Module.create("SyncM", (api) => {
      api.bind(syncConstantToken).toConstantValue("sync-val");
    });
    const AsyncM = Module.createAsync("AsyncM", async (api) => {
      api.import(SyncM);
    });

    await container.loadAsync(AsyncM);
    expect(container.resolve(syncConstantToken)).toBe("sync-val");
  });

  it("instantiates classes without parameters", () => {
    class Service {}
    const tokenService = token<Service>("service");
    const mod = Module.create("mod", (api) => {
      api.bind(tokenService).to(Service);
    });
    const container = Container.fromModules(mod);
    expect(container.resolve(tokenService)).toBeInstanceOf(Service);
  });

  it("whenNamed before to* appends for resolveAll (multi-binding inside a module)", () => {
    const multiToken = token<string>("module-bind-multi");
    const multiModule = Module.create("multi", (api) => {
      api.bind(multiToken).whenNamed("a").toConstantValue("a");
      api.bind(multiToken).whenNamed("b").toConstantValue("b");
      api.bind(multiToken).whenNamed("c").toConstantValue("c");
    });
    const container = Container.fromModules(multiModule);
    expect(container.resolveAll(multiToken)).toEqual(["a", "b", "c"]);
  });

  it("plain bind after named binds keeps named binding and replaces default slot", () => {
    const lastWinsToken = token<string>("module-bind-then-multi");
    const mod = Module.create("mix", (api) => {
      api.bind(lastWinsToken).whenNamed("first").toConstantValue("first");
      api.bind(lastWinsToken).toConstantValue("solo");
    });
    const container = Container.fromModules(mod);
    expect(container.resolveAll(lastWinsToken)).toEqual(["first", "solo"]);
    expect(container.resolve(lastWinsToken)).toBe("solo");
  });

  it("whenNamed after to* behaves the same as whenNamed before to* in module bindings", () => {
    const tokenWithPostHint = token<string>("module-when-after-to");
    const mod = Module.create("module-when-after-to", (api) => {
      api.bind(tokenWithPostHint).toConstantValue("first").whenNamed("alpha");
      api.bind(tokenWithPostHint).whenNamed("alpha").toConstantValue("second");
    });

    const container = Container.fromModules(mod);
    expect(container.resolve(tokenWithPostHint, { name: "alpha" })).toBe("second");
    expect(container.resolveAll(tokenWithPostHint, { name: "alpha" })).toEqual(["second"]);
  });

  it("unload removes every binding id from a multi-binding module", () => {
    const unloadMultiToken = token<number>("module-unload-multi");
    const mod = Module.create("unload-multi", (api) => {
      api.bind(unloadMultiToken).whenNamed("x").toConstantValue(1);
      api.bind(unloadMultiToken).whenNamed("y").toConstantValue(2);
    });
    const container = Container.fromModules(mod);
    expect(container.resolveAll(unloadMultiToken)).toEqual([1, 2]);
    container.unload(mod);
    expect(container.resolveAll(unloadMultiToken)).toEqual([]);
  });

  it("slot-aware last-wins follows module load order for the same default slot", () => {
    const shared = token<number>("module-order-default-slot");
    const modA = Module.create("orderA-default", (api) => {
      api.bind(shared).toConstantValue(1);
    });
    const modB = Module.create("orderB-default", (api) => {
      api.bind(shared).toConstantValue(2);
    });
    expect(Container.fromModules(modA, modB).resolve(shared)).toBe(2);
    expect(Container.fromModules(modB, modA).resolve(shared)).toBe(1);
  });
});

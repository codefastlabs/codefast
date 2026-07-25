/**
 * Behavioural tests for the container's mutation and module surface: unbinding, module
 * load/unload (including reference counting), auto-registration, and the disposed guard.
 * These paths run deactivation side effects, so a silent regression here leaks instances
 * rather than throwing.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { createAutoRegisterRegistry } from "#/decorators/injectable";
import { AsyncModuleLoadError, DisposedContainerError } from "#/errors";
import { Module } from "#/module";
import { token } from "#/token";

describe("unbinding", () => {
  it("removes the binding and runs deactivation on the cached singleton", () => {
    const serviceToken = token<{ id: string }>("unbind-service");
    const deactivated: Array<string> = [];

    const container = Container.create();
    container.onDeactivation(serviceToken, (instance) => {
      deactivated.push(instance.id);
    });
    container
      .bind(serviceToken)
      .toDynamic(() => ({ id: "first" }))
      .singleton();
    container.resolve(serviceToken);

    container.unbind(serviceToken);

    expect(deactivated).toEqual(["first"]);
    expect(container.has(serviceToken)).toBe(false);
  });

  it("unbinds by binding id, leaving the other binding for the same token", () => {
    const serviceToken = token<string>("unbind-by-id");
    const container = Container.create();
    const first = container.bind(serviceToken).toConstantValue("a").whenNamed("a");
    container.bind(serviceToken).toConstantValue("b").whenNamed("b");

    container.unbind(first.id());

    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
    expect(container.resolve(serviceToken, { name: "b" })).toBe("b");
  });

  it("awaits an async deactivation handler when unbinding asynchronously", async () => {
    const serviceToken = token<{ id: string }>("unbind-async");
    const deactivated: Array<string> = [];

    const container = Container.create();
    container.onDeactivation(serviceToken, async (instance) => {
      await Promise.resolve();
      deactivated.push(instance.id);
    });
    container
      .bind(serviceToken)
      .toDynamic(() => ({ id: "only" }))
      .singleton();
    container.resolve(serviceToken);

    await container.unbindAsync(serviceToken);

    expect(deactivated).toEqual(["only"]);
    expect(container.has(serviceToken)).toBe(false);
  });

  it("clears every binding and deactivates every cached singleton", () => {
    const firstToken = token<{ id: string }>("unbind-all-1");
    const secondToken = token<{ id: string }>("unbind-all-2");
    const deactivated: Array<string> = [];

    const container = Container.create();
    for (const [serviceToken, id] of [
      [firstToken, "one"],
      [secondToken, "two"],
    ] as const) {
      container.onDeactivation(serviceToken, (instance) => {
        deactivated.push(instance.id);
      });
      container
        .bind(serviceToken)
        .toDynamic(() => ({ id }))
        .singleton();
      container.resolve(serviceToken);
    }

    container.unbindAll();

    expect(deactivated.toSorted()).toEqual(["one", "two"]);
    expect(container.has(firstToken)).toBe(false);
    expect(container.has(secondToken)).toBe(false);
  });

  it("awaits async deactivation for every binding when clearing asynchronously", async () => {
    const serviceToken = token<{ id: string }>("unbind-all-async");
    const deactivated: Array<string> = [];

    const container = Container.create();
    container.onDeactivation(serviceToken, async (instance) => {
      await Promise.resolve();
      deactivated.push(instance.id);
    });
    container
      .bind(serviceToken)
      .toDynamic(() => ({ id: "only" }))
      .singleton();
    container.resolve(serviceToken);

    await container.unbindAllAsync();

    expect(deactivated).toEqual(["only"]);
  });
});

describe("sync modules", () => {
  const valueToken = token<string>("module-value");

  const valueModule = Module.create("value-module", (builder) => {
    builder.bind(valueToken).toConstantValue("from-module");
  });

  it("load registers the module's bindings and unload removes them", () => {
    const container = Container.create();

    container.load(valueModule);
    expect(container.resolve(valueToken)).toBe("from-module");

    container.unload(valueModule);
    expect(container.has(valueToken)).toBe(false);
  });

  it("reference-counts repeated loads so one unload does not drop the bindings", () => {
    const container = Container.create();

    container.load(valueModule);
    container.load(valueModule);
    container.unload(valueModule);

    expect(container.resolve(valueToken)).toBe("from-module");

    container.unload(valueModule);
    expect(container.has(valueToken)).toBe(false);
  });

  it("runs deactivation for a module singleton on unload", () => {
    const serviceToken = token<{ id: string }>("module-singleton");
    const deactivated: Array<string> = [];
    const singletonModule = Module.create("singleton-module", (builder) => {
      builder
        .bind(serviceToken)
        .toDynamic(() => ({ id: "module-instance" }))
        .singleton();
    });

    const container = Container.create();
    container.onDeactivation(serviceToken, (instance) => {
      deactivated.push(instance.id);
    });
    container.load(singletonModule);
    container.resolve(serviceToken);

    container.unload(singletonModule);

    expect(deactivated).toEqual(["module-instance"]);
  });

  it("Container.fromModules builds a container with the modules already loaded", () => {
    const container = Container.fromModules(valueModule);
    expect(container.resolve(valueToken)).toBe("from-module");
  });
});

describe("async modules", () => {
  const asyncToken = token<string>("async-module-value");

  const asyncModule = Module.createAsync("async-module", async (builder) => {
    await Promise.resolve();
    builder.bind(asyncToken).toConstantValue("from-async-module");
  });

  it("loadAsync registers bindings and unloadAsync removes them", async () => {
    const container = Container.create();

    await container.loadAsync(asyncModule);
    expect(container.resolve(asyncToken)).toBe("from-async-module");

    await container.unloadAsync(asyncModule);
    expect(container.has(asyncToken)).toBe(false);
  });

  it("Container.fromModulesAsync builds a container with the modules already loaded", async () => {
    const container = await Container.fromModulesAsync(asyncModule);
    expect(container.resolve(asyncToken)).toBe("from-async-module");
  });

  it("rejects an async module passed to the synchronous load", () => {
    const container = Container.create();
    // @ts-expect-error — load() only accepts sync modules; the runtime guard is what is under test.
    expect(() => container.load(asyncModule)).toThrow(AsyncModuleLoadError);
  });
});

describe("auto-registration", () => {
  it("binds every registered class to itself and returns how many were bound", () => {
    class FirstService {}
    class SecondService {}

    const registry = createAutoRegisterRegistry();
    registry.register(FirstService, "singleton");
    registry.register(SecondService, "transient");

    const container = Container.create();
    const count = container.loadAutoRegistered(registry);

    expect(count).toBe(2);
    expect(container.resolve(FirstService)).toBeInstanceOf(FirstService);
    // Singleton scope is honoured; transient hands back a fresh instance each time.
    expect(container.resolve(FirstService)).toBe(container.resolve(FirstService));
    expect(container.resolve(SecondService)).not.toBe(container.resolve(SecondService));
  });
});

describe("initializeAsync", () => {
  it("eagerly instantiates singletons, including async ones", async () => {
    const built: Array<string> = [];
    const syncToken = token<string>("eager-sync");
    const asyncToken = token<string>("eager-async");
    const transientToken = token<string>("eager-transient");

    const container = Container.create();
    container
      .bind(syncToken)
      .toDynamic(() => {
        built.push("sync");
        return "sync";
      })
      .singleton();
    container
      .bind(asyncToken)
      .toDynamicAsync(async () => {
        await Promise.resolve();
        built.push("async");
        return "async";
      })
      .singleton();
    container
      .bind(transientToken)
      .toDynamic(() => {
        built.push("transient");
        return "transient";
      })
      .transient();

    await container.initializeAsync();

    // Both singletons are warmed exactly once; the transient is left alone.
    expect(built.toSorted()).toEqual(["async", "sync"]);

    await container.resolveAsync(asyncToken);
    container.resolve(syncToken);
    expect(built.toSorted()).toEqual(["async", "sync"]);
  });

  it("skips constants that have no activation handler", async () => {
    const constantToken = token<string>("eager-constant");
    const container = Container.create();
    container.bind(constantToken).toConstantValue("value");

    await expect(container.initializeAsync()).resolves.toBeUndefined();
    expect(container.resolve(constantToken)).toBe("value");
  });
});

describe("disposed container", () => {
  it("rejects further use after dispose", async () => {
    const serviceToken = token<string>("disposed-guard");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("value");

    await container.dispose();

    expect(container.isDisposed).toBe(true);
    expect(() => container.resolve(serviceToken)).toThrow(DisposedContainerError);
    expect(() => container.bind(token<string>("late"))).toThrow(DisposedContainerError);
    expect(() => container.unbindAll()).toThrow(DisposedContainerError);
    expect(() => container.has(serviceToken)).toThrow(DisposedContainerError);
  });

  it("is idempotent", async () => {
    const container = Container.create();
    await container.dispose();
    await expect(container.dispose()).resolves.toBeUndefined();
  });
});

/**
 * The auto-register registry `@injectable` collects into, loaded and unloaded as a module.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { createAutoRegisterRegistry, injectable } from "#decorators/injectable";
import { preDestroy } from "#decorators/lifecycle";

describe("auto-register registry", () => {
  it("binds every registered class to itself in its scope when loaded", () => {
    class FirstService {}
    class SecondService {}
    const registry = createAutoRegisterRegistry("ar:Services");
    registry.register(FirstService, "singleton");
    registry.register(SecondService, "transient");

    const container = Container.fromModules(registry);

    expect(registry.name).toBe("ar:Services");
    expect(container.resolve(FirstService)).toBe(container.resolve(FirstService));
    expect(container.resolve(SecondService)).not.toBe(container.resolve(SecondService));
  });

  it("collects the classes @injectable registers into it, with transient as the default scope", () => {
    const registry = createAutoRegisterRegistry("ar:Decorated");

    @injectable([], { autoRegister: registry })
    class Service {}

    expect(registry.entries()).toStrictEqual([{ target: Service, scope: "transient" }]);
  });

  it("binds a class decorated after the registry was created", () => {
    const registry = createAutoRegisterRegistry("ar:Late");
    const container = Container.create();

    @injectable([], { autoRegister: registry, scope: "singleton" })
    class Late {}
    container.load(registry);

    expect(container.resolve(Late)).toBeInstanceOf(Late);
  });

  it("is deduplicated and ref-counted like any module, and unload deactivates what it bound", () => {
    const closed: Array<string> = [];
    const registry = createAutoRegisterRegistry("ar:Counted");

    @injectable([], { autoRegister: registry, scope: "singleton" })
    class Pool {
      @preDestroy()
      close(): void {
        closed.push("pool");
      }
    }
    const container = Container.create();
    container.load(registry);
    container.load(registry);
    container.resolve(Pool);

    container.unload(registry);
    expect(container.has(Pool)).toBe(true);
    expect(closed).toStrictEqual([]);

    container.unload(registry);
    expect(container.has(Pool)).toBe(false);
    expect(closed).toStrictEqual(["pool"]);
  });

  it("keeps a second registry's classes beside the first", () => {
    class First {}
    class Second {}
    const firstRegistry = createAutoRegisterRegistry("ar:First");
    const secondRegistry = createAutoRegisterRegistry("ar:Second");
    firstRegistry.register(First, "singleton");
    secondRegistry.register(Second, "singleton");

    const container = Container.fromModules(firstRegistry, secondRegistry);
    container.unload(secondRegistry);

    expect(container.has(First)).toBe(true);
    expect(container.has(Second)).toBe(false);
  });
});

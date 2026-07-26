/**
 * A container builds its rarely-used collaborators on first use rather than in its constructor —
 * the inspector, the module tables, the scope's in-flight and scoped caches, the registry's named
 * and tagged indexes, and the class introspector's metadata caches. Deferral is an allocation
 * decision only, so every one of them must behave identically whether or not something touched it
 * first. These tests exercise each deferred collaborator as the *first* thing a fresh container
 * does, which is the ordering a constructor-time allocation would have hidden.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { MissingScopeContextError } from "#/errors";
import { Module } from "#/module";
import { token } from "#/token";

describe("inspector built on first use", () => {
  it("answers inspect() on a container that has done nothing else", () => {
    const container = Container.create();

    expect(container.inspect()).toEqual({
      ownBindings: [],
      cachedSingletonCount: 0,
      hasParent: false,
      isDisposed: false,
    });
  });

  it("answers has() and lookupBindings() before any resolve", () => {
    const serviceToken = token<string>("deferred-inspector-has");
    const container = Container.create();

    expect(container.has(serviceToken)).toBe(false);
    expect(container.hasOwn(serviceToken)).toBe(false);
    expect(container.lookupBindings(serviceToken)).toHaveLength(0);

    container.bind(serviceToken).toConstantValue("value");

    expect(container.has(serviceToken)).toBe(true);
    expect(container.lookupBindings(serviceToken)).toHaveLength(1);
  });

  it("reports a parent through a child's own inspector", () => {
    const child = Container.create().createChild();

    expect(child.inspect().hasParent).toBe(true);
  });
});

describe("scope caches built on first use", () => {
  it("caches an async singleton once when nothing touched the in-flight table first", async () => {
    const serviceToken = token<{ id: number }>("deferred-inflight");
    const container = Container.create();
    let constructions = 0;
    container
      .bind(serviceToken)
      .toDynamicAsync(async () => {
        constructions += 1;
        await Promise.resolve();
        return { id: constructions };
      })
      .singleton();

    // Concurrent resolves must share one in-flight promise, not race two constructions.
    const [first, second] = await Promise.all([
      container.resolveAsync(serviceToken),
      container.resolveAsync(serviceToken),
    ]);

    expect(constructions).toBe(1);
    expect(first).toBe(second);
  });

  it("keeps a scoped instance per child container", () => {
    const serviceToken = token<{ tag: string }>("deferred-scoped");
    const parent = Container.create();
    parent
      .bind(serviceToken)
      .toDynamic(() => ({ tag: "scoped" }))
      .scoped();

    const firstChild = parent.createChild();
    const secondChild = parent.createChild();

    expect(firstChild.resolve(serviceToken)).toBe(firstChild.resolve(serviceToken));
    expect(firstChild.resolve(serviceToken)).not.toBe(secondChild.resolve(serviceToken));
  });

  it("still rejects a scoped resolve on a root container", () => {
    const serviceToken = token<string>("deferred-scoped-root");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => "value")
      .scoped();

    expect(() => container.resolve(serviceToken)).toThrow(MissingScopeContextError);
  });
});

describe("registry slot indexes built on first use", () => {
  it("resolves a named binding registered as the container's only binding", () => {
    const serviceToken = token<string>("deferred-named");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("primary").whenNamed("primary");

    expect(container.resolve(serviceToken, { name: "primary" })).toBe("primary");
  });

  it("resolves a tagged binding registered as the container's only binding", () => {
    const serviceToken = token<string>("deferred-tagged");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("prod").whenTagged("env", "prod");

    expect(container.resolve(serviceToken, { tags: [["env", "prod"]] })).toBe("prod");
  });

  it("drops the named index again when its last binding goes", () => {
    const serviceToken = token<string>("deferred-named-unbind");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("primary").whenNamed("primary");
    container.unbind(serviceToken);
    container.bind(serviceToken).toConstantValue("replacement").whenNamed("primary");

    expect(container.resolve(serviceToken, { name: "primary" })).toBe("replacement");
  });
});

describe("lifecycle hook tables built on first use", () => {
  it("runs an activation hook registered before any resolve", () => {
    const serviceToken = token<string>("deferred-activation");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("raw");
    container.onActivation(serviceToken, (_context, instance) => `${instance}-activated`);

    expect(container.resolve(serviceToken)).toBe("raw-activated");
  });

  it("runs a deactivation hook on unbind", async () => {
    const serviceToken = token<string>("deferred-deactivation");
    const container = Container.create();
    const deactivated: Array<string> = [];
    // Dynamic rather than constant: only a cached singleton instance has anything to deactivate.
    container
      .bind(serviceToken)
      .toDynamic(() => "value")
      .singleton();
    container.onDeactivation(serviceToken, (instance) => {
      deactivated.push(instance);
    });
    container.resolve(serviceToken);

    await container.unbindAsync(serviceToken);

    expect(deactivated).toEqual(["value"]);
  });

  it("leaves a container with no hooks resolving unchanged", () => {
    const serviceToken = token<string>("deferred-no-hooks");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("value");

    expect(container.resolve(serviceToken)).toBe("value");
  });
});

describe("module tables built on first use", () => {
  it("loads and unloads a module on an otherwise untouched container", () => {
    const serviceToken = token<string>("deferred-module");
    const module = Module.create("deferred-module", (builder) => {
      builder.bind(serviceToken).toConstantValue("from-module");
    });
    const container = Container.create();

    container.load(module);
    expect(container.resolve(serviceToken)).toBe("from-module");

    container.unload(module);
    expect(container.has(serviceToken)).toBe(false);
  });

  it("ref-counts a module loaded twice", () => {
    const serviceToken = token<string>("deferred-module-refcount");
    const module = Module.create("deferred-module-refcount", (builder) => {
      builder.bind(serviceToken).toConstantValue("from-module");
    });
    const container = Container.create();

    // Two separate calls: one call dedups its own argument list, so it would count as one load.
    container.load(module);
    container.load(module);
    container.unload(module);

    expect(container.has(serviceToken)).toBe(true);

    container.unload(module);

    expect(container.has(serviceToken)).toBe(false);
  });

  it("unloading a module that was never loaded is a no-op", () => {
    const module = Module.create("deferred-module-never-loaded", () => {});
    const container = Container.create();

    expect(() => {
      container.unload(module);
    }).not.toThrow();
  });
});

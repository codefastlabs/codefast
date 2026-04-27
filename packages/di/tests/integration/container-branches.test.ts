import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "#/container";
import { AsyncModuleLoadError, InternalError } from "#/errors";
import * as environment from "#/environment";
import { Module } from "#/module";
import { token } from "#/token";
describe("DefaultContainer branch coverage (observable behavior)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("throws InternalError when sync Symbol.dispose is invoked on the container", () => {
    const container = Container.create();
    expect(() => container[Symbol.dispose]()).toThrow(InternalError);
    expect(() => container[Symbol.dispose]()).toThrow(/await using/);
  });
  it("throws AsyncModuleLoadError when load() is given an AsyncModule", async () => {
    const asyncModule = Module.createAsync("branch-async-only", async () => {});
    const container = Container.create();
    expect(() => container.load(asyncModule as unknown as Module)).toThrow(AsyncModuleLoadError);
  });
  it("throws InternalError when a sync module setup imports an AsyncModule", () => {
    const asyncLeaf = Module.createAsync("branch-async-leaf", async () => {});
    const syncParent = Module.create("branch-sync-parent", (api) => {
      api.import(asyncLeaf as unknown as Module);
    });
    const container = Container.create();
    expect(() => container.load(syncParent)).toThrow(/cannot synchronously import async module/);
  });
  it("createChild resolves tokens registered only on the parent container", () => {
    const t = token<number>("branch-child-parent-fallback");
    const parent = Container.create();
    parent.bind(t).toConstantValue(21);
    const child = parent.createChild();
    expect(child.resolve(t)).toBe(21);
  });
  it("loadAsync on an AsyncModule with only sync sub-imports completes without pending async imports", async () => {
    const leafTok = token<number>("branch-async-leaf-tok");
    const leaf = Module.create("branch-async-leaf-sync", (api) => {
      api.bind(leafTok).toConstantValue(1);
    });
    const root = Module.createAsync("branch-async-root-sync", async (api) => {
      api.import(leaf);
    });
    const container = Container.create();
    await container.loadAsync(root);
    expect(container.resolve(leafTok)).toBe(1);
  });
  it("does not run validate on resolve when NODE_ENV is production", () => {
    vi.spyOn(environment, "isDevelopmentOrTestEnvironment").mockReturnValue(false);
    const t = token<number>("branch-prod-resolve");
    const container = Container.create();
    container.bind(t).toConstantValue(3);
    const validateSpy = vi.spyOn(container, "validate");
    expect(container.resolve(t)).toBe(3);
    expect(validateSpy).not.toHaveBeenCalled();
  });
  it("unbinds a single registration when passed a binding id string", async () => {
    const t = token<number>("branch-unbind-by-id");
    const container = Container.create();
    const builder = container.bind(t).toConstantValue(7);
    await Promise.resolve();
    const bindingId = builder.id();
    expect(container.has(t)).toBe(true);
    container.unbind(bindingId);
    expect(container.has(t)).toBe(false);
  });
  it("unbindAsync(bindingId) removes binding after awaiting async onDeactivation", async () => {
    const t = token<number>("branch-unbind-async-id");
    const log: string[] = [];
    const container = Container.create();
    const builder = container
      .bind(t)
      .toDynamic(() => 1)
      .singleton()
      .onDeactivation(async () => {
        log.push("off");
        await Promise.resolve();
      });
    await Promise.resolve();
    container.resolve(t);
    const bindingId = builder.id();
    await container.unbindAsync(bindingId);
    expect(container.has(t)).toBe(false);
    expect(log).toEqual(["off"]);
  });
  it("has(token) returns false for an unregistered token", () => {
    const container = Container.create();
    expect(container.has(token("branch-has-missing"))).toBe(false);
  });
  it("has(token, hint) returns false when no binding matches the hint", () => {
    const t = token<string>("branch-has-hint");
    const container = Container.create();
    container.bind(t).whenNamed("only").toConstantValue("x");
    expect(container.has(t, { name: "missing" })).toBe(false);
    expect(container.has(t, { tag: ["role", "worker"] })).toBe(false);
    expect(container.has(t, { name: "only" })).toBe(true);
  });
  it("rebind succeeds on a token that was never bound on this container", () => {
    const t = token<number>("branch-rebind-fresh");
    const container = Container.create();
    container.rebind(t).toConstantValue(99);
    expect(container.resolve(t)).toBe(99);
  });
  it("initializeAsync eagerly touches singletons without name/tag hints", async () => {
    const t = token<number>("branch-init-async-default");
    const container = Container.create();
    let created = 0;
    container
      .bind(t)
      .toDynamicAsync(async () => {
        created += 1;
        return 42;
      })
      .singleton();
    await container.initializeAsync();
    expect(created).toBe(1);
    expect(await container.resolveAsync(t)).toBe(42);
  });
  it("initializeAsync passes name hint for named singletons", async () => {
    const t = token<number>("branch-init-named");
    const container = Container.create();
    container.bind(t).whenNamed("n").toConstantValue(5);
    await container.initializeAsync();
    expect(container.resolve(t, { name: "n" })).toBe(5);
  });
  it("initializeAsync passes tag hint for tagged singletons without a name", async () => {
    const t = token<number>("branch-init-tagged");
    const container = Container.create();
    container.bind(t).whenTagged("env", "prod").toConstantValue(9);
    await container.initializeAsync();
    expect(container.resolve(t, { tag: ["env", "prod"] })).toBe(9);
  });
  it("supports Symbol tag values for binding identity (JSON.stringify throws on symbol primitives)", async () => {
    const t = token<string>("branch-tag-symbol");
    const sym = Symbol("slot");
    const container = Container.create();
    container.bind(t).whenTagged("k", sym).toConstantValue("sym-val");
    await Promise.resolve();
    expect(container.resolve(t, { tag: ["k", sym] })).toBe("sym-val");
  });
  it("reuses the same non-json slot id when the same circular object is rebound in the same tag slot", async () => {
    const t = token<string>("branch-same-circular-ref");
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const container = Container.create();
    container.bind(t).whenTagged("env", circular).toConstantValue("first");
    await Promise.resolve();
    container.bind(t).whenTagged("env", circular).toConstantValue("second");
    expect(container.lookupBindings(t)?.length).toBe(1);
    expect(container.resolve(t, { tag: ["env", circular] })).toBe("second");
  });
  it("refining whenTagged on a committed binding updates the slot key without duplicating registry rows", async () => {
    const t = token<number>("branch-update-slot-tag");
    const container = Container.create();
    const builder = container.bind(t).whenTagged("role", "alpha").toConstantValue(1);
    await Promise.resolve();
    builder.whenTagged("role", "beta");
    await Promise.resolve();
    expect(container.lookupBindings(t)?.length).toBe(1);
    expect(container.resolve(t, { tag: ["role", "beta"] })).toBe(1);
    expect(container.has(t, { tag: ["role", "alpha"] })).toBe(false);
  });
  it("initializeAsync only materializes singleton-scoped bindings", async () => {
    const singletonTok = token<number>("branch-init-singleton-only");
    const transientTok = token<number>("branch-init-transient-skip");
    const container = Container.create();
    let transientHits = 0;
    container.bind(singletonTok).toConstantValue(100);
    container
      .bind(transientTok)
      .toDynamic(() => {
        transientHits += 1;
        return 200;
      })
      .transient();
    await container.initializeAsync();
    expect(container.resolve(singletonTok)).toBe(100);
    expect(transientHits).toBe(0);
    expect(container.resolve(transientTok)).toBe(200);
    expect(transientHits).toBe(1);
  });
  it("has(token, { name, tag }) is true only when a single binding matches both hint parts", () => {
    const t = token<string>("branch-has-combined-hint");
    const container = Container.create();
    container.bind(t).whenNamed("n").whenTagged("role", "worker").toConstantValue("ok");
    expect(container.has(t, { name: "n", tag: ["role", "worker"] })).toBe(true);
    expect(container.has(t, { name: "n", tag: ["role", "boss"] })).toBe(false);
    expect(container.has(t, { name: "other", tag: ["role", "worker"] })).toBe(false);
  });
  it("unbind(token) on a key with no owned bindings still clears the slot index entry safely", () => {
    const t = token<number>("branch-unbind-missing-key");
    const container = Container.create();
    expect(() => container.unbind(t)).not.toThrow();
    expect(container.has(t)).toBe(false);
  });
  it("unloadAsync throws InternalError when the module is not registered on the container", async () => {
    const ghost = Module.create("branch-ghost-module", () => undefined);
    const container = Container.create();
    await expect(container.unloadAsync(ghost)).rejects.toThrow(InternalError);
    await expect(container.unloadAsync(ghost)).rejects.toThrow(/not loaded/);
  });
  it("inspect and generateDependencyGraph return stable shapes for a simple binding graph", async () => {
    const t = token<number>("branch-inspect-graph");
    const container = Container.create();
    container.bind(t).toConstantValue(1);
    await Promise.resolve();
    const snapshot = container.inspect();
    expect(Array.isArray(snapshot.bindings)).toBe(true);
    const graph = container.generateDependencyGraph();
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
  });
});

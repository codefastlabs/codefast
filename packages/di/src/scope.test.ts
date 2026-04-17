import { createBindingIdentifier, type Binding } from "#/binding";
import { ScopeManager } from "./scope";

describe("ScopeManager", () => {
  it("getOrCreateAsync shares one in-flight factory for concurrent singleton resolves", async () => {
    const id = createBindingIdentifier();
    const binding: Binding<unknown> = {
      id,
      scope: "singleton",
      kind: "constant",
      value: null,
      tags: new Map(),
    };
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
    const id = createBindingIdentifier();
    const binding: Binding<unknown> = {
      id,
      scope: "scoped",
      kind: "constant",
      value: null,
      tags: new Map(),
    };
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
    const id = createBindingIdentifier();
    const deactivated: unknown[] = [];
    const instance = { k: "scoped-instance" };
    const binding: Binding<unknown> = {
      id,
      scope: "scoped",
      kind: "constant",
      value: null,
      tags: new Map(),
      onDeactivation: (inst) => {
        deactivated.push(inst);
      },
    };
    const scope = ScopeManager.createRoot();
    scope.getOrCreate(binding, () => instance);
    scope.dispose();
    expect(deactivated).toEqual([instance]);
  });
});

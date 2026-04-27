import { describe, expect, it } from "vitest";
import { runActivation, runActivationAsync } from "#/lifecycle";
import type { ResolutionContext, ConstantBinding } from "#/binding";
import { createBindingIdentifier } from "#/binding";
import { AsyncResolutionError } from "#/errors";
function createMockBinding(
  onActivation?: (resolutionContext: ResolutionContext, instance: unknown) => unknown,
): ConstantBinding<unknown> {
  return {
    id: createBindingIdentifier(),
    kind: "constant",
    scope: "transient",
    value: null,
    tags: new Map(),
    onActivation,
  };
}
describe("lifecycle", () => {
  const stubResolutionContext = {
    resolve: () => {
      throw new Error("not implemented");
    },
    resolveAsync: () => {
      throw new Error("not implemented");
    },
    resolveOptional: () => {
      throw new Error("not implemented");
    },
    constraint: {
      resolutionPath: [],
      materializationStack: [],
      parent: undefined,
      ancestors: [],
      currentResolveHint: undefined,
    },
  } as unknown as ResolutionContext;
  describe("runActivation", () => {
    it("returns instance directly if no onActivation handler is set", () => {
      const binding = createMockBinding();
      const instance = { name: "test" };
      expect(runActivation(binding, instance, stubResolutionContext, ["Root"])).toBe(instance);
    });
    it("runs onActivation and returns its synchronous result", () => {
      interface TestInstance {
        name: string;
        isActive?: boolean;
      }
      const binding = createMockBinding((_resolutionContext, inst) => ({
        ...(inst as TestInstance),
        isActive: true,
      }));
      const instance: TestInstance = { name: "test" };
      const activatedInstance = runActivation(binding, instance, stubResolutionContext, ["Root"]);
      expect(activatedInstance).toEqual({ name: "test", isActive: true });
    });
    it("throws AsyncResolutionError if onActivation returns a promise in sync mode", () => {
      const binding = createMockBinding(() => Promise.resolve());
      expect(() => {
        runActivation(binding, {}, stubResolutionContext, ["App", "Database"]);
      }).toThrowError(AsyncResolutionError);
      expect(() => {
        runActivation(binding, {}, stubResolutionContext, ["App", "Database"]);
      }).toThrow(/onActivation returned a Promise during synchronous resolution/);
    });
    it("uses '(unknown)' label if pathLabels is empty when throwing", () => {
      const binding = createMockBinding(() => Promise.resolve());
      expect(() => {
        runActivation(binding, {}, stubResolutionContext, []);
      }).toThrow(/\(unknown\)/);
    });
  });
  describe("runActivationAsync", () => {
    it("returns instance directly if no onActivation handler is set", async () => {
      const binding = createMockBinding();
      const instance = { name: "test" };
      await expect(runActivationAsync(binding, instance, stubResolutionContext)).resolves.toBe(
        instance,
      );
    });
    it("runs onActivation and resolves its async result", async () => {
      interface TestInstance {
        name: string;
        isActive?: boolean;
      }
      const binding = createMockBinding(async (_resolutionContext, inst) => {
        await Promise.resolve();
        return { ...(inst as TestInstance), isActive: true };
      });
      const instance: TestInstance = { name: "test" };
      const activatedInstance = await runActivationAsync(binding, instance, stubResolutionContext);
      expect(activatedInstance).toEqual({ name: "test", isActive: true });
    });
    it("works fine with synchronous onActivation handler wrapped in async method", async () => {
      interface TestInstance {
        name: string;
        isActive?: boolean;
      }
      const binding = createMockBinding((_resolutionContext, inst) => ({
        ...(inst as TestInstance),
        isActive: true,
      }));
      const instance: TestInstance = { name: "test" };
      const activatedInstance = await runActivationAsync(binding, instance, stubResolutionContext);
      expect(activatedInstance).toEqual({ name: "test", isActive: true });
    });
  });
});

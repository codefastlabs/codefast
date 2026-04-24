import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBindingIdentifier, type Binding } from "#/binding";
import { ScopeViolationError } from "#/errors";
import { validateScopeRules } from "#/scope-validation";
import { token } from "#/token";
import { listResolvedDependencies } from "#/dependency-graph";

vi.mock("#/dependency-graph", () => ({
  listResolvedDependencies: vi.fn(),
}));

function createBinding(overrides: Partial<Binding<unknown>> = {}): Binding<unknown> {
  return {
    id: createBindingIdentifier(),
    kind: "dynamic",
    scope: "transient",
    factory: () => undefined,
    tags: new Map(),
    ...overrides,
  } as Binding<unknown>;
}

describe("validateScopeRules", () => {
  beforeEach(() => {
    vi.mocked(listResolvedDependencies).mockReset();
  });

  it("skips dependency analysis when registry key has no bindings", () => {
    const sampleToken = token("Missing");
    validateScopeRules({
      collectAllRegistryKeys: () => [sampleToken],
      lookupBindings: () => undefined,
      getMetadataReader: () => undefined,
    });

    expect(listResolvedDependencies).not.toHaveBeenCalled();
  });

  it("throws ScopeViolationError for singleton depending on transient", () => {
    const consumer = createBinding({ kind: "dynamic", scope: "singleton" });
    const dependency = createBinding({ kind: "dynamic", scope: "transient" });
    vi.mocked(listResolvedDependencies).mockReturnValue([
      { binding: dependency, path: ["ServiceRoot", "RequestContext"] },
    ]);

    expect(() => {
      validateScopeRules({
        collectAllRegistryKeys: () => [token("ServiceRoot")],
        lookupBindings: () => [consumer],
        getMetadataReader: () => undefined,
      });
    }).toThrow(ScopeViolationError);
  });

  it("allows singleton depending on constant binding", () => {
    const consumer = createBinding({ kind: "dynamic", scope: "singleton" });
    const constantDependency = createBinding({
      kind: "constant",
      scope: "transient",
      value: "ok",
    });
    vi.mocked(listResolvedDependencies).mockReturnValue([
      { binding: constantDependency, path: ["ServiceRoot", "ConfigValue"] },
    ]);

    expect(() => {
      validateScopeRules({
        collectAllRegistryKeys: () => [token("ServiceRoot")],
        lookupBindings: () => [consumer],
        getMetadataReader: () => undefined,
      });
    }).not.toThrow();
  });

  it("allows non-singleton consumers to depend on shorter-lived bindings", () => {
    const consumer = createBinding({ kind: "dynamic", scope: "scoped" });
    const dependency = createBinding({ kind: "dynamic", scope: "transient" });
    vi.mocked(listResolvedDependencies).mockReturnValue([
      { binding: dependency, path: ["ScopedService", "RequestContext"] },
    ]);

    expect(() => {
      validateScopeRules({
        collectAllRegistryKeys: () => [token("ScopedService")],
        lookupBindings: () => [consumer],
        getMetadataReader: () => undefined,
      });
    }).not.toThrow();
  });
});

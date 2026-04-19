import { describe, expect, it } from "vitest";
import {
  AsyncModuleLoadError,
  AsyncResolutionError,
  CircularDependencyError,
  InternalError,
  MissingMetadataError,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
} from "#/errors";
import { createBindingIdentifier } from "#/binding";

describe("errors", () => {
  it("InternalError provides a stable code and message", () => {
    const error = new InternalError("Base error message");
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.message).toBe("Base error message");
    expect(error.name).toBe("InternalError");
  });

  it("NoMatchingBindingError provides formatted message and hint", () => {
    const hint = { name: "test-hint", tag: ["role", "admin"] as const };
    const path = ["App", "UserService", "Logger"];
    const error = new NoMatchingBindingError("Logger", hint, path);
    expect(error.code).toBe("NO_MATCHING_BINDING");
    expect(error.message).toContain("No binding matched resolve options");
    expect(error.message).toContain("name: test-hint");
    expect(error.message).toContain("tag: [role, <string>]");
    expect(error.message).toContain("App -> UserService -> Logger");
    expect(error.hint).toEqual(hint);
    expect(error.tokenName).toBe("Logger");
    expect(error.resolutionPath).toEqual(path);
  });

  it("NoMatchingBindingError handles empty path", () => {
    const error = new NoMatchingBindingError("Logger", { name: "test" }, []);
    expect(error.message).toContain("(empty)");
  });

  it("TokenNotBoundError formats path correctly", () => {
    const path = ["ModuleA", "ModuleB"];
    const error = new TokenNotBoundError("Database", path);
    expect(error.code).toBe("TOKEN_NOT_BOUND");
    expect(error.message).toContain("Token not bound: Database");
    expect(error.message).toContain("ModuleA -> ModuleB");
    expect(error.tokenName).toBe("Database");
  });

  it("CircularDependencyError exposes resolution cycle", () => {
    const path = ["A", "B", "A"];
    const error = new CircularDependencyError(path);
    expect(error.code).toBe("CIRCULAR_DEPENDENCY");
    expect(error.message).toContain("Circular dependency detected: A -> B -> A");
    expect(error.resolutionPath).toEqual(path);
    expect(error.cycle).toEqual(path);
  });

  it("MissingMetadataError formats message properly", () => {
    const error = new MissingMetadataError("Controller", ["App", "Controller"]);
    expect(error.code).toBe("MISSING_METADATA");
    expect(error.message).toContain(
      'Missing injectable constructor metadata for class "Controller"',
    );
    expect(error.message).toContain("App -> Controller");
    expect(error.className).toBe("Controller");
  });

  it("AsyncModuleLoadError provides clear instruction", () => {
    const error = new AsyncModuleLoadError("feature-async");
    expect(error.code).toBe("ASYNC_MODULE_LOAD");
    expect(error.message).toContain('Cannot load async module "feature-async" synchronously');
    expect(error.moduleName).toBe("feature-async");
  });

  it("AsyncResolutionError formats reason and path", () => {
    const error = new AsyncResolutionError("Config", ["Main", "Config"], "some custom reason");
    expect(error.code).toBe("ASYNC_RESOLUTION");
    expect(error.message).toContain('Cannot resolve "Config" synchronously: some custom reason');
    expect(error.message).toContain("Main -> Config");
    expect(error.reason).toBe("some custom reason");
  });

  it("ScopeViolationError formats message capturing consumer and dependency details", () => {
    const error = new ScopeViolationError({
      consumerBindingId: createBindingIdentifier(),
      consumerKind: "class",
      consumerScope: "singleton",
      consumerLabel: "RootService",
      dependencyBindingId: createBindingIdentifier(),
      dependencyKind: "class",
      dependencyScope: "transient",
      dependencyLabel: "TemporaryWorker",
      resolutionPath: ["RootService", "TemporaryWorker"],
    });

    expect(error.code).toBe("SCOPE_VIOLATION");
    expect(error.message).toContain(
      'Singleton "RootService" cannot depend on Transient "TemporaryWorker"',
    );
    expect(error.message).toContain("RootService -> TemporaryWorker");
    expect(error.consumerKind).toBe("class");
  });

  it("ScopeViolationError has fallback for undefined labels", () => {
    const cId = createBindingIdentifier();
    const dId = createBindingIdentifier();
    const error = new ScopeViolationError({
      consumerBindingId: cId,
      consumerKind: "dynamic",
      consumerScope: "scoped",
      dependencyBindingId: dId,
      dependencyKind: "resolved",
      dependencyScope: "transient",
      resolutionPath: [],
    });

    expect(error.message).toContain(`Scoped "${cId}" cannot depend on Transient "${dId}"`);
  });
});

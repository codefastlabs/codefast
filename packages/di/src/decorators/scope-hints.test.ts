import { describe, expect, it } from "vitest";
import { singleton } from "#/decorators/singleton";
import { scoped } from "#/decorators/scoped";
import { DiError } from "#/errors";
import { CODEFAST_DI_CLASS_SCOPE_HINT } from "#/decorators/metadata";

describe("scope decorators", () => {
  function mockContext(metadata: Record<PropertyKey, unknown> = {}): ClassDecoratorContext {
    return {
      kind: "class",
      name: "MyClass",
      metadata,
      addInitializer: () => {},
    };
  }

  it("singleton() records singleton hint", () => {
    const metadata: Record<PropertyKey, unknown> = {};
    const context = mockContext(metadata);
    const ctor = class {};
    singleton()(ctor, context);
    expect(metadata[CODEFAST_DI_CLASS_SCOPE_HINT]).toBe("singleton");
  });

  it("scoped() records scoped hint", () => {
    const metadata: Record<PropertyKey, unknown> = {};
    const context = mockContext(metadata);
    const ctor = class {};
    scoped()(ctor, context);
    expect(metadata[CODEFAST_DI_CLASS_SCOPE_HINT]).toBe("scoped");
  });

  it("singleton() throws if scoped hint already present", () => {
    const metadata = { [CODEFAST_DI_CLASS_SCOPE_HINT]: "scoped" };
    const context = mockContext(metadata);
    const ctor = class {};
    expect(() => singleton()(ctor, context)).toThrow(DiError);
    expect(() => singleton()(ctor, context)).toThrow(
      /cannot apply @singleton\(\) after @scoped\(\)/,
    );
  });

  it("scoped() throws if singleton hint already present", () => {
    const metadata = { [CODEFAST_DI_CLASS_SCOPE_HINT]: "singleton" };
    const context = mockContext(metadata);
    const ctor = class {};
    expect(() => scoped()(ctor, context)).toThrow(DiError);
    expect(() => scoped()(ctor, context)).toThrow(/cannot apply @scoped\(\) after @singleton\(\)/);
  });

  it("does not throw if applying the same hint twice", () => {
    const metadata = { [CODEFAST_DI_CLASS_SCOPE_HINT]: "singleton" };
    const context = mockContext(metadata);
    const ctor = class {};
    singleton()(ctor, context); // Should be fine
    expect(metadata[CODEFAST_DI_CLASS_SCOPE_HINT]).toBe("singleton");
  });
});

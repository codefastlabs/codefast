import { describe, expect, it } from "vitest";

import { NotInjectableError, TestingError, UndeclaredDependencyError } from "#/errors/errors";

describe("NotInjectableError", () => {
  it("carries its code, name, and target", () => {
    const error = new NotInjectableError("OrderProcessor");

    expect(error).toBeInstanceOf(TestingError);
    expect(error.code).toBe("NOT_INJECTABLE");
    expect(error.name).toBe("NotInjectableError");
    expect(error.targetName).toBe("OrderProcessor");
    expect(error.message).toContain("OrderProcessor");
  });
});

describe("UndeclaredDependencyError", () => {
  it("carries its code, name, and token", () => {
    const error = new UndeclaredDependencyError("Logger");

    expect(error).toBeInstanceOf(TestingError);
    expect(error.code).toBe("UNDECLARED_DEPENDENCY");
    expect(error.name).toBe("UndeclaredDependencyError");
    expect(error.tokenName).toBe("Logger");
  });
});

import { describe, expect, it } from "vitest";
import { token, type Token, type TokenValue } from "#/token";
describe("token", () => {
  it("creates a frozen token carrying the provided name", () => {
    const loggerToken = token("Logger");
    expect(loggerToken.name).toBe("Logger");
    expect(Object.isFrozen(loggerToken)).toBe(true);
  });
  it("uses reference identity even when names are equal", () => {
    const leftToken = token<string>("Shared");
    const rightToken = token<string>("Shared");
    const registry = new Map<Token<string>, string>();
    registry.set(leftToken, "left");
    registry.set(rightToken, "right");
    expect(leftToken).not.toBe(rightToken);
    expect(registry.get(leftToken)).toBe("left");
    expect(registry.get(rightToken)).toBe("right");
    expect(registry.size).toBe(2);
  });
  it("prevents runtime mutation of token name", () => {
    const immutableToken = token("Immutable");
    expect(() => {
      (
        immutableToken as {
          name: string;
        }
      ).name = "Mutated";
    }).toThrow(TypeError);
    expect(immutableToken.name).toBe("Immutable");
  });
  it("maps TokenValue for token and constructor inputs", () => {
    class Service {}
    const valueFromToken: TokenValue<Token<Service>> = new Service();
    const valueFromConstructor: TokenValue<typeof Service> = new Service();
    expect(valueFromToken).toBeInstanceOf(Service);
    expect(valueFromConstructor).toBeInstanceOf(Service);
  });
});

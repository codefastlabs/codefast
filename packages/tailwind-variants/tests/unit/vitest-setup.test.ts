import { describe, expect, test } from "vitest";

describe("toHaveClassName", () => {
  test("compares classes regardless of order, and counts a repeated one", () => {
    expect("b a").toHaveClassName("a b");
    expect("a b").toHaveClassName(["b", "a"]);
    expect("a b").not.toHaveClassName("a");
    expect("a a b").not.toHaveClassName("a b");
  });

  test("fails with a clear message, never a TypeError, for a value that is not a class list", () => {
    for (const received of [undefined, null, 42, { a: true }, ["a", 1]]) {
      expect(() => expect(received).toHaveClassName("a")).toThrow(/must be a class string/);
      expect(() => expect(received).not.toHaveClassName("a")).toThrow(/must be a class string/);
    }
  });
});

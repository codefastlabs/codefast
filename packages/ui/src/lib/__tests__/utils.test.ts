import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  test("should combine simple string class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("should filter out falsy values", () => {
    expect(cn("foo", null, undefined, false, "bar")).toBe("foo bar");
  });

  test("should handle conditionals in objects", () => {
    expect(cn("foo", { bar: true, baz: false })).toBe("foo bar");
    expect(cn("foo", { bar: false, baz: true })).toBe("foo baz");
  });

  test("should handle nested arrays", () => {
    expect(cn("foo", ["bar", "baz"])).toBe("foo bar baz");
    expect(cn("foo", ["bar", { baz: true, qux: false }])).toBe("foo bar baz");
  });

  test("should merge conflicting Tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-red-500 text-white", "bg-blue-500")).toBe("text-white bg-blue-500");
  });

  test("should handle complex inputs", () => {
    expect(
      cn("fixed inset-0", { "bg-black/50": true, hidden: false }, [
        "flex",
        { "items-center": true },
      ]),
    ).toBe("fixed inset-0 bg-black/50 flex items-center");
  });

  test("should return empty string when no valid inputs", () => {
    expect(cn()).toBe("");
    expect(cn(null, undefined, false)).toBe("");
  });
});

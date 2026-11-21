import { extendTailwindMerge } from "cn/config";

import { createTV } from "#index";

describe("createTV", () => {
  test("should use config in tv calls", () => {
    const { tv } = createTV({ twMerge: false });
    const h1 = tv({ base: "text-3xl text-xl font-bold text-blue-200 text-blue-400" });

    expect(h1()).toHaveClassName("text-3xl font-bold text-blue-400 text-xl text-blue-200");
  });

  test("should override config", () => {
    const { tv } = createTV({ twMerge: false });
    const h1 = tv({ base: "text-3xl text-xl font-bold text-blue-200 text-blue-400" }, { twMerge: true });

    expect(h1()).toHaveClassName("font-bold text-blue-400 text-xl");
  });

  test("falls back to the shared option for a local one left undefined", () => {
    const { tv } = createTV({ twMerge: false });
    const twMerge: boolean | undefined = undefined;
    const h1 = tv({ base: "text-3xl text-xl font-bold text-blue-200 text-blue-400" }, { twMerge });

    expect(h1()).toHaveClassName("text-3xl font-bold text-blue-400 text-xl text-blue-200");
  });

  test("forwards a possibly-undefined cacheResolutions without narrowing it first", () => {
    const { tv } = createTV({ cacheResolutions: false });
    const cacheResolutions: boolean | undefined = undefined;
    const h1 = tv({ base: "text-xl" }, { cacheResolutions });

    expect(h1()).toBe("text-xl");
  });
});

describe("cn function from createTV", () => {
  test("should use global twMerge config", () => {
    const { cn: cnWithMerge } = createTV({ twMerge: true });
    const result = cnWithMerge("text-xl", "text-blue-500", "text-2xl");

    expect(result).toBe("text-blue-500 text-2xl");
  });

  test("should respect twMerge: false", () => {
    const { cn: cnWithoutMerge } = createTV({ twMerge: false });
    const result = cnWithoutMerge("text-xl", "text-blue-500", "text-2xl");

    expect(result).toBe("text-xl text-blue-500 text-2xl");
  });

  test("should merge with a caller's extended engine", () => {
    const { cn: cnWithConfig } = createTV({
      twMerge: extendTailwindMerge({
        extend: {
          classGroups: {
            "font-size": ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl"],
          },
          conflictingClassGroups: {
            "font-size": ["font-size"],
          },
        },
      }),
    });

    const result = cnWithConfig("text-lg", "text-xl", "text-2xl");

    expect(result).toBe("text-2xl");
  });

  test("should work with complex class combinations", () => {
    const { cn: cnWithMerge } = createTV({ twMerge: true });
    const result = cnWithMerge(
      "px-4 py-2",
      "px-8 py-4",
      "bg-blue-500",
      "bg-red-500",
      "text-white",
      "rounded-md",
      "rounded-lg",
    );

    expect(result).toBe("px-8 py-4 bg-red-500 text-white rounded-lg");
  });

  test("should handle mixed conditional and static classes", () => {
    const { cn: cnWithMerge } = createTV({ twMerge: true });
    const isLarge = true;
    const isBlue = false;

    const result = cnWithMerge(
      "base-class",
      isLarge ? "text-lg" : "",
      isBlue ? "text-blue-500" : "",
      "text-red-500",
      "text-xl",
    );

    expect(result).toBe("base-class text-red-500 text-xl");
  });
});

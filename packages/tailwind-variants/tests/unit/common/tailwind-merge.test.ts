import { extendTailwindMerge } from "tailwind-merge";

import { createTV, tv } from "#index";
import { COMMON_UNITS, customTwMerge } from "#tests/unit/fixtures/tailwind-merge-config";

describe("Tailwind Variants (TV) - Tailwind Merge", () => {
  test("should merge the tailwind classes correctly", () => {
    const styles = tv({
      base: "text-base text-yellow-400",
      variants: {
        color: {
          blue: "text-blue-500",
          red: "text-red-500",
        },
      },
    });

    const result = styles({
      color: "red",
    });

    expect(result).toHaveClassName(["text-base", "text-red-500"]);
  });

  test("should support custom config", () => {
    const styles = tv(
      {
        base: "text-small w-unit text-yellow-400",
        variants: {
          color: {
            blue: "text-blue-500",
            red: "text-red-500",
          },
          size: {
            large: "text-large w-unit-6",
            medium: "text-medium w-unit-4",
            small: "text-small w-unit-2",
          },
        },
      },
      {
        twMerge: customTwMerge,
      },
    );

    const result = styles({
      color: "blue",
      size: "medium",
    });

    expect(result).toHaveClassName(["text-medium", "text-blue-500", "w-unit-4"]);
  });

  test("should support custom config with inline config object", () => {
    const styles = tv(
      {
        base: "text-small w-unit text-yellow-400",
        variants: {
          color: {
            blue: "text-blue-500",
            red: "text-red-500",
          },
          size: {
            large: "text-large w-unit-6",
            medium: "text-medium w-unit-4",
            small: "text-small w-unit-2",
          },
        },
      },
      {
        twMerge: extendTailwindMerge<string, string>({
          extend: {
            classGroups: {
              "bg-image": ["bg-stripe-gradient"],
              "font-size": [{ text: ["tiny", ...COMMON_UNITS] }],
              "min-w": [
                {
                  "min-w": ["unit", "unit-2", "unit-4", "unit-6"],
                },
              ],
              shadow: [{ shadow: COMMON_UNITS }],
            },
            theme: {
              borderRadius: COMMON_UNITS,
              borderWidth: COMMON_UNITS,
              opacity: ["disabled"],
              spacing: ["divider", "unit", "unit-2", "unit-4", "unit-6"],
            },
          },
        }),
      },
    );

    const result = styles({
      color: "blue",
      size: "medium",
    });

    expect(result).toHaveClassName(["text-medium", "text-blue-500", "w-unit-4"]);
  });

  test("should run a caller's merge function on the first and every compiled call", () => {
    const merge = (classes: string): string => `merged(${classes})`;
    const styles = tv({ base: "px-2", variants: { size: { lg: "px-4" } } }, { twMerge: merge });

    expect(styles({ size: "lg" })).toBe("merged(px-2 px-4)");
    expect(styles({ size: "lg" })).toBe("merged(px-2 px-4)");
    expect(styles()).toBe("merged(px-2)");
  });

  test("should run a caller's merge function for every slot", () => {
    const merge = (classes: string): string => `merged(${classes})`;
    const card = tv({ slots: { base: "p-2", title: "text-sm" } }, { twMerge: merge });

    for (let call = 0; call < 2; call++) {
      const { base, title } = card();

      expect(base()).toBe("merged(p-2)");
      expect(title({ class: "text-lg" })).toBe("merged(text-sm text-lg)");
    }
  });

  test("should share a factory's merge function with its cn", () => {
    const merge = (classes: string): string => `merged(${classes})`;
    const { cn: mergeCn, tv: mergeTv } = createTV({ twMerge: merge });

    expect(mergeCn("px-2", "px-4")).toBe("merged(px-2 px-4)");
    expect(mergeTv({ base: "px-2" })()).toBe("merged(px-2)");
  });

  test("should treat true as the default merge", () => {
    const config = { base: "px-2 px-4", variants: { tone: { muted: "text-sm text-lg" } } };

    expect(tv(config, { twMerge: true })({ tone: "muted" })).toBe(tv(config)({ tone: "muted" }));
    expect(tv(config)({ tone: "muted" })).toBe("px-4 text-lg");
  });
});

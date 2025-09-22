import { tv } from "@/index";
import { COMMON_UNITS, twMergeConfig } from "~/fixtures/tailwind-merge-config";

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
        base: "text-small text-yellow-400 w-unit",
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
        twMergeConfig,
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
        base: "text-small text-yellow-400 w-unit",
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
        twMergeConfig: {
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
        },
      },
    );

    const result = styles({
      color: "blue",
      size: "medium",
    });

    expect(result).toHaveClassName(["text-medium", "text-blue-500", "w-unit-4"]);
  });
});

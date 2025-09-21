import { tv } from "@/index";

describe("Tailwind Variants (TV) - Slots Edge Cases", () => {
  test("should handle undefined slot variants", () => {
    const component = tv({
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          blue: {
            base: "bg-blue-500",
            item: "text-blue-500",
          },
          red: {
            base: "bg-red-500",
            // item slot is undefined for red color
          },
        },
      },
    });

    const { base, item } = component({ color: "red" });

    expect(base()).toHaveClassName(["flex", "bg-red-500"]);
    expect(item()).toHaveClassName("px-2"); // Should only have base slot class
  });

  test("should handle boolean variant defaults for slots", () => {
    const component = tv({
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        isActive: {
          false: {
            base: "opacity-50",
            item: "text-gray-500",
          },
          true: {
            base: "opacity-100",
            item: "text-blue-500",
          },
        },
      },
    });

    // Should default to false for boolean variants
    const { base: defaultBase, item: defaultItem } = component();

    expect(defaultBase()).toHaveClassName(["flex", "opacity-50"]);
    expect(defaultItem()).toHaveClassName(["px-2", "text-gray-500"]);

    // Explicit true
    const { base: trueBase, item: trueItem } = component({ isActive: true });

    expect(trueBase()).toHaveClassName(["flex", "opacity-100"]);
    expect(trueItem()).toHaveClassName(["px-2", "text-blue-500"]);
  });

  test("should handle non-object variant classes for base slot only", () => {
    const component = tv({
      slots: {
        base: "flex",
        header: "text-lg",
        item: "px-2",
      },
      variants: {
        theme: {
          dark: "bg-gray-800", // Non-object variant - should only apply to base
          light: {
            base: "bg-white",
            header: "text-gray-900",
            item: "text-gray-700",
          },
        },
      },
    });

    const { base: darkBase, header: darkHeader, item: darkItem } = component({ theme: "dark" });

    expect(darkBase()).toHaveClassName(["flex", "bg-gray-800"]);
    expect(darkItem()).toHaveClassName("px-2"); // No theme applied
    expect(darkHeader()).toHaveClassName("text-lg"); // No theme applied

    const { base: lightBase, header: lightHeader, item: lightItem } = component({ theme: "light" });

    expect(lightBase()).toHaveClassName(["flex", "bg-white"]);
    expect(lightItem()).toHaveClassName(["px-2", "text-gray-700"]);
    expect(lightHeader()).toHaveClassName(["text-lg", "text-gray-900"]);
  });

  test("should handle compound variants with slots - partial matching", () => {
    const component = tv({
      compoundVariants: [
        {
          className: "shadow-lg",
          color: "red",
          size: "large",
        },
      ],
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          blue: {
            base: "bg-blue-500",
            item: "text-blue-500",
          },
          red: {
            base: "bg-red-500",
            item: "text-red-500",
          },
        },
        size: {
          large: {
            base: "p-4",
            item: "text-lg",
          },
          small: {
            base: "p-2",
            item: "text-sm",
          },
        },
      },
    });

    // Partial match - should not apply compound
    const { base: partialBase, item: partialItem } = component({ color: "red" });

    expect(partialBase()).toHaveClassName(["flex", "bg-red-500"]);
    expect(partialItem()).toHaveClassName(["px-2", "text-red-500"]);

    // Full match - should apply compound to base only
    const { base: fullBase, item: fullItem } = component({ color: "red", size: "large" });

    expect(fullBase()).toHaveClassName(["flex", "bg-red-500", "p-4", "shadow-lg"]);
    expect(fullItem()).toHaveClassName(["px-2", "text-red-500", "text-lg"]);
  });

  test("should handle compound variants with boolean values in slots", () => {
    const component = tv({
      compoundVariants: [
        {
          className: "ring-2",
          color: "red",
          isActive: true,
        },
      ],
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          red: {
            base: "bg-red-500",
            item: "text-red-500",
          },
        },
        isActive: {
          false: {
            base: "opacity-50",
            item: "text-gray-500",
          },
          true: {
            base: "opacity-100",
            item: "text-white",
          },
        },
      },
    });

    // Should match boolean compound variant
    const { base: matchBase, item: matchItem } = component({ color: "red", isActive: true });

    expect(matchBase()).toHaveClassName(["flex", "bg-red-500", "opacity-100", "ring-2"]);
    expect(matchItem()).toHaveClassName(["px-2", "text-white"]);

    // Should not match - boolean value is false
    const { base: noMatchBase, item: noMatchItem } = component({ color: "red", isActive: false });

    expect(noMatchBase()).toHaveClassName(["flex", "bg-red-500", "opacity-50"]);
    expect(noMatchItem()).toHaveClassName(["px-2", "text-gray-500"]);
  });

  test("should handle compound variants with default boolean resolution", () => {
    const component = tv({
      compoundVariants: [
        {
          className: "border-2",
          color: "red",
          isActive: false, // Matching the default false
        },
      ],
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          red: {
            base: "bg-red-500",
            item: "text-red-500",
          },
        },
        isActive: {
          false: {
            base: "opacity-50",
            item: "text-gray-500",
          },
          true: {
            base: "opacity-100",
            item: "text-white",
          },
        },
      },
    });

    // Should match compound with default boolean (undefined -> false)
    const { base: defaultBase, item: defaultItem } = component({ color: "red" });

    expect(defaultBase()).toHaveClassName(["flex", "bg-red-500", "opacity-50"]);
    expect(defaultItem()).toHaveClassName(["px-2", "text-gray-500"]);
  });

  test("should handle empty compound variants array", () => {
    const component = tv({
      compoundVariants: [],
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          red: {
            base: "bg-red-500",
            item: "text-red-500",
          },
        },
      },
    });

    const { base, item } = component({ color: "red" });

    expect(base()).toHaveClassName(["flex", "bg-red-500"]);
    expect(item()).toHaveClassName(["px-2", "text-red-500"]);
  });

  test("should handle undefined compound variants", () => {
    const component = tv({
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          red: {
            base: "bg-red-500",
            item: "text-red-500",
          },
        },
      },
    });

    const { base, item } = component({ color: "red" });

    expect(base()).toHaveClassName(["flex", "bg-red-500"]);
    expect(item()).toHaveClassName(["px-2", "text-red-500"]);
  });

  test("should handle slot variant with mixed value types", () => {
    const component = tv({
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        size: {
          medium: "p-4", // Non-object - applies to base only
          small: {
            base: "p-2",
            item: "text-sm",
          },
        },
        theme: {
          dark: {
            base: "bg-gray-800",
            // item is undefined
          },
        },
      },
    });

    const { base: mixedBase, item: mixedItem } = component({ size: "medium", theme: "dark" });

    expect(mixedBase()).toHaveClassName(["flex", "p-4", "bg-gray-800"]);
    expect(mixedItem()).toHaveClassName("px-2"); // No variant classes applied
  });
});

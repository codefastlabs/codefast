import { tv } from "@/index";

describe("Tailwind Variants (TV) - Compound Edge Cases", () => {
  test("should handle empty compound slots array", () => {
    const component = tv({
      compoundSlots: [],
      slots: {
        base: "flex",
        item: "px-2",
      },
    });

    const { base, item } = component();

    expect(base()).toHaveClassName("flex");
    expect(item()).toHaveClassName("px-2");
  });

  test("should handle undefined compound slots", () => {
    const component = tv({
      slots: {
        base: "flex",
        item: "px-2",
      },
    });

    const { base, item } = component();

    expect(base()).toHaveClassName("flex");
    expect(item()).toHaveClassName("px-2");
  });

  test("should handle compound slots with boolean variants - false case", () => {
    const component = tv({
      compoundSlots: [
        {
          className: "bg-red-500",
          isActive: false,
          slots: ["item"],
        },
        {
          className: "bg-blue-500",
          isActive: true,
          slots: ["item"],
        },
      ],
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        isActive: {
          false: "font-normal",
          true: "font-bold",
        },
      },
    });

    // Test with explicit false - should apply compound slot
    const { item: itemFalse } = component({ isActive: false });

    expect(itemFalse()).toHaveClassName(["px-2", "bg-red-500"]);

    // Test with default (undefined -> false) - should apply compound slot
    const { item: itemDefault } = component();

    expect(itemDefault()).toHaveClassName(["px-2", "bg-red-500"]);

    // Test with explicit true - should apply different compound slot
    const { item: itemTrue } = component({ isActive: true });

    expect(itemTrue()).toHaveClassName(["px-2", "bg-blue-500"]);
  });

  test("should handle compound slots with mixed variant types", () => {
    const component = tv({
      compoundSlots: [
        {
          className: "special-combo",
          color: "primary",
          isLarge: true,
          size: "md",
          slots: ["item"],
        },
      ],
      defaultVariants: {
        color: "secondary",
        isLarge: false,
        size: "sm",
      },
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          primary: "text-blue-500",
          secondary: "text-gray-500",
        },
        isLarge: {
          false: "text-sm",
          true: "text-lg",
        },
        size: {
          lg: "w-12",
          md: "w-8",
          sm: "w-4",
        },
      },
    });

    // Should not match - different color (only base slot classes apply)
    const { item: item1 } = component({ isLarge: true, size: "md" });

    expect(item1()).toHaveClassName("px-2");

    // Should match all conditions
    const { item: item2 } = component({ color: "primary", isLarge: true, size: "md" });

    expect(item2()).toHaveClassName(["px-2", "special-combo"]);
  });

  test("should handle compound slots with class vs className property", () => {
    const component = tv({
      compoundSlots: [
        {
          class: "bg-blue-100",
          color: "primary",
          slots: ["item"],
        },
        {
          className: "bg-gray-100",
          color: "secondary",
          slots: ["item"],
        },
      ],
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          primary: "text-blue-500",
          secondary: "text-gray-500",
        },
      },
    });

    const { item: itemClass } = component({ color: "primary" });

    expect(itemClass()).toHaveClassName(["px-2", "bg-blue-100"]);

    const { item: itemClassName } = component({ color: "secondary" });

    expect(itemClassName()).toHaveClassName(["px-2", "bg-gray-100"]);
  });

  test("should handle compound slots with multiple slots per definition", () => {
    const component = tv({
      compoundSlots: [
        {
          className: "bg-blue-100",
          isActive: true,
          slots: ["header", "content", "footer"],
        },
      ],
      slots: {
        base: "flex",
        content: "px-4",
        footer: "py-2",
        header: "py-4",
      },
      variants: {
        isActive: {
          false: "opacity-50",
          true: "opacity-100",
        },
      },
    });

    const { base, content, footer, header } = component({ isActive: true });

    expect(base()).toHaveClassName(["flex", "opacity-100"]);
    expect(header()).toHaveClassName(["py-4", "bg-blue-100"]);
    expect(content()).toHaveClassName(["px-4", "bg-blue-100"]);
    expect(footer()).toHaveClassName(["py-2", "bg-blue-100"]);
  });

  test("should handle compound slots with no matching conditions", () => {
    const component = tv({
      compoundSlots: [
        {
          className: "bg-red-500",
          color: "primary",
          size: "large",
          slots: ["item"],
        },
      ],
      slots: {
        base: "flex",
        item: "px-2",
      },
      variants: {
        color: {
          primary: "text-blue-500",
          secondary: "text-gray-500",
        },
        size: {
          large: "text-lg",
          small: "text-sm",
        },
      },
    });

    // No variants provided - should not match compound
    const { item: item1 } = component();

    expect(item1()).toHaveClassName("px-2");

    // Partial match - should not match compound
    const { item: item2 } = component({ color: "primary" });

    expect(item2()).toHaveClassName("px-2");

    // Different values - should not match compound
    const { item: item3 } = component({ color: "secondary", size: "small" });

    expect(item3()).toHaveClassName("px-2");
  });

  test("should handle compound slots with array className values", () => {
    const component = tv({
      compoundSlots: [
        {
          className: ["bg-blue-100", "text-blue-800", "rounded"],
          isSpecial: true,
          slots: ["item", "header"],
        },
      ],
      slots: {
        base: "flex",
        header: "px-4",
        item: "px-2",
      },
      variants: {
        isSpecial: {
          false: "opacity-50",
          true: "opacity-100",
        },
      },
    });

    const { base, header, item } = component({ isSpecial: true });

    expect(base()).toHaveClassName(["flex", "opacity-100"]);
    expect(header()).toHaveClassName(["px-4", "bg-blue-100", "text-blue-800", "rounded"]);
    expect(item()).toHaveClassName(["px-2", "bg-blue-100", "text-blue-800", "rounded"]);
  });
});

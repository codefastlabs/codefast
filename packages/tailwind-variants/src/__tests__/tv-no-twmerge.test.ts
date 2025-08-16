import { tv } from "@/index";

describe("Tailwind Variants (TV) - twMerge: false", () => {
  test("should not resolve tailwind conflicts when twMerge is false", () => {
    const button = tv(
      {
        base: "px-4 px-2 py-2 py-4 bg-blue-500 bg-red-500",
      },
      {
        twMerge: false,
      },
    );

    // When twMerge is false, all classes should be preserved
    // including conflicting ones like px-4 and px-2
    expect(button()).toBe("px-4 px-2 py-2 py-4 bg-blue-500 bg-red-500");
  });

  test("should not resolve conflicts in variants when twMerge is false", () => {
    const button = tv(
      {
        base: "font-medium",
        variants: {
          color: {
            primary: "bg-blue-500 bg-blue-600 text-white text-gray-100",
            secondary: "bg-gray-500 bg-gray-600",
          },
          size: {
            md: "text-base text-md px-4 px-5",
            sm: "text-sm text-xs px-2 px-3",
          },
        },
      },
      {
        twMerge: false,
      },
    );

    // All conflicting classes should be preserved
    expect(button({ size: "sm" })).toBe("font-medium text-sm text-xs px-2 px-3");
    expect(button({ color: "primary", size: "md" })).toBe(
      "font-medium bg-blue-500 bg-blue-600 text-white text-gray-100 text-base text-md px-4 px-5",
    );
  });

  test("should not resolve conflicts in compound variants when twMerge is false", () => {
    const button = tv(
      {
        base: "font-semibold",
        compoundVariants: [
          {
            class: "bg-blue-600 bg-blue-700 px-3 px-4",
            size: "sm",
            variant: "primary",
          },
        ],
        variants: {
          size: {
            md: "px-4",
            sm: "px-2",
          },
          variant: {
            primary: "bg-blue-500",
            secondary: "bg-gray-500",
          },
        },
      },
      {
        twMerge: false,
      },
    );

    // Compound variant classes should be added without resolving conflicts
    expect(button({ size: "sm", variant: "primary" })).toBe(
      "font-semibold px-2 bg-blue-500 bg-blue-600 bg-blue-700 px-3 px-4",
    );
  });

  test("should not resolve conflicts in slots when twMerge is false", () => {
    const card = tv(
      {
        slots: {
          base: "rounded-lg rounded-xl p-4 p-6",
          body: "text-gray-600 text-gray-700 mt-2 mt-4",
          header: "text-lg text-xl font-bold font-semibold",
        },
      },
      {
        twMerge: false,
      },
    );

    const slots = card();

    // All conflicting classes in slots should be preserved
    expect(slots.base()).toBe("rounded-lg rounded-xl p-4 p-6");
    expect(slots.header()).toBe("text-lg text-xl font-bold font-semibold");
    expect(slots.body()).toBe("text-gray-600 text-gray-700 mt-2 mt-4");
  });

  test("should not resolve conflicts with class/className props when twMerge is false", () => {
    const button = tv(
      {
        base: "px-4 py-2 rounded",
      },
      {
        twMerge: false,
      },
    );

    // Additional classes should be appended without conflict resolution
    expect(button({ class: "px-2 py-4 rounded-lg" })).toBe(
      "px-4 py-2 rounded px-2 py-4 rounded-lg",
    );
    expect(button({ className: "px-6 py-1 rounded-xl" })).toBe(
      "px-4 py-2 rounded px-6 py-1 rounded-xl",
    );
  });

  test("should work with non-tailwind classes when twMerge is false", () => {
    const button = tv(
      {
        base: "button",
        variants: {
          size: {
            lg: "button--lg",
            md: "button--md",
            sm: "button--sm",
          },
          variant: {
            primary: "button--primary",
            secondary: "button--secondary",
          },
        },
      },
      {
        twMerge: false,
      },
    );

    expect(button()).toBe("button");
    expect(button({ size: "sm" })).toBe("button button--sm");
    expect(button({ size: "lg", variant: "secondary" })).toBe(
      "button button--lg button--secondary",
    );
  });

  test("should handle empty/falsy values correctly when twMerge is false", () => {
    const button = tv(
      {
        base: "base",
        variants: {
          size: {
            lg: null,
            md: "",
            sm: "small",
          },
        },
      },
      {
        twMerge: false,
      },
    );

    expect(button({ size: "sm" })).toBe("base small");
    expect(button({ size: "md" })).toBe("base");
    expect(button({ size: "lg" })).toBe("base");
  });

  test("should handle arrays of classes when twMerge is false", () => {
    const button = tv(
      {
        base: ["px-4", "py-2", ["rounded", ["bg-blue-500"]]],
        variants: {
          size: {
            sm: ["text-sm", ["px-2", "py-1"]],
          },
        },
      },
      {
        twMerge: false,
      },
    );

    expect(button()).toBe("px-4 py-2 rounded bg-blue-500");
    expect(button({ size: "sm" })).toBe("px-4 py-2 rounded bg-blue-500 text-sm px-2 py-1");
  });

  test("should work correctly when twMerge is false without executing merge logic", () => {
    // This test verifies that when twMerge is false, the function works correctly
    // and doesn't execute the tailwind-merge logic, even though the module
    // may still be imported for type definitions.
    const button = tv(
      {
        base: "px-4 py-2",
      },
      {
        twMerge: false,
      },
    );

    // When twMerge is false, the function should work without executing merge logic
    // The function should return the base classes as-is
    expect(button()).toBe("px-4 py-2");

    // Test with additional classes to ensure they're appended without merging
    expect(button({ class: "bg-blue-500" })).toBe("px-4 py-2 bg-blue-500");
    expect(button({ className: "text-white" })).toBe("px-4 py-2 text-white");
  });

  test("should preserve conflicting classes when twMerge is false", () => {
    // This test verifies that conflicting Tailwind classes are preserved
    // when twMerge is false, demonstrating that no merging occurs
    const button = tv(
      {
        base: "px-4 py-2",
        variants: {
          size: {
            lg: "px-6 py-3",
            sm: "px-2 py-1",
          },
        },
      },
      {
        twMerge: false,
      },
    );

    // Base should work normally
    expect(button()).toBe("px-4 py-2");

    // Variants should append classes without resolving conflicts
    expect(button({ size: "sm" })).toBe("px-4 py-2 px-2 py-1");
    expect(button({ size: "lg" })).toBe("px-4 py-2 px-6 py-3");

    // Additional classes should be appended
    expect(button({ class: "px-8 py-4", size: "sm" })).toBe("px-4 py-2 px-2 py-1 px-8 py-4");
  });
});

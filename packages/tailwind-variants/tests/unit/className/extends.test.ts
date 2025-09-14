import { tv } from "@/index";

describe("Tailwind Variants (TV) - Extends", () => {
  test("should include the extended classes", () => {
    const p = tv({
      base: "text-base text-green-500",
    });

    const h1 = tv({
      base: "text-3xl font-bold",
      extend: p,
    });

    const result = h1();
    const expectedResult = ["text-3xl", "font-bold", "text-green-500"];

    expect(result).toHaveClassName(expectedResult);
  });

  test("should include the extended classes with variants", () => {
    const p = tv({
      base: "p--base text-base text-green-500",
      variants: {
        color: {
          blue: "text-blue-500",
          red: "text-red-500",
        },
        isBig: {
          false: "text-2xl",
          true: "text-5xl",
        },
      },
    });

    const h1 = tv({
      base: "text-3xl font-bold",
      extend: p,
      variants: {
        color: {
          green: "text-green-500",
          purple: "text-purple-500",
        },
      },
    });

    const result = h1({
      color: "red",
      isBig: true,
    });

    const expectedResult = ["font-bold", "text-red-500", "text-5xl", "p--base"];

    expect(result).toHaveClassName(expectedResult);
  });

  test("should include nested the extended classes", () => {
    const base = tv({
      base: "text-base",
      variants: {
        color: {
          red: "color--red",
        },
      },
    });

    const p = tv({
      base: "text-green-500",
      extend: base,
      variants: {
        color: {
          blue: "color--blue",
          yellow: "color--yellow",
        },
      },
    });

    const h1 = tv({
      base: "text-3xl font-bold",
      extend: p,
      variants: {
        color: {
          green: "color--green",
        },
      },
    });

    const result = h1({
      color: "red",
    });

    const expectedResult = ["text-3xl", "font-bold", "text-green-500", "color--red"];

    expect(result).toHaveClassName(expectedResult);

    const result2 = h1({
      color: "blue",
    });

    const expectedResult2 = ["text-3xl", "font-bold", "text-green-500", "color--blue"];

    expect(result2).toHaveClassName(expectedResult2);

    const result3 = h1({
      color: "green",
    });

    const expectedResult3 = ["text-3xl", "font-bold", "text-green-500", "color--green"];

    expect(result3).toHaveClassName(expectedResult3);
  });

  test("should work correctly with extended compoundVariants", () => {
    const base = tv({
      base: "text-base",
      compoundVariants: [
        {
          className: "underline",
          color: "primary",
          size: "sm",
        },
      ],
      variants: {
        color: {
          primary: "text-blue-500",
          secondary: "text-purple-500",
        },
        size: {
          lg: "text-lg",
          sm: "text-sm",
        },
      },
    });

    const extended = tv({
      base: "font-bold",
      compoundVariants: [
        {
          className: "italic",
          color: "primary",
          size: "lg",
        },
      ],
      extend: base,
    });

    expect(extended({ color: "primary", size: "sm" })).toHaveClassName([
      "font-bold",
      "text-blue-500",
      "text-sm",
      "underline",
    ]);

    expect(extended({ color: "primary", size: "lg" })).toHaveClassName([
      "font-bold",
      "text-blue-500",
      "text-lg",
      "italic",
    ]);
  });

  test("should work with slots extension", () => {
    const base = tv({
      slots: {
        base: "text-base",
        content: "p-4",
      },
      variants: {
        color: {
          primary: {
            base: "text-blue-500",
            content: "bg-blue-50",
          },
        },
      },
    });

    const extended = tv({
      extend: base,
      slots: {
        footer: "border-t",
      },
      variants: {
        color: {
          primary: {
            footer: "border-blue-200",
          },
          secondary: {
            base: "text-purple-500",
            content: "bg-purple-50",
            footer: "border-purple-200",
          },
        },
      },
    });

    const { base: baseSlot, content, footer } = extended({ color: "primary" });

    expect(baseSlot()).toHaveClassName(["text-base", "text-blue-500"]);
    expect(content()).toHaveClassName(["p-4", "bg-blue-50"]);
    expect(footer()).toHaveClassName(["border-t", "border-blue-200"]);
  });

  test("should override defaultVariants correctly", () => {
    const base = tv({
      base: "text-base",
      defaultVariants: {
        color: "primary",
        size: "md",
      },
      variants: {
        color: {
          primary: "text-blue-500",
          secondary: "text-purple-500",
        },
        size: {
          md: "text-md",
          sm: "text-sm",
        },
      },
    });

    const extended = tv({
      base: "font-bold",
      defaultVariants: {
        color: "secondary",
        size: "sm",
      },
      extend: base,
    });

    expect(extended()).toHaveClassName(["font-bold", "text-purple-500", "text-sm"]);
  });

  test("should support multi-level extends", () => {
    const themeButton = tv({
      base: "font-medium",
      compoundVariants: [
        {
          className: "bg-black",
          color: "primary",
          disabled: true,
        },
      ],
      defaultVariants: {
        color: "primary",
        disabled: true,
      },
      variants: {
        color: {
          primary: "text-blue-500",
        },
        disabled: {
          true: "opacity-50",
        },
      },
    });

    const appButton = tv({ extend: themeButton });
    const button = tv({ extend: appButton });

    expect(appButton()).toHaveClassName("font-medium text-blue-500 opacity-50 bg-black");
    expect(button()).toHaveClassName("font-medium text-blue-500 opacity-50 bg-black");
  });
});

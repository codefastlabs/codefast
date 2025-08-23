import { tv } from "@/index";

describe("Tailwind Variants (TV) - Default", () => {
  test("should work with nested arrays", () => {
    const menu = tv({
      base: ["base--styles-1", ["base--styles-2", ["base--styles-3"]]],
      slots: {
        item: ["slots--item-1", ["slots--item-2", ["slots--item-3"]]],
      },
      variants: {
        color: {
          primary: {
            item: [
              "item--color--primary-1",
              ["item--color--primary-2", ["item--color--primary-3"]],
            ],
          },
        },
      },
    });

    const popover = tv({
      variants: {
        isOpen: {
          false: ["isOpen--false-1", ["isOpen--false-2", ["isOpen--false-3"]]],
          true: ["isOpen--true-1", ["isOpen--true-2", ["isOpen--true-3"]]],
        },
      },
    });

    const { base, item } = menu({ color: "primary" });

    expect(base()).toHaveClassName(["base--styles-1", "base--styles-2", "base--styles-3"]);
    expect(item()).toHaveClassName([
      "slots--item-1",
      "slots--item-2",
      "slots--item-3",
      "item--color--primary-1",
      "item--color--primary-2",
      "item--color--primary-3",
    ]);
    expect(popover({ isOpen: true })).toHaveClassName([
      "isOpen--true-1",
      "isOpen--true-2",
      "isOpen--true-3",
    ]);
    expect(popover({ isOpen: false })).toHaveClassName([
      "isOpen--false-1",
      "isOpen--false-2",
      "isOpen--false-3",
    ]);
  });

  test("should work without variants", () => {
    const h1 = tv({
      base: "text-3xl font-bold",
    });

    const expectedResult = "text-3xl font-bold";
    const result = h1();

    expect(result).toBe(expectedResult);
  });

  test("should work with variants", () => {
    const h1 = tv({
      base: "text-3xl font-bold",
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

    const result = h1({
      color: "blue",
      isBig: true,
    });

    const expectedResult = ["text-5xl", "font-bold", "text-blue-500"];

    expect(result).toHaveClassName(expectedResult);
  });

  test("should work with variantKeys", () => {
    const h1 = tv({
      base: "text-3xl font-bold",
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

    const expectedResult = ["isBig", "color"];

    expect(h1.variantKeys).toHaveClassName(expectedResult);
  });

  test("should work with compoundVariants", () => {
    const h1 = tv({
      base: "text-3xl font-bold",
      compoundVariants: [
        {
          class: "bg-red-500",
          color: "red",
          isBig: true,
        },
        {
          class: "underline",
          color: "red",
          isBig: false,
        },
      ],
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

    expect(
      h1({
        color: "red",
        isBig: true,
      }),
    ).toHaveClassName(["text-5xl", "font-bold", "text-red-500", "bg-red-500"]);

    expect(
      h1({
        color: "red",
        isBig: false,
      }),
    ).toHaveClassName(["text-2xl", "font-bold", "text-red-500", "underline"]);

    expect(
      h1({
        color: "red",
      }),
    ).toHaveClassName(["text-2xl", "font-bold", "text-red-500", "underline"]);
  });

  test("should throw error if the compoundVariants is not an array", () => {
    expect(() =>
      tv({
        base: "text-3xl font-bold",
        // @ts-expect-error
        compoundVariants: {},
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
      })(),
    ).toThrow();
  });

  test("should work with custom class & className", () => {
    const h1 = tv({
      base: "text-3xl font-bold",
    });

    const expectedResult = ["text-xl", "font-bold"];

    const result1 = h1({
      className: "text-xl",
    });

    const result2 = h1({
      class: "text-xl",
    });

    expect(result1).toHaveClassName(expectedResult);
    expect(result2).toHaveClassName(expectedResult);
  });

  test("should work without anything", () => {
    const styles = tv({});
    const expectedResult = undefined;

    expect(styles()).toBe(expectedResult);
  });

  test("should work correctly with twMerge", () => {
    const h1 = tv({
      base: "text-3xl font-bold text-blue-400 text-xl text-blue-200",
    });

    const expectedResult = ["font-bold", "text-xl", "text-blue-200"];

    expect(h1()).toHaveClassName(expectedResult);
  });

  test("should work correctly with defaultVariants", () => {
    const h1 = tv({
      base: "text-3xl",
      defaultVariants: {
        color: "blue",
      },
      variants: {
        color: {
          blue: "text-blue-500",
          red: "text-red-500",
        },
      },
    });

    expect(h1()).toHaveClassName(["text-3xl", "text-blue-500"]);
    expect(h1({ color: "red" })).toHaveClassName(["text-3xl", "text-red-500"]);
  });

  test("should work with defaultVariants -- compoundVariants", () => {
    const h1 = tv({
      base: "text-3xl",
      compoundVariants: [
        {
          class: "bg-red-500",
          color: "red",
          size: "md",
        },
      ],
      defaultVariants: {
        color: "red",
        size: "md",
      },
      variants: {
        color: {
          blue: "text-blue-500",
          red: "text-red-500",
        },
        size: {
          md: "text-lg",
          sm: "text-sm",
        },
      },
    });

    expect(h1()).toHaveClassName(["text-red-500", "text-lg", "bg-red-500"]);
    expect(h1({ color: "blue" })).toHaveClassName(["text-blue-500", "text-lg"]);
    expect(h1({ size: "sm" })).toHaveClassName(["text-red-500", "text-sm"]);
  });

  test("should work with defaultVariants -- undefined variant values", () => {
    const h1 = tv({
      base: "text-3xl",
      defaultVariants: {
        color: "red",
      },
      variants: {
        color: {
          blue: "text-blue-500",
          red: "text-red-500",
        },
      },
    });

    expect(h1({ color: undefined })).toHaveClassName(["text-3xl", "text-red-500"]);
  });

  test("should support boolean variants", () => {
    const h1 = tv({
      base: "text-3xl",
      variants: {
        bool: {
          false: "truncate",
          true: "underline",
        },
      },
    });

    expect(h1()).toHaveClassName(["text-3xl", "truncate"]);
    expect(h1({ bool: true })).toHaveClassName(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClassName(["text-3xl", "truncate"]);
    expect(h1({ bool: undefined })).toHaveClassName(["text-3xl", "truncate"]);
  });

  test("should support boolean variants -- default variants", () => {
    const h1 = tv({
      base: "text-3xl",
      defaultVariants: {
        bool: true,
      },
      variants: {
        bool: {
          false: "truncate",
          true: "underline",
        },
      },
    });

    expect(h1()).toHaveClassName(["text-3xl", "underline"]);
    expect(h1({ bool: true })).toHaveClassName(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClassName(["text-3xl", "truncate"]);
    expect(h1({ bool: undefined })).toHaveClassName(["text-3xl", "underline"]);
  });

  test("should support boolean variants -- missing false variant", () => {
    const h1 = tv({
      base: "text-3xl",
      variants: {
        bool: {
          true: "underline",
        },
      },
    });

    expect(h1()).toHaveClassName(["text-3xl"]);
    expect(h1({ bool: true })).toHaveClassName(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClassName(["text-3xl"]);
    expect(h1({ bool: undefined })).toHaveClassName(["text-3xl"]);
  });

  test("should support boolean variants -- missing false variant -- default variants", () => {
    const h1 = tv({
      base: "text-3xl",
      defaultVariants: {
        bool: true,
      },
      variants: {
        bool: {
          true: "underline",
        },
      },
    });

    expect(h1()).toHaveClassName(["text-3xl", "underline"]);
    expect(h1({ bool: true })).toHaveClassName(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClassName(["text-3xl"]);
    expect(h1({ bool: undefined })).toHaveClassName(["text-3xl", "underline"]);
  });
});

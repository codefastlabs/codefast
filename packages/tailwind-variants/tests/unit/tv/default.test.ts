import { CLASS_KEYS } from "#tests/unit/support/class-keys";
import { LANES, tvOn } from "#tests/unit/support/lanes";

describe.each(LANES)("on the %s lane", (lane) => {
  const tv = tvOn(lane);

  describe.each(CLASS_KEYS)("Tailwind Variants (TV) - Default (%s)", (key) => {
    test("should work with compoundVariants", () => {
      const h1 = tv({
        base: "text-3xl font-bold",
        compoundVariants: [
          {
            [key]: "bg-red-500",
            color: "red",
            isBig: true,
          },
          {
            [key]: "underline",
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

    test("should work with a custom class", () => {
      const h1 = tv({
        base: "text-3xl font-bold",
      });

      expect(h1({ [key]: "text-xl" })).toHaveClassName(["text-xl", "font-bold"]);
    });

    test("should work with defaultVariants -- compoundVariants", () => {
      const h1 = tv({
        base: "text-3xl",
        compoundVariants: [
          {
            [key]: "bg-red-500",
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
  });

  describe("Tailwind Variants (TV) - Default (Common)", () => {
    test("should resolve what the editor-facing types describe", () => {
      const button = tv({
        compoundVariants: [{ class: "ring", size: "lg", variant: "outline" }],
        defaultVariants: { size: "md", variant: "primary" },
        variants: {
          disabled: { false: "", true: "opacity-50" },
          size: { lg: "px-8", md: "px-4", sm: "px-2" },
          variant: { outline: "border", primary: "bg-primary" },
        },
      });
      const card = tv({
        compoundSlots: [{ class: "gap-1", size: "sm", slots: ["header", "footer"] }],
        slots: { footer: "p-6", header: "p-6", title: "text-xl" },
        variants: {
          size: { lg: { header: "p-8", title: "text-3xl" }, sm: { header: "p-3" } },
          tone: { loud: { base: "border-red-500" }, quiet: "" },
        },
      });
      const textarea = tv({
        defaultVariants: { size: "lg" },
        extend: button,
        variants: { resize: { none: "resize-none", y: "resize-y" } },
      });

      expect(button({ size: "lg", variant: "outline" })).toBe("px-8 border ring");
      // `p-6` and `p-3` share a class group, so the merge keeps the later one.
      expect(card({ size: "sm" }).header()).toBe("p-3 gap-1");
      expect(textarea({ resize: "y" })).toBe("resize-y px-8 bg-primary");
    });

    test("should work with nested arrays", () => {
      const menu = tv({
        base: ["base--styles-1", ["base--styles-2", ["base--styles-3"]]],
        slots: {
          item: ["slots--item-1", ["slots--item-2", ["slots--item-3"]]],
        },
        variants: {
          color: {
            primary: {
              item: ["item--color--primary-1", ["item--color--primary-2", ["item--color--primary-3"]]],
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
      expect(popover({ isOpen: true })).toHaveClassName(["isOpen--true-1", "isOpen--true-2", "isOpen--true-3"]);
      expect(popover({ isOpen: false })).toHaveClassName(["isOpen--false-1", "isOpen--false-2", "isOpen--false-3"]);
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

    test("should throw error if the compoundVariants is not an array", () => {
      expect(() =>
        tv({
          base: "text-3xl font-bold",
          // @ts-expect-error - Testing invalid compoundVariants type to ensure type safety
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
      ).toThrow(expect.any(Error));
    });

    test("should work without anything", () => {
      const styles = tv({});
      const expectedResult = "";

      expect(styles()).toBe(expectedResult);
    });

    test("should work correctly with twMerge", () => {
      const h1 = tv({
        base: "text-3xl text-xl font-bold text-blue-200 text-blue-400",
      });

      const expectedResult = ["font-bold", "text-blue-400", "text-xl"];

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
});

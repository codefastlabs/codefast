import { tv } from "#index";
import { CLASS_KEYS } from "#tests/unit/support/class-keys";

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

describe("Tailwind Variants (TV) - Default (class and className)", () => {
  test("should apply both keys, class first, on a call and a compound", () => {
    const h1 = tv(
      {
        base: "text-3xl",
        compoundVariants: [{ class: "c1", className: "c2", color: "red" }],
        variants: { color: { red: "text-red-500" } },
      },
      { twMerge: false },
    );

    expect(h1({ class: "x", className: "y", color: "red" })).toBe("text-3xl text-red-500 c1 c2 x y");
  });

  test("should apply both keys, class first, on a slot, a slot compound and a compound slot", () => {
    const card = tv(
      {
        compoundSlots: [{ class: "s1", className: "s2", color: "red", slots: ["item"] }],
        compoundVariants: [{ class: { item: "c1" }, className: { item: "c2" }, color: "red" }],
        slots: { base: "b", item: "i" },
        variants: { color: { red: { item: "text-red-500" } } },
      },
      { twMerge: false },
    );
    const { item } = card({ color: "red" });

    expect(item({ class: "x", className: "y" })).toBe("i text-red-500 c1 c2 s1 s2 x y");
    expect(item({ class: "x", className: "y", color: "red" })).toBe("i text-red-500 c1 c2 s1 s2 x y");
  });
});

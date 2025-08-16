import { cn, tv } from "@/index";

const COMMON_UNITS = ["small", "medium", "large"];

const twMergeConfig = {
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
};

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

    expect(base()).toHaveClass(["base--styles-1", "base--styles-2", "base--styles-3"]);
    expect(item()).toHaveClass([
      "slots--item-1",
      "slots--item-2",
      "slots--item-3",
      "item--color--primary-1",
      "item--color--primary-2",
      "item--color--primary-3",
    ]);
    expect(popover({ isOpen: true })).toHaveClass([
      "isOpen--true-1",
      "isOpen--true-2",
      "isOpen--true-3",
    ]);
    expect(popover({ isOpen: false })).toHaveClass([
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

    expect(result).toHaveClass(expectedResult);
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

    expect(h1.variantKeys).toHaveClass(expectedResult);
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
    ).toHaveClass(["text-5xl", "font-bold", "text-red-500", "bg-red-500"]);

    expect(
      h1({
        color: "red",
        isBig: false,
      }),
    ).toHaveClass(["text-2xl", "font-bold", "text-red-500", "underline"]);

    expect(
      h1({
        color: "red",
      }),
    ).toHaveClass(["text-2xl", "font-bold", "text-red-500", "underline"]);
  });

  test("should throw error if the compoundVariants is not an array", () => {
    expect(
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
      }),
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

    expect(result1).toHaveClass(expectedResult);
    expect(result2).toHaveClass(expectedResult);
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

    expect(h1()).toHaveClass(expectedResult);
  });

  test("should work correctly without twMerge", () => {
    const h1 = tv(
      {
        base: "text-3xl font-bold text-blue-400 text-xl text-blue-200",
      },
      {
        twMerge: false,
      },
    );

    const expectedResult = ["text-3xl", "font-bold", "text-blue-400", "text-xl", "text-blue-200"];

    expect(h1()).toHaveClass(expectedResult);
  });

  test("should work without defaultsVariants", () => {
    const button = tv({
      base: "button",
      compoundVariants: [
        {
          class: "button--secondary-small",
          size: "small",
          variant: "secondary",
        },
        {
          class: "button--warning-enabled",
          isDisabled: false,
          variant: "warning",
        },
        {
          class: "button--warning-disabled",
          isDisabled: true,
          variant: "warning",
        },
        {
          class: "button--warning-danger",
          variant: ["warning", "error"],
        },
        {
          class: "button--warning-danger-medium",
          size: "medium",
          variant: ["warning", "error"],
        },
      ],
      variants: {
        isDisabled: {
          false: "button--enabled",
          true: "button--disabled",
        },
        size: {
          large: "button--large",
          medium: "button--medium",
          small: "button--small",
        },
        variant: {
          error: "button--danger",
          primary: "button--primary",
          secondary: "button--secondary",
          warning: "button--warning",
        },
      },
    });

    const expectedResult = [
      "button",
      "button--secondary",
      "button--small",
      "button--enabled",
      "button--secondary-small",
    ];

    expect(button({ isDisabled: false, size: "small", variant: "secondary" })).toHaveClass(
      expectedResult,
    );
  });

  test("should work with simple variants", () => {
    const h1 = tv({
      base: "text-3xl font-bold underline",
      variants: {
        color: {
          blue: "text-blue-500",
          green: "text-green-500",
          red: "text-red-500",
        },
        isUnderline: {
          false: "no-underline",
          true: "underline",
        },
      },
    });

    const expectedResult = "text-3xl font-bold text-green-500 no-underline";

    expect(h1({ color: "green", isUnderline: false })).toBe(expectedResult);
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

    expect(h1()).toHaveClass(["text-3xl", "truncate"]);
    expect(h1({ bool: true })).toHaveClass(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClass(["text-3xl", "truncate"]);
    expect(h1({ bool: undefined })).toHaveClass(["text-3xl", "truncate"]);
  });

  test("should support false only variant", () => {
    const h1 = tv({
      base: "text-3xl",
      variants: {
        bool: {
          false: "truncate",
        },
      },
    });

    expect(h1()).toHaveClass(["text-3xl", "truncate"]);
    expect(h1({ bool: true })).toHaveClass(["text-3xl"]);
    expect(h1({ bool: false })).toHaveClass(["text-3xl", "truncate"]);
    expect(h1({ bool: undefined })).toHaveClass(["text-3xl", "truncate"]);
  });

  test("should support false only variant -- default variant", () => {
    const h1 = tv({
      base: "text-3xl",
      defaultVariants: {
        bool: true,
      },
      variants: {
        bool: {
          false: "truncate",
        },
      },
    });

    expect(h1()).toHaveClass(["text-3xl"]);
    expect(h1({ bool: true })).toHaveClass(["text-3xl"]);
    expect(h1({ bool: false })).toHaveClass(["text-3xl", "truncate"]);
    expect(h1({ bool: undefined })).toHaveClass(["text-3xl"]);
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

    expect(h1()).toHaveClass(["text-3xl", "underline"]);
    expect(h1({ bool: true })).toHaveClass(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClass(["text-3xl", "truncate"]);
    expect(h1({ bool: undefined })).toHaveClass(["text-3xl", "underline"]);
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

    expect(h1()).toHaveClass(["text-3xl"]);
    expect(h1({ bool: true })).toHaveClass(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClass(["text-3xl"]);
    expect(h1({ bool: undefined })).toHaveClass(["text-3xl"]);
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

    expect(h1()).toHaveClass(["text-3xl", "underline"]);
    expect(h1({ bool: true })).toHaveClass(["text-3xl", "underline"]);
    expect(h1({ bool: false })).toHaveClass(["text-3xl"]);
    expect(h1({ bool: undefined })).toHaveClass(["text-3xl", "underline"]);
  });
});

describe("Tailwind Variants (TV) - Slots", () => {
  test("should work with slots -- default variants", () => {
    const menu = tv({
      base: "text-3xl font-bold underline",
      defaultVariants: {
        color: "primary",
        isDisabled: false,
        size: "sm",
      },
      slots: {
        item: "text-xl",
        list: "list-none",
        title: "text-2xl",
        wrapper: "flex flex-col",
      },
      variants: {
        color: {
          primary: "color--primary",
          secondary: {
            item: "color--primary-item",
            list: "color--primary-list",
            title: "color--primary-title",
            wrapper: "color--primary-wrapper",
          },
        },
        isDisabled: {
          false: {
            item: "enabled--item",
          },
          true: {
            title: "disabled--title",
          },
        },
        size: {
          md: {
            title: "size--md-title",
          },
          sm: "size--sm",
          xs: "size--xs",
        },
      },
    });

    // with default values
    const { base, item, list, title, wrapper } = menu();

    expect(base()).toHaveClass([
      "text-3xl",
      "font-bold",
      "underline",
      "color--primary",
      "size--sm",
    ]);
    expect(title()).toHaveClass(["text-2xl"]);
    expect(item()).toHaveClass(["text-xl", "enabled--item"]);
    expect(list()).toHaveClass(["list-none"]);
    expect(wrapper()).toHaveClass(["flex", "flex-col"]);
  });

  test("should work with empty slots", () => {
    const menu = tv({
      slots: {
        base: "",
        item: "",
        list: "",
        title: "",
      },
    });

    const { base, item, list, title } = menu();

    const expectedResult = undefined;

    expect(base()).toBe(expectedResult);
    expect(title()).toBe(expectedResult);
    expect(item()).toBe(expectedResult);
    expect(list()).toBe(expectedResult);
  });

  test("should work with slots -- default variants -- custom class & className", () => {
    const menu = tv({
      defaultVariants: {
        color: "primary",
        isDisabled: false,
        size: "sm",
      },
      slots: {
        base: "text-3xl font-bold underline",
        item: "text-xl",
        list: "list-none",
        title: "text-2xl",
        wrapper: "flex flex-col",
      },
      variants: {
        color: {
          primary: {
            base: "bg-blue-500",
          },
          secondary: {
            item: "bg-purple-100",
            list: "bg-purple-200",
            title: "text-white",
            wrapper: "bg-transparent",
          },
        },
        isDisabled: {
          false: {
            item: "opacity-100",
          },
          true: {
            title: "opacity-50",
          },
        },
        size: {
          md: {
            title: "text-md",
          },
          sm: {
            base: "text-sm",
          },
          xs: {
            base: "text-xs",
          },
        },
      },
    });

    // with default values
    const { base, item, list, title, wrapper } = menu();

    // base
    expect(base({ class: "text-lg" })).toHaveClass([
      "font-bold",
      "underline",
      "bg-blue-500",
      "text-lg",
    ]);
    expect(base({ className: "text-lg" })).toHaveClass([
      "font-bold",
      "underline",
      "bg-blue-500",
      "text-lg",
    ]);
    // title
    expect(title({ class: "text-2xl" })).toHaveClass(["text-2xl"]);
    expect(title({ className: "text-2xl" })).toHaveClass(["text-2xl"]);
    // item
    expect(item({ class: "text-sm" })).toHaveClass(["text-sm", "opacity-100"]);
    expect(list({ className: "bg-blue-50" })).toHaveClass(["list-none", "bg-blue-50"]);
    // list
    expect(wrapper({ class: "flex-row" })).toHaveClass(["flex", "flex-row"]);
    expect(wrapper({ className: "flex-row" })).toHaveClass(["flex", "flex-row"]);
  });

  test("should work with slots -- custom variants", () => {
    const menu = tv({
      base: "text-3xl font-bold underline",
      defaultVariants: {
        color: "primary",
        isDisabled: false,
        size: "sm",
      },
      slots: {
        item: "text-xl",
        list: "list-none",
        title: "text-2xl",
        wrapper: "flex flex-col",
      },
      variants: {
        color: {
          primary: "color--primary",
          secondary: {
            base: "color--secondary-base",
            item: "color--secondary-item",
            list: "color--secondary-list",
            title: "color--secondary-title",
            wrapper: "color--secondary-wrapper",
          },
        },
        isDisabled: {
          false: {
            item: "enabled--item",
          },
          true: {
            title: "disabled--title",
          },
        },
        size: {
          md: {
            title: "size--md-title",
          },
          sm: "size--sm",
          xs: "size--xs",
        },
      },
    });

    // with custom props
    const { base, item, list, title, wrapper } = menu({
      color: "secondary",
      size: "md",
    });

    expect(base()).toHaveClass(["text-3xl", "font-bold", "underline", "color--secondary-base"]);
    expect(title()).toHaveClass(["text-2xl", "size--md-title", "color--secondary-title"]);
    expect(item()).toHaveClass(["text-xl", "color--secondary-item", "enabled--item"]);
    expect(list()).toHaveClass(["list-none", "color--secondary-list"]);
    expect(wrapper()).toHaveClass(["flex", "flex-col", "color--secondary-wrapper"]);
  });

  test("should work with slots -- custom variants -- custom class & className", () => {
    const menu = tv({
      defaultVariants: {
        color: "primary",
        isDisabled: false,
        size: "sm",
      },
      slots: {
        base: "text-3xl font-bold underline",
        item: "text-xl",
        list: "list-none",
        title: "text-2xl",
        wrapper: "flex flex-col",
      },
      variants: {
        color: {
          primary: {
            base: "bg-blue-500",
          },
          secondary: {
            item: "bg-purple-100",
            list: "bg-purple-200",
            title: "text-white",
            wrapper: "bg-transparent",
          },
        },
        isDisabled: {
          false: {
            item: "opacity-100",
          },
          true: {
            title: "opacity-50",
          },
        },
        size: {
          md: {
            base: "text-md",
            title: "text-md",
          },
          sm: {
            base: "text-sm",
          },
          xs: {
            base: "text-xs",
          },
        },
      },
    });

    // with default values
    const { base, item, list, title, wrapper } = menu({
      color: "secondary",
      size: "md",
    });

    // base
    expect(base({ class: "text-xl" })).toHaveClass(["text-xl", "font-bold", "underline"]);
    expect(base({ className: "text-xl" })).toHaveClass(["text-xl", "font-bold", "underline"]);
    // title
    expect(title({ class: "text-2xl" })).toHaveClass(["text-2xl", "text-white"]);
    expect(title({ className: "text-2xl" })).toHaveClass(["text-2xl", "text-white"]);
    // item
    expect(item({ class: "bg-purple-50" })).toHaveClass(["text-xl", "bg-purple-50", "opacity-100"]);
    expect(item({ className: "bg-purple-50" })).toHaveClass([
      "text-xl",
      "bg-purple-50",
      "opacity-100",
    ]);
    // list
    expect(list({ class: "bg-purple-100" })).toHaveClass(["list-none", "bg-purple-100"]);
    expect(list({ className: "bg-purple-100" })).toHaveClass(["list-none", "bg-purple-100"]);
    // wrapper
    expect(wrapper({ class: "bg-purple-900 flex-row" })).toHaveClass([
      "flex",
      "bg-purple-900",
      "flex-row",
    ]);
    expect(wrapper({ className: "bg-purple-900 flex-row" })).toHaveClass([
      "flex",
      "bg-purple-900",
      "flex-row",
    ]);
  });

  test("should work with slots and compoundVariants", () => {
    const menu = tv({
      base: "text-3xl font-bold underline",
      compoundVariants: [
        {
          class: {
            base: "compound--base",
            item: "compound--item",
            list: "compound--list",
            title: "compound--title",
            wrapper: "compound--wrapper",
          },
          color: "secondary",
          size: "md",
        },
      ],
      defaultVariants: {
        color: "primary",
        isDisabled: false,
        size: "sm",
      },
      slots: {
        item: "text-xl",
        list: "list-none",
        title: "text-2xl",
        wrapper: "flex flex-col",
      },
      variants: {
        color: {
          primary: "color--primary",
          secondary: {
            base: "color--secondary-base",
            item: "color--secondary-item",
            list: "color--secondary-list",
            title: "color--secondary-title",
            wrapper: "color--secondary-wrapper",
          },
        },
        isDisabled: {
          false: {
            item: "enabled--item",
          },
          true: {
            title: "disabled--title",
          },
        },
        size: {
          xs: "size--xs",

          md: {
            title: "size--md-title",
          },
          sm: "size--sm",
        },
      },
    });

    const { base, item, list, title, wrapper } = menu({
      color: "secondary",
      size: "md",
    });

    expect(base()).toHaveClass([
      "text-3xl",
      "font-bold",
      "underline",
      "color--secondary-base",
      "compound--base",
    ]);
    expect(title()).toHaveClass([
      "text-2xl",
      "size--md-title",
      "color--secondary-title",
      "compound--title",
    ]);
    expect(item()).toHaveClass([
      "text-xl",
      "color--secondary-item",
      "enabled--item",
      "compound--item",
    ]);
    expect(list()).toHaveClass(["list-none", "color--secondary-list", "compound--list"]);
    expect(wrapper()).toHaveClass([
      "flex",
      "flex-col",
      "color--secondary-wrapper",
      "compound--wrapper",
    ]);
  });

  test("should support slot level variant overrides", () => {
    const menu = tv({
      base: "text-3xl",
      defaultVariants: {
        color: "primary",
      },
      slots: {
        title: "text-2xl",
      },
      variants: {
        color: {
          primary: {
            base: "color--primary-base",
            title: "color--primary-title",
          },
          secondary: {
            base: "color--secondary-base",
            title: "color--secondary-title",
          },
        },
      },
    });

    const { base, title } = menu();

    expect(base()).toHaveClass(["text-3xl", "color--primary-base"]);
    expect(title()).toHaveClass(["text-2xl", "color--primary-title"]);
    expect(base({ color: "secondary" })).toHaveClass(["text-3xl", "color--secondary-base"]);
    expect(title({ color: "secondary" })).toHaveClass(["text-2xl", "color--secondary-title"]);
  });

  test("should support slot level variant overrides - compoundSlots", () => {
    const menu = tv({
      base: "text-3xl",
      compoundSlots: [
        {
          class: ["truncate"],
          color: "secondary",
          slots: ["title", "subtitle"],
        },
      ],
      defaultVariants: {
        color: "primary",
      },
      slots: {
        subtitle: "text-xl",
        title: "text-2xl",
      },
      variants: {
        color: {
          primary: {
            base: "color--primary-base",
            subtitle: "color--primary-subtitle",
            title: "color--primary-title",
          },
          secondary: {
            base: "color--secondary-base",
            subtitle: "color--secondary-subtitle",
            title: "color--secondary-title",
          },
        },
      },
    });

    const { base, subtitle, title } = menu();

    expect(base()).toHaveClass(["text-3xl", "color--primary-base"]);
    expect(title()).toHaveClass(["text-2xl", "color--primary-title"]);
    expect(subtitle()).toHaveClass(["text-xl", "color--primary-subtitle"]);
    expect(base({ color: "secondary" })).toHaveClass(["text-3xl", "color--secondary-base"]);
    expect(title({ color: "secondary" })).toHaveClass([
      "text-2xl",
      "color--secondary-title",
      "truncate",
    ]);
    expect(subtitle({ color: "secondary" })).toHaveClass([
      "text-xl",
      "color--secondary-subtitle",
      "truncate",
    ]);
  });

  test("should support slot level variant and array variants overrides - compoundSlots", () => {
    const menu = tv({
      compoundSlots: [
        {
          class: "w-7 h-7 text-xs",
          size: ["xs", "sm"],
          slots: ["base"],
        },
      ],
      slots: {
        base: "flex flex-wrap",
        cursor: ["absolute", "flex", "overflow-visible"],
      },
      variants: {
        size: {
          sm: {},
          xs: {},
        },
      },
    });

    const { base, cursor } = menu();

    expect(base()).toBe("flex flex-wrap");
    expect(base({ size: "xs" })).toBe("flex flex-wrap w-7 h-7 text-xs");
    expect(base({ size: "sm" })).toBe("flex flex-wrap w-7 h-7 text-xs");
    expect(cursor()).toBe("absolute flex overflow-visible");
  });

  test("should not override the default classes when the variant doesn't match - compoundSlots", () => {
    const tabs = tv({
      compoundSlots: [
        {
          class: ["rounded-none"],
          slots: ["tab", "tabList", "cursor"],
          variant: "underlined",
        },
      ],
      defaultVariants: {
        color: "default",
        size: "md",
        variant: "solid",
      },
      slots: {
        base: "inline-flex",
        cursor: ["absolute", "z-0", "bg-white"],
        panel: ["py-3", "px-1", "outline-none"],
        tab: ["z-0", "w-full", "px-3", "py-1", "flex", "group", "relative"],
        tabContent: ["relative", "z-10", "text-inherit", "whitespace-nowrap"],
        tabList: ["flex"],
      },
      variants: {
        color: {
          danger: {},
          default: {},
          primary: {},
          secondary: {},
          success: {},
          warning: {},
        },
        radius: {
          full: {
            cursor: "rounded-full",
            tab: "rounded-full",
            tabList: "rounded-full",
          },
          lg: {
            cursor: "rounded-md",
            tab: "rounded-md",
            tabList: "rounded-lg",
          },
          md: {
            cursor: "rounded-sm",
            tab: "rounded-sm",
            tabList: "rounded-md",
          },
          none: {
            cursor: "rounded-none",
            tab: "rounded-none",
            tabList: "rounded-none",
          },
          sm: {
            cursor: "rounded-sm",
            tab: "rounded-sm",
            tabList: "rounded-md",
          },
        },
        size: {
          lg: {
            cursor: "rounded-md",
            tab: "h-9 text-md rounded-md",
            tabList: "rounded-lg",
          },
          md: {
            cursor: "rounded-sm",
            tab: "h-8 text-sm rounded-sm",
            tabList: "rounded-md",
          },
          sm: {
            cursor: "rounded-sm",
            tab: "h-7 text-xs rounded-sm",
            tabList: "rounded-md",
          },
        },
        variant: {
          bordered: {},
          light: {},
          solid: {},
          underlined: {},
        },
      },
    });

    const { cursor, tab, tabList } = tabs();

    expect(tab()).toHaveClass([
      "z-0",
      "w-full",
      "px-3",
      "py-1",
      "h-8",
      "flex",
      "group",
      "relative",
      "text-sm",
      "rounded-sm",
    ]);
    expect(tabList()).toHaveClass(["flex", "rounded-md"]);
    expect(cursor()).toHaveClass(["absolute", "z-0", "bg-white", "rounded-sm"]);
  });

  test("should override the default classes when the variant matches - compoundSlots", () => {
    const tabs = tv({
      compoundSlots: [
        {
          class: ["rounded-none"],
          slots: ["tab", "tabList", "cursor"],
          variant: "underlined",
        },
      ],
      defaultVariants: {
        color: "default",
        size: "md",
        variant: "solid",
      },
      slots: {
        base: "inline-flex",
        cursor: ["absolute", "z-0", "bg-white"],
        panel: ["py-3", "px-1", "outline-none"],
        tab: ["z-0", "w-full", "px-3", "py-1", "flex", "group", "relative"],
        tabContent: ["relative", "z-10", "text-inherit", "whitespace-nowrap"],
        tabList: ["flex"],
      },
      variants: {
        color: {
          danger: {},
          default: {},
          primary: {},
          secondary: {},
          success: {},
          warning: {},
        },
        radius: {
          full: {
            cursor: "rounded-full",
            tab: "rounded-full",
            tabList: "rounded-full",
          },
          lg: {
            cursor: "rounded-md",
            tab: "rounded-md",
            tabList: "rounded-lg",
          },
          md: {
            cursor: "rounded-sm",
            tab: "rounded-sm",
            tabList: "rounded-md",
          },
          none: {
            cursor: "rounded-none",
            tab: "rounded-none",
            tabList: "rounded-none",
          },
          sm: {
            cursor: "rounded-sm",
            tab: "rounded-sm",
            tabList: "rounded-md",
          },
        },
        size: {
          lg: {
            cursor: "rounded-md",
            tab: "h-9 text-md rounded-md",
            tabList: "rounded-lg",
          },
          md: {
            cursor: "rounded-sm",
            tab: "h-8 text-sm rounded-sm",
            tabList: "rounded-md",
          },
          sm: {
            cursor: "rounded-sm",
            tab: "h-7 text-xs rounded-sm",
            tabList: "rounded-md",
          },
        },
        variant: {
          bordered: {},
          light: {},
          solid: {},
          underlined: {},
        },
      },
    });

    const { cursor, tab, tabList } = tabs({ variant: "underlined" });

    expect(tab()).toHaveClass([
      "z-0",
      "w-full",
      "px-3",
      "py-1",
      "h-8",
      "flex",
      "group",
      "relative",
      "text-sm",
      "rounded-none",
    ]);
    expect(tabList()).toHaveClass(["flex", "rounded-none"]);
    expect(cursor()).toHaveClass(["absolute", "z-0", "bg-white", "rounded-none"]);
  });

  test("should support slot level variant overrides - compoundVariants", () => {
    const menu = tv({
      base: "text-3xl",
      compoundVariants: [
        {
          class: {
            title: "truncate",
          },
          color: "secondary",
        },
      ],
      defaultVariants: {
        color: "primary",
      },
      slots: {
        title: "text-2xl",
      },
      variants: {
        color: {
          primary: {
            base: "color--primary-base",
            title: "color--primary-title",
          },
          secondary: {
            base: "color--secondary-base",
            title: "color--secondary-title",
          },
        },
      },
    });

    const { base, title } = menu();

    expect(base()).toHaveClass(["text-3xl", "color--primary-base"]);
    expect(title()).toHaveClass(["text-2xl", "color--primary-title"]);
    expect(base({ color: "secondary" })).toHaveClass(["text-3xl", "color--secondary-base"]);
    expect(title({ color: "secondary" })).toHaveClass([
      "text-2xl",
      "color--secondary-title",
      "truncate",
    ]);
  });
});

describe("Tailwind Variants (TV) - Compound Slots", () => {
  test("should work with compound slots -- without variants", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
      ],
      slots: {
        base: "flex flex-wrap relative gap-1 max-w-fit",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "",
        next: "",
        prev: "",
      },
    });
    // with default values
    const { base, cursor, item, next, prev } = pagination();

    expect(base()).toHaveClass(["flex", "flex-wrap", "relative", "gap-1", "max-w-fit"]);
    expect(item()).toHaveClass(["flex", "flex-wrap", "truncate"]);
    expect(prev()).toHaveClass(["flex", "flex-wrap", "truncate"]);
    expect(next()).toHaveClass(["flex", "flex-wrap", "truncate"]);
    expect(cursor()).toHaveClass(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with a single variant -- defaultVariants", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "w-7 h-7 text-xs",
          size: "xs",
          slots: ["item", "prev", "next"],
        },
      ],
      defaultVariants: {
        size: "xs",
      },
      slots: {
        base: "flex flex-wrap relative gap-1 max-w-fit",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "",
        next: "",
        prev: "",
      },
      variants: {
        size: {
          lg: {},
          md: {},
          sm: {},
          xl: {},
          xs: {},
        },
      },
    });
    // with default values
    const { base, cursor, item, next, prev } = pagination();

    expect(base()).toHaveClass(["flex", "flex-wrap", "relative", "gap-1", "max-w-fit"]);
    expect(item()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(prev()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(next()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(cursor()).toHaveClass(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with a single variant -- prop variant", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "w-7 h-7 text-xs",
          size: "xs",
          slots: ["item", "prev", "next"],
        },
      ],
      defaultVariants: {
        size: "sm",
      },
      slots: {
        base: "flex flex-wrap relative gap-1 max-w-fit",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "",
        next: "",
        prev: "",
      },
      variants: {
        size: {
          lg: {},
          md: {},
          sm: {},
          xl: {},
          xs: {},
        },
      },
    });
    // with default values
    const { base, cursor, item, next, prev } = pagination({
      size: "xs",
    });

    expect(base()).toHaveClass(["flex", "flex-wrap", "relative", "gap-1", "max-w-fit"]);
    expect(item()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(prev()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(next()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(cursor()).toHaveClass(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with a single variant -- boolean variant", () => {
    const nav = tv({
      base: "base",
      compoundSlots: [
        {
          class: "compound--item-toggle",
          slots: ["item", "toggle"],
        },
        {
          class: "compound--item-toggle--active",
          isActive: true,
          slots: ["item", "toggle"],
        },
      ],
      slots: {
        item: "slot--item",
        toggle: "slot--toggle",
      },
      variants: {
        isActive: {
          true: "",
        },
      },
    });

    let styles = nav({ isActive: false });

    expect(styles.base()).toHaveClass(["base"]);
    expect(styles.toggle()).toHaveClass(["slot--toggle", "compound--item-toggle"]);
    expect(styles.item()).toHaveClass(["slot--item", "compound--item-toggle"]);

    styles = nav({ isActive: true });

    expect(styles.base()).toHaveClass(["base"]);
    expect(styles.toggle()).toHaveClass([
      "slot--toggle",
      "compound--item-toggle",
      "compound--item-toggle--active",
    ]);
    expect(styles.item()).toHaveClass([
      "slot--item",
      "compound--item-toggle",
      "compound--item-toggle--active",
    ]);
  });

  test("should work with compound slots -- with multiple variants -- defaultVariants", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "w-7 h-7 text-xs",
          color: "primary",
          isBig: false,
          size: "xs",
          slots: ["item", "prev", "next"],
        },
      ],
      defaultVariants: {
        color: "primary",
        isBig: false,
        size: "xs",
      },
      slots: {
        base: "flex flex-wrap relative gap-1 max-w-fit",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "",
        next: "",
        prev: "",
      },
      variants: {
        color: {
          primary: {},
          secondary: {},
        },
        isBig: {
          true: {},
        },
        size: {
          lg: {},
          md: {},
          sm: {},
          xl: {},
          xs: {},
        },
      },
    });
    // with default values
    const { base, cursor, item, next, prev } = pagination();

    expect(base()).toHaveClass(["flex", "flex-wrap", "relative", "gap-1", "max-w-fit"]);
    expect(item()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(prev()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(next()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(cursor()).toHaveClass(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with multiple variants -- prop variants", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "w-7 h-7 text-xs",
          color: "primary",
          isBig: true,
          size: "xs",
          slots: ["item", "prev", "next"],
        },
      ],
      defaultVariants: {
        color: "secondary",
        isBig: false,
        size: "sm",
      },
      slots: {
        base: "flex flex-wrap relative gap-1 max-w-fit",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "",
        next: "",
        prev: "",
      },
      variants: {
        color: {
          primary: {},
          secondary: {},
        },
        isBig: {
          true: {},
        },
        size: {
          lg: {},
          md: {},
          sm: {},
          xl: {},
          xs: {},
        },
      },
    });
    // with default values
    const { base, cursor, item, next, prev } = pagination({
      color: "primary",
      isBig: true,
      size: "xs",
    });

    expect(base()).toHaveClass(["flex", "flex-wrap", "relative", "gap-1", "max-w-fit"]);
    expect(item()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(prev()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(next()).toHaveClass(["flex", "flex-wrap", "truncate", "w-7", "h-7", "text-xs"]);
    expect(cursor()).toHaveClass(["absolute", "flex", "overflow-visible"]);
  });
});

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

    expect(result).toHaveClass(expectedResult);
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

    expect(result).toHaveClass(expectedResult);
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
      // @ts-expect-error TODO: should have the grand parent variants
      color: "red",
    });

    const expectedResult = ["text-3xl", "font-bold", "text-green-500", "color--red"];

    expect(result).toHaveClass(expectedResult);

    const result2 = h1({
      color: "blue",
    });

    const expectedResult2 = ["text-3xl", "font-bold", "text-green-500", "color--blue"];

    expect(result2).toHaveClass(expectedResult2);

    const result3 = h1({
      color: "green",
    });

    const expectedResult3 = ["text-3xl", "font-bold", "text-green-500", "color--green"];

    expect(result3).toHaveClass(expectedResult3);
  });

  test("should override the extended classes with variants", () => {
    const p = tv({
      base: "text-base text-green-500",
      variants: {
        color: {
          blue: "text-blue-500",
          red: "text-red-500 bg-red-100 tracking-normal",
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
          red: ["text-red-200", "bg-red-200"],
        },
      },
    });

    const result = h1({
      color: "red",
      isBig: true,
    });

    const expectedResult = [
      "font-bold",
      "text-red-200",
      "bg-red-200",
      "tracking-normal",
      "text-5xl",
    ];

    expect(result).toHaveClass(expectedResult);
  });

  test("should include the extended classes with defaultVariants - parent", () => {
    const p = tv({
      base: "text-base text-green-500",
      defaultVariants: {
        color: "red",
        isBig: true,
      },
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

    const result = h1();

    const expectedResult = ["font-bold", "text-red-500", "text-5xl"];

    expect(result).toHaveClass(expectedResult);
  });

  test("should include the extended classes with defaultVariants - children", () => {
    const p = tv({
      base: "text-base text-green-500",
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
      defaultVariants: {
        color: "red",
        isBig: true,
      },
      extend: p,
      variants: {
        color: {
          green: "text-green-500",
          purple: "text-purple-500",
        },
      },
    });

    const result = h1();

    const expectedResult = ["font-bold", "text-red-500", "text-5xl"];

    expect(result).toHaveClass(expectedResult);
  });

  test("should override the extended defaultVariants - children", () => {
    const p = tv({
      base: "text-base text-green-500",
      defaultVariants: {
        color: "blue",
        isBig: true,
      },
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
      defaultVariants: {
        color: "red",
        isBig: false,
      },
      extend: p,
      variants: {
        color: {
          green: "text-green-500",
          purple: "text-purple-500",
        },
      },
    });

    const result = h1();

    const expectedResult = ["font-bold", "text-red-500", "text-2xl"];

    expect(result).toHaveClass(expectedResult);
  });

  test("should include the extended classes with compoundVariants - parent", () => {
    const p = tv({
      base: "text-base text-green-500",
      compoundVariants: [
        {
          class: "bg-red-500",
          color: "red",
          isBig: true,
        },
      ],
      defaultVariants: {
        color: "red",
        isBig: true,
      },
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

    const result = h1();

    const expectedResult = ["font-bold", "text-red-500", "bg-red-500", "text-5xl"];

    expect(result).toHaveClass(expectedResult);
  });

  test("should include the extended classes with compoundVariants - children", () => {
    const p = tv({
      base: "text-base text-green-500",
      defaultVariants: {
        color: "red",
        isBig: true,
      },
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
      compoundVariants: [
        {
          class: "bg-green-500",
          color: "green",
          isBig: true,
        },
      ],
      defaultVariants: {
        color: "green",
      },
      extend: p,
      variants: {
        color: {
          green: "text-green-500",
          purple: "text-purple-500",
        },
      },
    });

    const result = h1();

    const expectedResult = ["font-bold", "bg-green-500", "text-green-500", "text-5xl"];

    expect(result).toHaveClass(expectedResult);
  });

  test("should override the extended classes with compoundVariants - children", () => {
    const p = tv({
      base: "text-base text-green-500",
      compoundVariants: [
        {
          class: "bg-red-500",
          color: "red",
          isBig: true,
        },
      ],
      defaultVariants: {
        color: "red",
        isBig: true,
      },
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
      compoundVariants: [
        {
          class: "bg-red-600",
          color: "red",
          isBig: true,
        },
      ],
      extend: p,
      variants: {
        color: {
          green: "text-green-500",
          purple: "text-purple-500",
        },
      },
    });

    const result = h1();

    const expectedResult = ["font-bold", "bg-red-600", "text-red-500", "text-5xl"];

    expect(result).toHaveClass(expectedResult);
  });

  test("should override the extended classes with variants and compoundVariants, using array", () => {
    const p = tv({
      base: "text-base text-green-500",
      compoundVariants: [
        {
          class: "bg-red-500",
          color: "red",
          isBig: true,
        },
        {
          class: ["bg-red-500"],
          color: "red",
          isBig: false,
        },
        {
          class: ["bg-blue-500"],
          color: "blue",
          isBig: true,
        },
        {
          class: "bg-blue-500",
          color: "blue",
          isBig: false,
        },
      ],
      defaultVariants: {
        color: "red",
        isBig: true,
      },
      variants: {
        color: {
          blue: "text-blue-500",
          red: ["text-red-500 bg-red-100", "tracking-normal"],
        },
        isBig: {
          false: ["text-2xl"],
          true: "text-5xl",
        },
      },
    });

    const h1 = tv({
      base: "text-3xl font-bold",
      compoundVariants: [
        {
          class: "bg-red-600",
          color: "red",
          isBig: true,
        },
        {
          class: "bg-red-600",
          color: "red",
          isBig: false,
        },
        {
          class: ["bg-blue-600"],
          color: "blue",
          isBig: true,
        },
        {
          class: ["bg-blue-600"],
          color: "blue",
          isBig: false,
        },
      ],
      extend: p,
      variants: {
        color: {
          green: ["text-green-500"],
          red: ["text-red-200", "bg-red-200"],
        },
        isBig: {
          false: "text-3xl",
          true: "text-7xl",
        },
      },
    });

    expect(h1({ color: "red", isBig: true })).toHaveClass([
      "font-bold",
      "text-red-200",
      "bg-red-600",
      "tracking-normal",
      "text-7xl",
    ]);

    expect(h1({ color: "blue", isBig: true })).toHaveClass([
      "font-bold",
      "text-blue-500",
      "bg-blue-600",
      "text-7xl",
    ]);

    expect(h1({ color: "red", isBig: false })).toHaveClass([
      "font-bold",
      "text-red-200",
      "bg-red-600",
      "tracking-normal",
      "text-3xl",
    ]);

    expect(h1({ color: "blue", isBig: false })).toHaveClass([
      "font-bold",
      "text-blue-500",
      "bg-blue-600",
      "text-3xl",
    ]);
  });

  test("should include the extended slots w/o children slots", () => {
    const menuBase = tv({
      base: "base--menuBase",
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
    });

    const menu = tv({
      base: "base--menu",
      extend: menuBase,
    });

    // with default values
    const { base, item, list, title, wrapper } = menu();

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass(["title--menuBase"]);
    expect(item()).toHaveClass(["item--menuBase"]);
    expect(list()).toHaveClass(["list--menuBase"]);
    expect(wrapper()).toHaveClass(["wrapper--menuBase"]);
  });

  test("should include the extended slots w/ variants -- parent", () => {
    const menuBase = tv({
      base: "base--menuBase",
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
      variants: {
        isBig: {
          false: "isBig--menu",
          true: {
            item: "item--isBig--menu",
            list: "list--isBig--menu",
            title: "title--isBig--menu",
            wrapper: "wrapper--isBig--menu",
          },
        },
      },
    });

    const menu = tv({
      base: "base--menu",
      extend: menuBase,
    });

    const { base, item, list, title, wrapper } = menu({
      isBig: true,
    });

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass(["title--menuBase", "title--isBig--menu"]);
    expect(item()).toHaveClass(["item--menuBase", "item--isBig--menu"]);
    expect(list()).toHaveClass(["list--menuBase", "list--isBig--menu"]);
    expect(wrapper()).toHaveClass(["wrapper--menuBase", "wrapper--isBig--menu"]);
  });

  test("should include the extended slots w/ variants -- children", () => {
    const menuBase = tv({
      base: "base--menuBase",
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
    });

    const menu = tv({
      base: "base--menu",
      extend: menuBase,
      variants: {
        isBig: {
          false: "isBig--menu",
          true: {
            item: "item--isBig--menu",
            list: "list--isBig--menu",
            title: "title--isBig--menu",
            wrapper: "wrapper--isBig--menu",
          },
        },
      },
    });

    const { base, item, list, title, wrapper } = menu({
      isBig: true,
    });

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass(["title--menuBase", "title--isBig--menu"]);
    expect(item()).toHaveClass(["item--menuBase", "item--isBig--menu"]);
    expect(list()).toHaveClass(["list--menuBase", "list--isBig--menu"]);
    expect(wrapper()).toHaveClass(["wrapper--menuBase", "wrapper--isBig--menu"]);
  });

  test("should include the extended slots w/ children slots (same names)", () => {
    const menuBase = tv({
      base: "base--menuBase",
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
    });

    const menu = tv({
      base: "base--menu",
      extend: menuBase,
      slots: {
        item: "item--menu",
        list: "list--menu",
        title: "title--menu",
        wrapper: "wrapper--menu",
      },
    });

    // with default values
    let res = menu();

    expect(res.base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(res.title()).toHaveClass(["title--menuBase", "title--menu"]);
    expect(res.item()).toHaveClass(["item--menuBase", "item--menu"]);
    expect(res.list()).toHaveClass(["list--menuBase", "list--menu"]);
    expect(res.wrapper()).toHaveClass(["wrapper--menuBase", "wrapper--menu"]);

    res = menuBase();

    expect(res.base()).toBe("base--menuBase");
    expect(res.title()).toBe("title--menuBase");
    expect(res.item()).toBe("item--menuBase");
    expect(res.list()).toBe("list--menuBase");
    expect(res.wrapper()).toBe("wrapper--menuBase");
  });

  test("should include the extended slots w/ children slots (additional)", () => {
    const menuBase = tv({
      base: "base--menuBase",
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
    });

    const menu = tv({
      base: "base--menu",
      extend: menuBase,
      slots: {
        extra: "extra--menu",
        item: "item--menu",
        list: "list--menu",
        title: "title--menu",
        wrapper: "wrapper--menu",
      },
    });

    // with default values
    const { base, extra, item, list, title, wrapper } = menu();

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass(["title--menuBase", "title--menu"]);
    expect(item()).toHaveClass(["item--menuBase", "item--menu"]);
    expect(list()).toHaveClass(["list--menuBase", "list--menu"]);
    expect(wrapper()).toHaveClass(["wrapper--menuBase", "wrapper--menu"]);
    expect(extra()).toHaveClass(["extra--menu"]);
  });

  test("should include the extended variants w/slots and defaultVariants -- parent", () => {
    const menuBase = tv({
      base: "base--menuBase",
      defaultVariants: {
        isBig: true,
      },
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
      variants: {
        isBig: {
          true: {
            item: "isBig--item--menuBase",
            list: "isBig--list--menuBase",
            title: "isBig--title--menuBase",
            wrapper: "isBig--wrapper--menuBase",
          },
        },
      },
    });

    const menu = tv({
      base: "base--menu",
      extend: menuBase,
      slots: {
        item: "item--menu",
        list: "list--menu",
        title: "title--menu",
        wrapper: "wrapper--menu",
      },
    });

    // with default values
    const { base, item, list, title, wrapper } = menu();

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass(["title--menuBase", "title--menu", "isBig--title--menuBase"]);
    expect(item()).toHaveClass(["item--menuBase", "item--menu", "isBig--item--menuBase"]);
    expect(list()).toHaveClass(["list--menuBase", "list--menu", "isBig--list--menuBase"]);
    expect(wrapper()).toHaveClass([
      "wrapper--menuBase",
      "wrapper--menu",
      "isBig--wrapper--menuBase",
    ]);
  });

  test("should include the extended variants w/slots and defaultVariants -- children", () => {
    const menuBase = tv({
      base: "base--menuBase",
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
      variants: {
        isBig: {
          true: {
            item: "isBig--item--menuBase",
            list: "isBig--list--menuBase",
            title: "isBig--title--menuBase",
            wrapper: "isBig--wrapper--menuBase",
          },
        },
      },
    });

    const menu = tv({
      base: "base--menu",
      defaultVariants: {
        isBig: true,
      },
      extend: menuBase,
      slots: {
        item: "item--menu",
        list: "list--menu",
        title: "title--menu",
        wrapper: "wrapper--menu",
      },
    });

    // with default values
    const { base, item, list, title, wrapper } = menu();

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass(["title--menuBase", "title--menu", "isBig--title--menuBase"]);
    expect(item()).toHaveClass(["item--menuBase", "item--menu", "isBig--item--menuBase"]);
    expect(list()).toHaveClass(["list--menuBase", "list--menu", "isBig--list--menuBase"]);
    expect(wrapper()).toHaveClass([
      "wrapper--menuBase",
      "wrapper--menu",
      "isBig--wrapper--menuBase",
    ]);
  });

  test("should include the extended variants w/slots and compoundVariants -- parent", () => {
    const menuBase = tv({
      base: "base--menuBase",
      compoundVariants: [
        {
          class: {
            item: "color--red--isBig--item--menuBase",
            list: "color--red--isBig--list--menuBase",
            title: "color--red--isBig--title--menuBase",
            wrapper: "color--red--isBig--wrapper--menuBase",
          },
          color: "red",
          isBig: true,
        },
      ],
      defaultVariants: {
        color: "blue",
        isBig: true,
      },
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
      variants: {
        color: {
          blue: {
            item: "color--blue--item--menuBase",
            list: "color--blue--list--menuBase",
            title: "color--blue--title--menuBase",
            wrapper: "color--blue--wrapper--menuBase",
          },
          red: {
            item: "color--red--item--menuBase",
            list: "color--red--list--menuBase",
            title: "color--red--title--menuBase",
            wrapper: "color--red--wrapper--menuBase",
          },
        },
        isBig: {
          true: {
            item: "isBig--item--menuBase",
            list: "isBig--list--menuBase",
            title: "isBig--title--menuBase",
            wrapper: "isBig--wrapper--menuBase",
          },
        },
      },
    });

    const menu = tv({
      base: "base--menu",
      extend: menuBase,
      slots: {
        item: "item--menu",
        list: "list--menu",
        title: "title--menu",
        wrapper: "wrapper--menu",
      },
    });

    // with default values
    const { base, item, list, title, wrapper } = menu({
      color: "red",
    });

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass([
      "title--menuBase",
      "title--menu",
      "isBig--title--menuBase",
      "color--red--title--menuBase",
      "color--red--isBig--title--menuBase",
    ]);
    expect(item()).toHaveClass([
      "item--menuBase",
      "item--menu",
      "isBig--item--menuBase",
      "color--red--item--menuBase",
      "color--red--isBig--item--menuBase",
    ]);
    expect(list()).toHaveClass([
      "list--menuBase",
      "list--menu",
      "isBig--list--menuBase",
      "color--red--list--menuBase",
      "color--red--isBig--list--menuBase",
    ]);
    expect(wrapper()).toHaveClass([
      "wrapper--menuBase",
      "wrapper--menu",
      "isBig--wrapper--menuBase",
      "color--red--wrapper--menuBase",
      "color--red--isBig--wrapper--menuBase",
    ]);
  });

  test("should include the extended variants w/slots and compoundVariants -- children", () => {
    const menuBase = tv({
      base: "base--menuBase",
      defaultVariants: {
        color: "blue",
        isBig: true,
      },
      slots: {
        item: "item--menuBase",
        list: "list--menuBase",
        title: "title--menuBase",
        wrapper: "wrapper--menuBase",
      },
      variants: {
        color: {
          blue: {
            item: "color--blue--item--menuBase",
            list: "color--blue--list--menuBase",
            title: "color--blue--title--menuBase",
            wrapper: "color--blue--wrapper--menuBase",
          },
          red: {
            item: "color--red--item--menuBase",
            list: "color--red--list--menuBase",
            title: "color--red--title--menuBase",
            wrapper: "color--red--wrapper--menuBase",
          },
        },
        isBig: {
          true: {
            item: "isBig--item--menuBase",
            list: "isBig--list--menuBase",
            title: "isBig--title--menuBase",
            wrapper: "isBig--wrapper--menuBase",
          },
        },
      },
    });

    const menu = tv({
      base: "base--menu",
      compoundVariants: [
        {
          class: {
            item: "color--red--isBig--item--menuBase",
            list: "color--red--isBig--list--menuBase",
            title: "color--red--isBig--title--menuBase",
            wrapper: "color--red--isBig--wrapper--menuBase",
          },
          color: "red",
          isBig: true,
        },
      ],
      extend: menuBase,
      slots: {
        item: "item--menu",
        list: "list--menu",
        title: "title--menu",
        wrapper: "wrapper--menu",
      },
    });

    // with default values
    const { base, item, list, title, wrapper } = menu({
      color: "red",
    });

    expect(base()).toHaveClass(["base--menuBase", "base--menu"]);
    expect(title()).toHaveClass([
      "title--menuBase",
      "title--menu",
      "isBig--title--menuBase",
      "color--red--title--menuBase",
      "color--red--isBig--title--menuBase",
    ]);
    expect(item()).toHaveClass([
      "item--menuBase",
      "item--menu",
      "isBig--item--menuBase",
      "color--red--item--menuBase",
      "color--red--isBig--item--menuBase",
    ]);
    expect(list()).toHaveClass([
      "list--menuBase",
      "list--menu",
      "isBig--list--menuBase",
      "color--red--list--menuBase",
      "color--red--isBig--list--menuBase",
    ]);
    expect(wrapper()).toHaveClass([
      "wrapper--menuBase",
      "wrapper--menu",
      "isBig--wrapper--menuBase",
      "color--red--wrapper--menuBase",
      "color--red--isBig--wrapper--menuBase",
    ]);
  });

  test("should work with cn", () => {
    const tvResult = ["w-fit", "h-fit"];
    const custom = ["w-full"];

    const resultWithoutMerge = cn([...tvResult, ...custom])({ twMerge: false });
    const resultWithMerge = cn([...tvResult, ...custom])({ twMerge: true });
    const emptyResultWithoutMerge = cn([[]].flat())({ twMerge: false });
    const emptyResultWithMerge = cn([[]].flat())({ twMerge: true });

    expect(resultWithoutMerge).toBe("w-fit h-fit w-full");
    expect(resultWithMerge).toBe("h-fit w-full");
    expect(emptyResultWithoutMerge).toBeUndefined();
    expect(emptyResultWithMerge).toBeUndefined();
  });

  test("should support parent w/slots when base does not have slots", () => {
    const menuBase = tv({ base: "menuBase" });
    const menu = tv({
      base: "menu",
      extend: menuBase,
      slots: {
        title: "title",
      },
    });

    const { base, title } = menu();

    expect(base()).toHaveClass(["menuBase", "menu"]);
    expect(title()).toHaveClass(["title"]);
  });

  test("should support multi-level extends", () => {
    const themeButton = tv({
      base: "font-medium",
      compoundVariants: [
        {
          class: "bg-black",
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

    expect(appButton()).toHaveClass("font-medium text-blue-500 opacity-50 bg-black");
    expect(button()).toHaveClass("font-medium text-blue-500 opacity-50 bg-black");
  });
});

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

    expect(result).toHaveClass(["text-base", "text-red-500"]);
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

    expect(result).toHaveClass(["text-medium", "text-blue-500", "w-unit-4"]);
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

    expect(result).toHaveClass(["text-medium", "text-blue-500", "w-unit-4"]);
  });
});

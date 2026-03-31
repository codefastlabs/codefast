import { tv } from "#index";

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
        base: "relative flex max-w-fit flex-wrap gap-1",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "rounded px-2 py-1",
        next: "rounded px-2 py-1",
        prev: "rounded px-2 py-1",
      },
    });
    const { base, cursor, item, next, prev } = pagination();

    expect(base()).toHaveClassName(["flex", "flex-wrap", "relative", "gap-1", "max-w-fit"]);
    expect(item()).toHaveClassName(["px-2", "py-1", "rounded", "flex", "flex-wrap", "truncate"]);
    expect(prev()).toHaveClassName(["px-2", "py-1", "rounded", "flex", "flex-wrap", "truncate"]);
    expect(next()).toHaveClassName(["px-2", "py-1", "rounded", "flex", "flex-wrap", "truncate"]);
    expect(cursor()).toHaveClassName(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with a single variant -- defaultVariants", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "h-7 w-7 text-xs",
          size: "xs",
          slots: ["item", "prev", "next"],
        },
      ],
      defaultVariants: {
        size: "xs",
      },
      slots: {
        base: "relative flex max-w-fit flex-wrap gap-1",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "rounded px-2 py-1",
        next: "rounded px-2 py-1",
        prev: "rounded px-2 py-1",
      },
      variants: {
        size: {
          lg: "text-lg",
          md: "text-md",
          sm: "text-sm",
          xl: "text-xl",
          xs: "text-xs",
        },
      },
    });
    const { base, cursor, item, next, prev } = pagination();

    expect(base()).toHaveClassName([
      "flex",
      "flex-wrap",
      "relative",
      "gap-1",
      "max-w-fit",
      "text-xs",
    ]);
    expect(item()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(prev()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(next()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(cursor()).toHaveClassName(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with a single variant -- prop variant", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "h-7 w-7 text-xs",
          size: "xs",
          slots: ["item", "prev", "next"],
        },
      ],
      defaultVariants: {
        size: "sm",
      },
      slots: {
        base: "relative flex max-w-fit flex-wrap gap-1",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "rounded px-2 py-1",
        next: "rounded px-2 py-1",
        prev: "rounded px-2 py-1",
      },
      variants: {
        size: {
          lg: "text-lg",
          md: "text-md",
          sm: "text-sm",
          xl: "text-xl",
          xs: "text-xs",
        },
      },
    });
    const { base, cursor, item, next, prev } = pagination({
      size: "xs",
    });

    expect(base()).toHaveClassName([
      "flex",
      "flex-wrap",
      "relative",
      "gap-1",
      "max-w-fit",
      "text-xs",
    ]);
    expect(item()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(prev()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(next()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(cursor()).toHaveClassName(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with multiple variants -- defaultVariants", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "h-7 w-7 text-xs",
          color: "primary",
          isBig: true,
          size: "xs",
          slots: ["item", "prev", "next"],
        },
      ],
      defaultVariants: {
        color: "primary",
        isBig: true,
        size: "xs",
      },
      slots: {
        base: "relative flex max-w-fit flex-wrap gap-1",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "rounded px-2 py-1",
        next: "rounded px-2 py-1",
        prev: "rounded px-2 py-1",
      },
      variants: {
        color: {
          primary: "text-blue-500",
          secondary: "text-gray-500",
        },
        isBig: {
          true: "font-bold",
        },
        size: {
          lg: "text-lg",
          md: "text-md",
          sm: "text-sm",
          xl: "text-xl",
          xs: "text-xs",
        },
      },
    });
    const { base, cursor, item, next, prev } = pagination();

    expect(base()).toHaveClassName([
      "flex",
      "flex-wrap",
      "relative",
      "gap-1",
      "max-w-fit",
      "text-blue-500",
      "font-bold",
      "text-xs",
    ]);
    expect(item()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(prev()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(next()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(cursor()).toHaveClassName(["absolute", "flex", "overflow-visible"]);
  });

  test("should work with compound slots -- with multiple variants -- prop variants", () => {
    const pagination = tv({
      compoundSlots: [
        {
          class: ["flex", "flex-wrap", "truncate"],
          slots: ["item", "prev", "next"],
        },
        {
          class: "h-7 w-7 text-xs",
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
        base: "relative flex max-w-fit flex-wrap gap-1",
        cursor: ["absolute", "flex", "overflow-visible"],
        item: "rounded px-2 py-1",
        next: "rounded px-2 py-1",
        prev: "rounded px-2 py-1",
      },
      variants: {
        color: {
          primary: "text-blue-500",
          secondary: "text-gray-500",
        },
        isBig: {
          true: "font-bold",
        },
        size: {
          lg: "text-lg",
          md: "text-md",
          sm: "text-sm",
          xl: "text-xl",
          xs: "text-xs",
        },
      },
    });
    const { base, cursor, item, next, prev } = pagination({
      color: "primary",
      isBig: true,
      size: "xs",
    });

    expect(base()).toHaveClassName([
      "flex",
      "flex-wrap",
      "relative",
      "gap-1",
      "max-w-fit",
      "text-blue-500",
      "font-bold",
      "text-xs",
    ]);
    expect(item()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(prev()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(next()).toHaveClassName([
      "px-2",
      "py-1",
      "rounded",
      "flex",
      "flex-wrap",
      "truncate",
      "w-7",
      "h-7",
      "text-xs",
    ]);
    expect(cursor()).toHaveClassName(["absolute", "flex", "overflow-visible"]);
  });
});

import { tv } from "#/index";

/**
 * The other type tests prove what compiles. These prove what must not, because every gap they cover
 * failed the same way: a typo in a configuration is accepted, resolves to nothing, and says nothing.
 *
 * `@ts-expect-error` is the assertion — the compiler fails the build if a line stops erroring, so a
 * type loosened by accident is caught the same way a tightened one is.
 */
describe("Configuration Authoring Type Safety", () => {
  test("rejects a defaultVariants key that names no variant", () => {
    // @ts-expect-error — `colour` is not a declared variant
    tv({
      defaultVariants: { colour: "red" },
      variants: { size: { sm: "px-2" } },
    });

    tv({
      // @ts-expect-error — `size` is declared, `"enormous"` is not one of its values
      defaultVariants: { size: "enormous" },
      variants: { size: { sm: "px-2" } },
    });

    // Declaring one correctly must keep compiling, and still apply.
    expect(tv({ defaultVariants: { size: "sm" }, variants: { size: { sm: "px-2" } } })()).toBe("px-2");
  });

  test("rejects a compoundVariants key that names no variant", () => {
    // @ts-expect-error — `colour` is not a declared variant
    tv({
      compoundVariants: [{ class: "ring", colour: "red" }],
      variants: { size: { sm: "px-2" } },
    });

    tv({
      // @ts-expect-error — `"enormous"` is not one of `size`'s values
      compoundVariants: [{ class: "ring", size: "enormous" }],
      variants: { size: { sm: "px-2" } },
    });

    // A compound naming declared variants, including a list and a boolean, must keep compiling.
    const chip = tv({
      compoundVariants: [
        { class: "ring", size: "sm" },
        { class: "italic", size: ["lg", "sm"] },
        { class: "uppercase", loud: true },
      ],
      variants: { loud: { true: "font-bold" }, size: { lg: "px-8", sm: "px-2" } },
    });

    expect(chip({ loud: true, size: "sm" })).toBe("font-bold px-2 ring italic uppercase");
  });

  test("rejects a variant class map that names no slot", () => {
    // @ts-expect-error — `notASlot` is not a declared slot
    tv({
      slots: { base: "rounded", title: "text-xl" },
      variants: { size: { sm: { notASlot: "p-3" } } },
    });

    // Naming declared slots must keep compiling, as must a plain string value.
    const card = tv({
      slots: { base: "rounded", title: "text-xl" },
      variants: { size: { lg: "", sm: { base: "max-w-sm", title: "text-lg" } } },
    });

    expect(card({ size: "sm" }).title()).toBe("text-lg");
  });

  test("rejects a compoundSlots entry that names no slot", () => {
    tv({
      // @ts-expect-error — `notASlot` is not a declared slot
      compoundSlots: [{ class: "gap-1", slots: ["notASlot"] }],
      slots: { base: "rounded" },
    });

    const stack = tv({
      compoundSlots: [{ class: "gap-1", slots: ["base"] }],
      slots: { base: "rounded" },
    });

    expect(stack().base()).toBe("rounded gap-1");
  });

  test("keeps a configuration without slots free to use clsx object values", () => {
    // With no slots declared an object is clsx conditions, not slot names, and must stay allowed —
    // asserted at runtime too, because that is the behaviour the type is protecting.
    const box = tv({
      variants: { size: { sm: { "px-2": true, "px-8": false } } },
    });

    expect(box({ size: "sm" })).toBe("px-2");
  });
});

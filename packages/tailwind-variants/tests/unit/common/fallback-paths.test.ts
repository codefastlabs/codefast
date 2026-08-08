import { cx, tv } from "#/index";

/**
 * The paths taken when the usual assumptions do not hold: a selection space too large to encode, a
 * resolution that produces nothing, a configuration naming something it never declared.
 *
 * These are where a cache diverges from the resolver it is meant to stand in for, so each asserts
 * the answer rather than merely that nothing threw.
 */
describe("Fallback Paths", () => {
  test("resolves a selection space too large to address with one safe integer", () => {
    // Twelve variants of twenty values overflow the mixed-radix key, so the encoder declines and
    // every call takes the plan walk. The answers must not change because of that.
    const variants: Record<string, Record<string, string>> = {};

    for (let group = 0; group < 12; group++) {
      const values: Record<string, string> = {};

      for (let value = 0; value < 20; value++) {
        values[`v${String(value)}`] = `g${String(group)}v${String(value)}`;
      }

      variants[`g${String(group)}`] = values;
    }

    const wide = tv({ base: "block", variants } as never) as (props?: Record<string, unknown>) => string | undefined;
    const uncached = tv({ base: "block", variants } as never, { cacheResolutions: false }) as (
      props?: Record<string, unknown>,
    ) => string | undefined;

    for (const selection of [{}, { g0: "v3" }, { g0: "v3", g11: "v19" }, { g5: "nope" }]) {
      expect(wide(selection)).toBe(uncached(selection));
    }

    expect(wide({ g0: "v3", g11: "v19" })).toBe("block g0v3 g11v19");
  });

  test("keeps encoding once one axis exhausts its capacity", () => {
    // A compound makes `tone` a raw-value axis, which admits a fixed number of distinct values
    // before a call stops being encodable — and must keep resolving after that.
    const chip = tv({
      base: "block",
      compoundVariants: [{ class: "ring", tone: "t1" }],
      variants: { tone: { t1: "p-1" } },
    });

    for (let index = 0; index < 40; index++) {
      expect(chip({ tone: `t${String(index)}` } as never)).toBe(index === 1 ? "block p-1 ring" : "block");
    }
  });

  test("falls back to clsx when an argument is not a string", () => {
    expect(cx("a", ["b", "c"])).toBe("a b c");
    expect(cx("a", { b: true, c: false })).toBe("a b");
    // A falsy non-string contributes nothing and must not send the whole call through clsx.
    expect(cx("a", null, "b")).toBe("a b");
  });

  test("declines a selection space that overflows through compound-read axes", () => {
    // A compound makes each variant a raw-value axis, whose radix is fixed — enough of them
    // overflow the key just as a wide group does, on the other call site of the same guard.
    const variants: Record<string, Record<string, string>> = {};
    const compound: Record<string, string> = { class: "ring" };

    for (let group = 0; group < 14; group++) {
      variants[`g${String(group)}`] = { on: `g${String(group)}on` };
      compound[`g${String(group)}`] = "on";
    }

    const wide = tv({ base: "block", compoundVariants: [compound], variants } as never) as (
      props?: Record<string, unknown>,
    ) => string | undefined;
    const uncached = tv({ base: "block", compoundVariants: [compound], variants } as never, {
      cacheResolutions: false,
    }) as (props?: Record<string, unknown>) => string | undefined;

    for (const selection of [{}, { g0: "on" }, { g0: "on", g13: "on" }]) {
      expect(wide(selection)).toBe(uncached(selection));
    }

    expect(wide({ g0: "on" })).toBe("block g0on");
  });

  test("declines when the axis that overflows is one no variant declares", () => {
    // A compound may test a name the configuration never declares; that name still needs an axis,
    // and it is the one that tips this key past what a safe integer holds.
    const variants: Record<string, Record<string, string>> = {};

    for (let group = 0; group < 12; group++) {
      const values: Record<string, string> = {};

      for (let value = 0; value < 18; value++) {
        values[`v${String(value)}`] = `g${String(group)}v${String(value)}`;
      }

      variants[`g${String(group)}`] = values;
    }

    const config = { base: "block", compoundVariants: [{ class: "ring", ghost: true }], variants };
    const wide = tv(config as never) as (props?: Record<string, unknown>) => string | undefined;
    const uncached = tv(config as never, { cacheResolutions: false }) as (
      props?: Record<string, unknown>,
    ) => string | undefined;

    for (const selection of [{}, { ghost: true }, { g0: "v1", ghost: true }, { g0: "v1" }]) {
      expect(wide(selection)).toBe(uncached(selection));
    }

    expect(wide({ ghost: true })).toBe("block ring");
  });

  test("returns undefined for a slot whose own props resolve to nothing", () => {
    const empty = tv({ slots: { base: "", label: "" }, variants: { size: { sm: { base: "" } } } });

    expect(empty().base()).toBeUndefined();
    expect(empty({ size: "sm" }).base({ className: "" })).toBeUndefined();
  });

  test("drops a class map entry naming a slot the configuration never declared", () => {
    // Unreachable through the types, which reject it — but a JavaScript caller still gets here.
    const card = tv({
      slots: { base: "rounded", title: "text-xl" },
      variants: { size: { sm: { notASlot: "p-3", title: "text-lg" } } },
    } as never) as unknown as (props?: Record<string, unknown>) => Record<string, () => string | undefined>;

    const slots = card({ size: "sm" });

    expect(slots.title?.()).toBe("text-lg");
    expect(slots.base?.()).toBe("rounded");
    expect(slots.notASlot).toBeUndefined();
  });

  test("skips a variant group that is not there", () => {
    const patchy = tv({ base: "block", variants: { size: undefined, tone: { loud: "font-bold" } } } as never) as (
      props?: Record<string, unknown>,
    ) => string | undefined;

    expect(patchy({ tone: "loud" })).toBe("block font-bold");
    expect(patchy({ size: "sm" })).toBe("block");
  });

  test("adds nothing for a compound or a caller class that carries no classes", () => {
    const quiet = tv({
      base: "block",
      compoundVariants: [{ class: "", size: "sm" }],
      variants: { size: { sm: "p-2" } },
    });

    expect(quiet({ size: "sm" })).toBe("block p-2");
    expect(quiet({ className: [], size: "sm" })).toBe("block p-2");
  });
});

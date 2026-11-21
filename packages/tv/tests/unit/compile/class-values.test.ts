import { describe, expect, test } from "vitest";

import { isSlotClassMap, toDefaultKey, toVariantKey } from "#compile/class-values";
import { tv } from "#index";
import { everyLane, readEveryLane } from "#tests/unit/support/lanes";

const F = { twMerge: false } as const;

type FlatResolver = (props?: Record<string, unknown>) => string | undefined;
type SlotResolver = (
  props?: Record<string, unknown>,
) => Record<string, (props?: Record<string, unknown>) => string | undefined>;

// A JavaScript caller reaches the runtime with values the types reject, so these resolvers are called untyped.
const flatTv = tv as (configuration: object, options?: object) => FlatResolver;
const slotTv = tv as (configuration: object, options?: object) => SlotResolver;

const FLAT = {
  base: "b",
  variants: {
    on: { false: "on-f", true: "on-t" },
    size: { "": "empty-key", 0: "zero", md: "m", null: "null-key", sm: "s" },
  },
};

const SLOTS = {
  slots: { base: "b", item: "i" },
  variants: {
    on: { false: { item: "on-f" }, true: { item: "on-t" } },
    size: { "": { item: "empty-key" }, 0: { item: "zero" }, md: { item: "m" }, null: { item: "null-key" } },
  },
};

describe("toVariantKey", () => {
  test("spells booleans and zero as their keys and reads any other falsy value as false", () => {
    expect(toVariantKey(true)).toBe("true");
    expect(toVariantKey(false)).toBe("false");
    expect(toVariantKey(0)).toBe("0");
    expect(toVariantKey("")).toBe("false");
    expect(toVariantKey(Number.NaN)).toBe("false");
    expect(toVariantKey("sm")).toBe("sm");
  });

  test("selects nothing for null, an array or an object", () => {
    expect(toVariantKey(null)).toBeUndefined();
    expect(toVariantKey(["sm"])).toBeUndefined();
    expect(toVariantKey({ sm: true })).toBeUndefined();
  });
});

describe("toDefaultKey", () => {
  test("reads a missing or null default as false", () => {
    expect(toDefaultKey(undefined)).toBe("false");
    expect(toDefaultKey(null)).toBe("false");
    expect(toDefaultKey("")).toBe("false");
    expect(toDefaultKey("md")).toBe("md");
    expect(toDefaultKey(0)).toBe("0");
  });
});

describe("variant value normalisation", () => {
  const cases: ReadonlyArray<readonly [label: string, props: Record<string, unknown>, flat: string, item: string]> = [
    ["zero selects key 0", { size: 0 }, "b on-f zero", "i on-f zero"],
    ["an empty string on a boolean group reads as false", { on: "" }, "b on-f m", "i on-f m"],
    ["an empty string selects no other key", { size: "" }, "b on-f", "i on-f"],
    ["null selects nothing and takes no default", { size: null }, "b on-f", "i on-f"],
    ["an array selects nothing", { size: ["md"] }, "b on-f", "i on-f"],
  ];

  for (const [label, props, flat, item] of cases) {
    test(`${label}, on every lane of a configuration without slots`, () => {
      const answers = readEveryLane(
        () => flatTv({ ...FLAT, defaultVariants: { size: "md" } }, F),
        (resolver) => resolver(props),
      );

      expect(answers).toEqual(everyLane(flat));
    });

    test(`${label}, on every lane of a slot configuration`, () => {
      const answers = readEveryLane(
        () => slotTv({ ...SLOTS, defaultVariants: { size: "md" } }, F),
        (resolver) => resolver(props).item?.(),
      );

      expect(answers).toEqual(everyLane(item));
    });
  }

  test("a slot's own falsy value selects like a call's", () => {
    const answers = readEveryLane(
      () => slotTv(SLOTS, F),
      (resolver) => {
        const slots = resolver();

        return [slots.item?.({ size: 0 }), slots.item?.({ on: "" }), slots.item?.({ size: ["md"] })];
      },
    );

    expect(answers).toEqual(everyLane(["i on-f zero", "i on-f", "i on-f"]));
  });
});

describe("isSlotClassMap", () => {
  test("should correctly identify slot objects", () => {
    expect(isSlotClassMap({ base: "class1", item: "class2" })).toBe(true);
    expect(isSlotClassMap({ singleSlot: "class" })).toBe(true);
    expect(isSlotClassMap({})).toBe(true); // Empty object is still an object
  });

  test("should correctly reject non-slot-object values", () => {
    expect(isSlotClassMap("string")).toBe(false);
    expect(isSlotClassMap(123)).toBe(false);
    expect(isSlotClassMap(true)).toBe(false);
    expect(isSlotClassMap(false)).toBe(false);
    expect(isSlotClassMap(null)).toBe(false);
    expect(isSlotClassMap(undefined)).toBe(false);
    expect(isSlotClassMap([])).toBe(false);
    // A function is no longer a `ClassValue` — clsx typed its dictionary `Record<string, any>`,
    // which admitted one. The runtime still has to answer for it.
    expect(
      isSlotClassMap((() => {
        /* empty function for test */
      }) as never),
    ).toBe(false);
  });

  test("should handle complex object structures", () => {
    // Objects with string values should be considered slot objects
    expect(
      isSlotClassMap({
        nested: { deep: "value" },
        simple: "class",
      }),
    ).toBe(true);

    // Objects with non-string values should still be considered slot objects
    // as the type guard only checks if it's an object
    expect(
      isSlotClassMap({
        array: ["item"],
        boolean: true,
        number: 123,
      }),
    ).toBe(true);
  });

  test("should handle prototype chain objects", () => {
    const object = Object.create({ inherited: "value" }) as Record<string, unknown>;

    object.own = "property";
    expect(isSlotClassMap(object)).toBe(true);
  });
});

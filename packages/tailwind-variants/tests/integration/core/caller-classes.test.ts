import { describe, expect, test } from "vitest";

import { tv } from "#index";
import { everyLane, readEveryLane } from "#tests/unit/support/lanes";

const F = { twMerge: false } as const;

describe("tv: a caller's class and className", () => {
  const button = { base: "b", variants: { size: { sm: "s" } } };

  test("takes className over class without slots", () => {
    const answers = readEveryLane(
      () => tv(button, F),
      (resolver) => resolver({ class: "x", className: "y", size: "sm" }),
    );

    expect(answers).toEqual(everyLane("b s y"));
  });

  test("takes an empty className over class", () => {
    const answers = readEveryLane(
      () => tv(button, F),
      (resolver) => resolver({ class: "x", className: "" }),
    );

    expect(answers).toEqual(everyLane("b"));
  });

  test("falls back to class when className is null or undefined", () => {
    const answers = readEveryLane(
      () => tv(button, F),
      (resolver) => [
        resolver({ class: ["x", { z: true }], className: null }),
        resolver({ class: "x", className: undefined }),
      ],
    );

    expect(answers).toEqual(everyLane(["b x z", "b x"]));
  });

  test("answers a pair from its store exactly as a fresh resolution does", () => {
    const resolver = tv(button, F);
    const pairs = [
      { class: "x", className: "y" },
      { class: "x y", className: "" },
      { class: "", className: "x y" },
      { class: "x" },
      { className: "y" },
    ];

    for (let pass = 0; pass < 4; pass++) {
      for (const pair of pairs) {
        expect(resolver({ ...pair, size: "sm" })).toBe(tv(button, F)({ ...pair, size: "sm" }));
      }
    }
  });

  test("takes a slot's className over its class", () => {
    const answers = readEveryLane(
      () => tv({ slots: { base: "b", item: "i" } }, F),
      (resolver) => resolver().item({ class: "x", className: "y" }),
    );

    expect(answers).toEqual(everyLane("i y"));
  });
});

describe("tv: a resolution with no classes", () => {
  for (const options of [{}, F, { cacheResolutions: false }]) {
    test(`answers an empty string without slots (${JSON.stringify(options)})`, () => {
      const answers = readEveryLane(
        () => tv({ variants: { size: { sm: "" } } }, options),
        (resolver) => [resolver(), resolver({ size: "sm" }), resolver({ className: "" })],
      );

      expect(answers).toEqual(everyLane(["", "", ""]));
    });

    test(`answers an empty string for a slot (${JSON.stringify(options)})`, () => {
      const answers = readEveryLane(
        () => tv({ slots: { base: "", item: "" }, variants: { size: { sm: { item: "" } } } }, options),
        (resolver) => {
          const slots = resolver({ size: "sm" });

          return [slots.base(), slots.item(), slots.item({ className: "" }), slots.item({ size: "sm" })];
        },
      );

      expect(answers).toEqual(everyLane(["", "", "", ""]));
    });
  }
});

describe("tv: a call passing both class and className", () => {
  test("should take className over class on a call and a compound", () => {
    const h1 = tv(
      {
        base: "text-3xl",
        compoundVariants: [{ class: "c1", className: "c2", color: "red" }],
        variants: { color: { red: "text-red-500" } },
      },
      { twMerge: false },
    );

    expect(h1({ class: "x", className: "y", color: "red" })).toBe("text-3xl text-red-500 c2 y");
  });

  test("should take className over class on a slot, a slot compound and a compound slot", () => {
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

    expect(item({ class: "x", className: "y" })).toBe("i text-red-500 c2 s2 y");
    expect(item({ class: "x", className: "y", color: "red" })).toBe("i text-red-500 c2 s2 y");
  });
});

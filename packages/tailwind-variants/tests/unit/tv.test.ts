import { describe, expect, test } from "vitest";

import { tv } from "#index";
import { everyLane, readEveryLane } from "#tests/unit/support/lanes";

const F = { twMerge: false } as const;

describe("tv: a caller's class and className", () => {
  const button = { base: "b", variants: { size: { sm: "s" } } };

  test("appends both, class first, without slots", () => {
    const answers = readEveryLane(
      () => tv(button, F),
      (resolver) => resolver({ class: "x", className: "y", size: "sm" }),
    );

    expect(answers).toEqual(everyLane("b s x y"));
  });

  test("keeps class when className is empty", () => {
    const answers = readEveryLane(
      () => tv(button, F),
      (resolver) => resolver({ class: "x", className: "" }),
    );

    expect(answers).toEqual(everyLane("b x"));
  });

  test("appends both when either is clsx-shaped", () => {
    const answers = readEveryLane(
      () => tv(button, F),
      (resolver) => resolver({ class: ["x", { z: true }], className: "y" }),
    );

    expect(answers).toEqual(everyLane("b x z y"));
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

  test("appends a slot's class then its className", () => {
    const answers = readEveryLane(
      () => tv({ slots: { base: "b", item: "i" } }, F),
      (resolver) => resolver().item({ class: "x", className: "y" }),
    );

    expect(answers).toEqual(everyLane("i x y"));
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

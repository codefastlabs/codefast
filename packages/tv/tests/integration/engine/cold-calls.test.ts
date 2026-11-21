import { describe, expect, test } from "vitest";

import { tv } from "#index";

describe("tv: the calls a resolver answers before it compiles", () => {
  test("answers the first two calls without slots cold, then merges once and answers from its store", () => {
    const merged: Array<string> = [];
    const button = tv(
      { base: "px-2", variants: { size: { sm: "text-sm" } } },
      {
        twMerge: (classes) => {
          merged.push(classes);

          return classes;
        },
      },
    );

    for (let call = 0; call < 6; call++) {
      expect(button({ size: "sm" })).toBe("px-2 text-sm");
    }

    // Two cold calls merge each time; the compiling call merges once and stores it for the rest.
    expect(merged).toHaveLength(3);
  });

  test("answers the first call with slots cold, then returns one stored slot object", () => {
    const card = tv({ slots: { base: "block", item: "px-2" }, variants: { size: { sm: { item: "text-sm" } } } });
    const answers = Array.from({ length: 4 }, () => card({ size: "sm" }));

    expect(answers[1]).not.toBe(answers[0]);
    expect(answers[2]).toBe(answers[1]);
    expect(answers[3]).toBe(answers[1]);
    expect(answers.map((slots) => slots.item())).toEqual([
      "px-2 text-sm",
      "px-2 text-sm",
      "px-2 text-sm",
      "px-2 text-sm",
    ]);
  });
});

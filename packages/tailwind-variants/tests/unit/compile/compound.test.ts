import { describe, expect, test } from "vitest";

import { tv } from "#index";
import { everyLane, readEveryLane } from "#tests/unit/support/lanes";

const F = { twMerge: false } as const;

describe("compound classes", () => {
  test("applies a compound variant's class then its className", () => {
    const answers = readEveryLane(
      () =>
        tv(
          {
            base: "b",
            compoundVariants: [{ class: "font-bold", className: "underline", tone: "loud" }],
            variants: { tone: { loud: "l" } },
          },
          F,
        ),
      (resolver) => resolver({ tone: "loud" }),
    );

    expect(answers).toEqual(everyLane("b l font-bold underline"));
  });

  test("applies a compound slot's class then its className", () => {
    const answers = readEveryLane(
      () =>
        tv(
          {
            compoundSlots: [{ class: "font-bold", className: "underline", slots: ["item"], tone: "loud" }],
            slots: { base: "b", item: "i" },
            variants: { tone: { loud: "" } },
          },
          F,
        ),
      (resolver) => resolver({ tone: "loud" }).item(),
    );

    expect(answers).toEqual(everyLane("i font-bold underline"));
  });

  test("joins a slot compound variant's class and className per slot", () => {
    const answers = readEveryLane(
      () =>
        tv(
          {
            compoundVariants: [{ class: "ring", className: { base: "shadow", item: "underline" }, tone: "loud" }],
            slots: { base: "b", item: "i" },
            variants: { tone: { loud: "" } },
          },
          F,
        ),
      (resolver) => {
        const slots = resolver({ tone: "loud" });

        return [slots.base(), slots.item(), slots.item({ tone: "loud" })];
      },
    );

    expect(answers).toEqual(everyLane(["b ring shadow", "i underline", "i underline"]));
  });
});

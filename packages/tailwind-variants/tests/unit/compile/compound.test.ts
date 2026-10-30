import { describe, expect, test } from "vitest";

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

/** Compounds on a group with no `false` key, so only a compound can tell an absent value from another. */
const CONDITIONS = {
  compoundVariants: [
    { class: "on-false", on: false },
    { class: "in-list", on: [null, "x"] },
    { class: "on-true", on: true },
  ],
  variants: { on: { true: "", x: "" } },
};

/** Each selection a caller may pass, with the compounds it must satisfy. */
const SELECTIONS: ReadonlyArray<readonly [props: Record<string, unknown>, expected: string]> = [
  [{}, "on-false in-list"],
  [{ on: undefined }, "on-false in-list"],
  [{ on: null }, "on-false in-list"],
  [{ on: false }, "on-false in-list"],
  [{ on: "" }, ""],
  [{ on: 0 }, ""],
  [{ on: "x" }, "in-list"],
  [{ on: true }, "on-true"],
  [{ on: "true" }, ""],
  [{ on: "zz" }, ""],
];

describe("compound conditions", () => {
  test("treat undefined, null and false alike, in a value and in a list, without slots", () => {
    const answers = readEveryLane(
      () => flatTv({ base: "b", ...CONDITIONS }, F),
      (resolver) => SELECTIONS.map(([props]) => resolver(props)),
    );

    expect(answers).toEqual(everyLane(SELECTIONS.map(([, expected]) => (expected ? `b ${expected}` : "b"))));
  });

  test("treat undefined, null and false alike in a slot configuration's compound variants", () => {
    const answers = readEveryLane(
      () => slotTv({ slots: { base: "b" }, ...CONDITIONS }, F),
      (resolver) => SELECTIONS.map(([props]) => resolver(props).base?.()),
    );

    expect(answers).toEqual(everyLane(SELECTIONS.map(([, expected]) => (expected ? `b ${expected}` : "b"))));
  });

  test("treat undefined, null and false alike in compound slots", () => {
    const answers = readEveryLane(
      () =>
        slotTv(
          {
            compoundSlots: CONDITIONS.compoundVariants.map((compound) => ({ ...compound, slots: ["item"] })),
            slots: { base: "b", item: "i" },
            variants: CONDITIONS.variants,
          },
          F,
        ),
      (resolver) => SELECTIONS.map(([props]) => resolver(props).item?.()),
    );

    expect(answers).toEqual(everyLane(SELECTIONS.map(([, expected]) => (expected ? `i ${expected}` : "i"))));
  });

  test("compare an omitted variant through its default", () => {
    const answers = readEveryLane(
      () =>
        tv(
          {
            base: "b",
            compoundVariants: [{ class: "loud", on: true }],
            defaultVariants: { on: true },
            variants: { on: { false: "", true: "" } },
          },
          F,
        ),
      (resolver) => [resolver(), resolver({ on: false })],
    );

    expect(answers).toEqual(everyLane(["b loud", "b"]));
  });

  test("reads a slot's own absent value as it reads a call's", () => {
    const answers = readEveryLane(
      () =>
        slotTv(
          {
            compoundVariants: [{ class: { item: "idle" }, on: false }],
            slots: { base: "b", item: "i" },
            variants: { on: { true: { item: "active" } } },
          },
          F,
        ),
      (resolver) => {
        const slots = resolver({ on: true });

        return [slots.item?.(), slots.item?.({ on: false })];
      },
    );

    expect(answers).toEqual(everyLane(["i active", "i idle"]));
  });
});

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

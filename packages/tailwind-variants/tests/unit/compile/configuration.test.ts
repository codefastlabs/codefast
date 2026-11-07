import { describe, expect, test } from "vitest";

import { tv } from "#index";
import { everyLane, readEveryLane } from "#tests/unit/support/lanes";

const F = { twMerge: false } as const;

// The types read a flat parent as a flat resolver, so a slot child over one is called untyped.
const untypedTv = tv as (
  configuration: object,
  options?: object,
) => (props?: Record<string, unknown>) => Record<string, () => string | undefined>;

describe("mergeVariantConfigs", () => {
  test("keeps a child's compound slots when the child does not redeclare slots", () => {
    const card = tv({ slots: { base: "", footer: "", header: "" }, variants: { size: { sm: "" } } }, F);
    const answers = readEveryLane(
      () => tv({ compoundSlots: [{ class: "p-2", size: "sm", slots: ["header", "footer"] }], extend: card }, F),
      (resolver) => {
        const slots = resolver({ size: "sm" });

        return [slots.header(), slots.footer()];
      },
    );

    expect(answers).toEqual(everyLane(["p-2", "p-2"]));
  });

  test("joins a flat child's base onto a parent's base slot", () => {
    const panel = tv({ slots: { base: "rounded border", body: "p-4" } }, F);
    const answers = readEveryLane(
      () => tv({ base: "shadow-lg", extend: panel }, F),
      (resolver) => resolver().base(),
    );

    expect(answers).toEqual(everyLane("rounded border shadow-lg"));
  });

  test("joins a slot child's base onto a parent's base slot", () => {
    const panel = tv({ slots: { base: "rounded border", body: "p-4" } }, F);
    const answers = readEveryLane(
      () => tv({ base: "shadow-lg", extend: panel, slots: { body: "font-bold" } }, F),
      (resolver) => {
        const slots = resolver();

        return [slots.base(), slots.body()];
      },
    );

    expect(answers).toEqual(everyLane(["rounded border shadow-lg", "p-4 font-bold"]));
  });

  test("puts a slot child's base before a flat parent's", () => {
    const parent = tv({ base: "pb", variants: { tone: { loud: "font-bold" } } }, F);
    const answers = readEveryLane(
      () => untypedTv({ base: "cb", extend: parent, slots: { item: "ci" } }, F),
      (resolver) => {
        const slots = resolver({ tone: "loud" });

        return [slots.base?.(), slots.item?.()];
      },
    );

    expect(answers).toEqual(everyLane(["cb pb font-bold", "ci"]));
  });

  test("joins a variant value the child redeclares after the parent's", () => {
    const button = tv(
      { base: "inline-flex", defaultVariants: { size: "sm" }, variants: { size: { sm: "h-9 px-3" } } },
      F,
    );
    const answers = readEveryLane(
      () => tv({ extend: button, variants: { size: { sm: "text-xs" } } }, F),
      (resolver) => resolver(),
    );

    expect(answers).toEqual(everyLane("inline-flex h-9 px-3 text-xs"));
  });

  test("joins a slot value the child redeclares per slot, after the parent's", () => {
    const menu = tv(
      {
        defaultVariants: { size: "sm" },
        slots: { base: "", icon: "", label: "" },
        variants: { size: { sm: { icon: "size-4 shrink-0", label: "text-sm" } } },
      },
      F,
    );
    const answers = readEveryLane(
      () => tv({ extend: menu, variants: { size: { sm: { icon: "text-muted" } } } }, F),
      (resolver) => {
        const slots = resolver();

        return [slots.icon(), slots.label()];
      },
    );

    expect(answers).toEqual(everyLane(["size-4 shrink-0 text-muted", "text-sm"]));
  });

  test("reads a plain value as the base slot when it joins a slot map", () => {
    const item = tv({ slots: { base: "b", label: "l" }, variants: { tone: { loud: "font-bold" } } }, F);
    const answers = readEveryLane(
      () => tv({ extend: item, variants: { tone: { loud: { base: "uppercase", label: "text-lg" } } } }, F),
      (resolver) => {
        const slots = resolver({ tone: "loud" });

        return [slots.base(), slots.label()];
      },
    );

    expect(answers).toEqual(everyLane(["b font-bold uppercase", "l text-lg"]));
  });

  test("joins the slots both declare, parent first", () => {
    const parent = tv({ slots: { base: "pb", item: "pi" } }, F);
    const answers = readEveryLane(
      () => tv({ extend: parent, slots: { item: "ci" } }, F),
      (resolver) => {
        const slots = resolver();

        return [slots.base(), slots.item()];
      },
    );

    expect(answers).toEqual(everyLane(["pb", "pi ci"]));
  });

  test("keeps every level of a three-level chain, the newest variant names first", () => {
    const first = tv({ base: "a", compoundVariants: [{ class: "acv", s: "x" }], variants: { s: { x: "ax" } } }, F);
    const second = tv({ base: "b", extend: first, variants: { s: { x: "bx" }, t: { y: "by" } } }, F);
    const answers = readEveryLane(
      () => tv({ base: "c", defaultVariants: { s: "x", t: "y" }, extend: second, variants: { t: { y: "cy" } } }, F),
      (resolver) => resolver(),
    );

    expect(answers).toEqual(everyLane("a b c by cy ax bx acv"));
  });

  test("lists the child's variant names before the parent's", () => {
    const parent = tv({ variants: { size: { sm: "px-2" }, tone: { loud: "font-bold" } } });

    expect(tv({ extend: parent, variants: { intent: { ok: "" }, tone: { soft: "" } } }).variantKeys).toEqual([
      "intent",
      "tone",
      "size",
    ]);
  });
});

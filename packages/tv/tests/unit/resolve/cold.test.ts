import { describe, expect, test } from "vitest";

import { tv } from "#index";

describe("cold slot lane", () => {
  test("reads the props as they were when the resolver was called", () => {
    const card = tv({ slots: { base: "block", label: "text-sm" }, variants: { size: { lg: "p-8", sm: "p-1" } } });
    const answers: Array<string | undefined> = [];

    // The first call is cold and the rest compiled; a caller reusing its props object must not change either.
    for (let call = 0; call < 3; call++) {
      const props: { size: "lg" | "sm" } = { size: "sm" };
      const slots = card(props);

      props.size = "lg";
      answers.push(slots.base());
    }

    expect(answers).toEqual(["block p-1", "block p-1", "block p-1"]);
  });

  test("reads a compound's condition as it was when the resolver was called", () => {
    const card = tv(
      {
        compoundSlots: [{ class: "ring", slots: ["label"], tone: "loud" }],
        compoundVariants: [{ class: { base: "shadow" }, tone: "loud" }],
        slots: { base: "block", label: "text-sm" },
        variants: { tone: { loud: "", soft: "" } },
      },
      { twMerge: false },
    );
    const props: { tone: "loud" | "soft" } = { tone: "loud" };
    const slots = card(props);

    props.tone = "soft";

    expect([slots.base(), slots.label()]).toEqual(["block shadow", "text-sm ring"]);
  });
});

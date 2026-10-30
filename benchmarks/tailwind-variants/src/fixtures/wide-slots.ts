/**
 * A wide slot component — sixteen slots, twenty three-way variants, a compound on each — whose selection space is past
 * one safe integer, rendered with a handful of selections.
 */

const SLOT_COUNT = 16;
const VARIANT_COUNT = 20;

const slotName = (index: number): string => (index === 0 ? "base" : `part${String(index)}`);

/** The wide configuration, built once so every side defines the same object. */
export const wideSlotsVariants = (() => {
  const slots: Record<string, string> = {};
  const variants: Record<string, Record<string, Record<string, string>>> = {};
  const compoundVariants: Array<Record<string, unknown>> = [];

  for (let index = 0; index < SLOT_COUNT; index++) {
    slots[slotName(index)] = `flex gap-${String((index % 4) + 1)} p-${String((index % 3) + 1)}`;
  }

  for (let index = 0; index < VARIANT_COUNT; index++) {
    const target = slotName(index % SLOT_COUNT);
    const name = `v${String(index)}`;

    variants[name] = {
      auto: {},
      off: { [target]: "opacity-50" },
      on: { [target]: `ring-${String((index % 4) + 1)}` },
    };
    compoundVariants.push({ class: { [slotName((index + 1) % SLOT_COUNT)]: "shadow-sm" }, [name]: "on" });
  }

  return { compoundVariants, slots, variants };
})();

const createSelection = (offset: number): Readonly<Record<string, string>> => {
  const selection: Record<string, string> = {};

  for (let index = 0; index < VARIANT_COUNT; index++) {
    const choice = (index * 7 + offset) % 5;

    if (choice < 3) {
      selection[`v${String(index)}`] = choice === 0 ? "on" : choice === 1 ? "off" : "auto";
    }
  }

  return selection;
};

/** The selections one timed iteration renders. */
export const wideSlotsTestProps: ReadonlyArray<Readonly<Record<string, string>>> = Array.from(
  { length: 12 },
  (_, index) => createSelection(index),
);

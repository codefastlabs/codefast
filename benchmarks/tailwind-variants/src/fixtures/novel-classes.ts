/**
 * Class strings no merge engine has seen before: a `className` unique to each call, and component definitions that
 * each carry a class of their own, so every merge they reach is a miss in every cache.
 */
import { overrideTestProps } from "#fixtures/override";
import { buttonVariants } from "#fixtures/simple";
import { slotsVariants } from "#fixtures/slots";

/** The selections a unique-class iteration renders, one per call site, each given a `className` nobody passed before. */
export const uniqueClassSelections: ReadonlyArray<Readonly<Record<string, string | undefined>>> = overrideTestProps;

/** A `className` no earlier call passed, numbered by the caller's own counter. */
export const uniqueClassName = (serial: number): string => `w-[${String(serial)}px] gap-[${String(serial % 97)}px]`;

/** The button configuration with a class of its own, so its definition shares no merge with any other. */
export const novelButtonVariants = (serial: number): typeof buttonVariants => ({
  ...buttonVariants,
  base: `${buttonVariants.base} min-w-[${String(serial)}px]`,
});

/** The card configuration with a base slot class of its own. */
export const novelCardVariants = (serial: number): typeof slotsVariants => ({
  ...slotsVariants,
  slots: { ...slotsVariants.slots, base: `${slotsVariants.slots.base} min-w-[${String(serial)}px]` },
});

/**
 * Class strings no merge engine has seen before: a `className` unique to each call, and component definitions that
 * each carry a class of their own, so every merge they reach is a miss in every cache.
 */
import { overrideTestProps } from "#fixtures/override";
import { buttonVariants } from "#fixtures/simple";
import { slotsVariants } from "#fixtures/slots";

/**
 * The selections a unique-class iteration renders, one per call site, each given a `className` nobody passed before.
 *
 * @since 0.11.1
 */
export const uniqueClassSelections: ReadonlyArray<Readonly<Record<string, string | undefined>>> = overrideTestProps;

/**
 * A `className` no earlier call passed, numbered by the caller's own counter.
 *
 * @since 0.11.1
 */
export const uniqueClassName = (serial: number): string => `w-[${String(serial)}px] gap-[${String(serial % 97)}px]`;

/**
 * The button configuration with a class of its own, so its definition shares no merge with any other.
 *
 * @remarks The class must survive the merge: one a variant overrides drops out, and every definition would merge to
 * the same answer.
 *
 * @since 0.11.1
 */
export const novelButtonVariants = (serial: number): typeof buttonVariants => ({
  ...buttonVariants,
  base: `${buttonVariants.base} scroll-mt-[${String(serial)}px]`,
});

/**
 * The card configuration with a base slot class of its own.
 *
 * @since 0.11.1
 */
export const novelCardVariants = (serial: number): typeof slotsVariants => ({
  ...slotsVariants,
  slots: { ...slotsVariants.slots, base: `${slotsVariants.slots.base} scroll-mt-[${String(serial)}px]` },
});

/**
 * The calls one page makes of a button it shows several times: repeats of one selection, the default passed
 * explicitly, and a caller's class, in render order.
 *
 * @since 0.11.1
 */
export const firstPageButtonCalls: ReadonlyArray<Readonly<Record<string, string>>> = [
  {},
  {},
  { size: "default", variant: "default" },
  { size: "sm", variant: "outline" },
  { size: "sm", variant: "outline" },
  { className: "mt-4" },
  { className: "mt-4" },
  { size: "sm", variant: "outline" },
];

/**
 * The calls one page makes of a card it shows several times, in render order.
 *
 * @since 0.11.1
 */
export const firstPageCardCalls: ReadonlyArray<Readonly<Record<string, string>>> = [
  {},
  {},
  { size: "md", variant: "default" },
  { size: "lg", variant: "success" },
  { size: "lg", variant: "success" },
  {},
];

/**
 * Prop selections that cycle a few choices, for the `repeat-*` scenarios.
 *
 * Built once, so the timed loop hands the same object references over and over, as every fixture here does.
 */

const SIMPLE_SELECTIONS = [
  { size: "sm", variant: "outline" },
  { size: "sm", variant: "ghost" },
  { className: "w-full", size: "sm", variant: "outline" },
] as const;

const SLOTS_SELECTIONS = [
  { size: "md", variant: "default" },
  { size: "md", variant: "info" },
  { elevation: "lg", size: "md", variant: "default" },
] as const;

const REPEAT_LENGTH = 12;

/**
 * @since 0.6.0
 */
export const repeatSimpleTestProps: ReadonlyArray<Record<string, string>> = Array.from(
  { length: REPEAT_LENGTH },
  (_, index) => ({ ...SIMPLE_SELECTIONS[index % SIMPLE_SELECTIONS.length] }),
);

/**
 * @since 0.6.0
 */
export const repeatSlotsTestProps: ReadonlyArray<Record<string, string>> = Array.from(
  { length: REPEAT_LENGTH },
  (_, index) => ({ ...SLOTS_SELECTIONS[index % SLOTS_SELECTIONS.length] }),
);

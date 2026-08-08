/**
 * Repeat Benchmark Data
 *
 * A smaller working set than the other prop fixtures: twelve calls over three distinct selections
 * rather than twelve distinct ones, which is what a list rendering one component looks like.
 *
 * What this does **not** vary is object identity. The array is built once, so the timed loop hands
 * the same twelve references over and over — as every other fixture here does. Measuring the cost of
 * the fresh props object React builds per render would need a fixture that allocates inside the
 * timed function, and none of these do.
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

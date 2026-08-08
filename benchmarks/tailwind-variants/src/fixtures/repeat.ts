/**
 * Repeat Benchmark Data
 *
 * The other prop fixtures rotate a distinct selection on every call, which is the right shape for
 * measuring resolution but the wrong shape for the workload a UI actually has: a list renders the
 * same few selections thousands of times. Values repeat with period 3; the objects carrying them
 * are fresh, because React builds a new props object per render and a fixture reusing one
 * reference would measure an identity a real caller never has.
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

export const repeatSimpleTestProps: ReadonlyArray<Record<string, string>> = Array.from(
  { length: REPEAT_LENGTH },
  (_, index) => ({ ...SIMPLE_SELECTIONS[index % SIMPLE_SELECTIONS.length] }),
);

export const repeatSlotsTestProps: ReadonlyArray<Record<string, string>> = Array.from(
  { length: REPEAT_LENGTH },
  (_, index) => ({ ...SLOTS_SELECTIONS[index % SLOTS_SELECTIONS.length] }),
);

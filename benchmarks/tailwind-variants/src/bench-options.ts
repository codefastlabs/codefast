/**
 * Single source of truth for tinybench timing across all scenarios.
 *
 * Fairness: every library task in a suite uses the same iteration/time budgets and the same
 * prop loops over shared fixtures. "With merge" suites pass `{ twMerge: true }` explicitly to
 * both `tv` implementations so behavior does not depend on package defaults. The CVA path uses
 * `tailwind-merge` after `cva()` — not identical to `tv`’s internal merge, but it is the usual
 * production pairing for CVA and is kept stable across runs.
 */
export const BENCH_OPTIONS = {
  iterations: 1000,
  time: 1000,
  warmupIterations: 100,
  warmupTime: 100,
} as const;

export const TV_MERGE_ENABLED = { twMerge: true } as const;
export const TV_MERGE_DISABLED = { twMerge: false } as const;

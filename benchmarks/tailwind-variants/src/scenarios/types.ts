/**
 * Shared scenario typing for `@codefast/tailwind-variants`, tailwind-variants (npm),
 * and class-variance-authority bench subprocesses.
 *
 * Matching `id` values align rows in each comparison report.
 */

import type {
  AsyncBenchScenario as HarnessAsyncBenchScenario,
  BenchScenario as HarnessBenchScenario,
} from "@codefast/benchmark-harness/child/bench-scenario";

/**
 * @since 0.3.16-canary.0
 */
type ScenarioGroup =
  | "simple"
  | "complex"
  | "slots"
  | "compound-slots"
  | "extends"
  | "create-tv"
  | "extreme"
  | "extreme-slots"
  | "repeat-simple"
  | "repeat-slots"
  | "construct"
  | "uncached";

/**
 * @since 0.3.16-canary.0
 */
export type BenchScenario = HarnessBenchScenario & { readonly group: ScenarioGroup };
/**
 * @since 0.3.16-canary.0
 */
type AsyncBenchScenario = HarnessAsyncBenchScenario & { readonly group: ScenarioGroup };
/**
 * @since 0.3.16-canary.0
 */
export type AnyScenario = BenchScenario | AsyncBenchScenario;

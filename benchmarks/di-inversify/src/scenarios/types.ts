/**
 * Shared scenario typing for both codefast and inversify harnesses.
 *
 * A scenario module exports two parallel arrays of scenarios — one per library —
 * with matching `id`s for every head-to-head row. Pairwise matching IDs are what
 * lets the reporter align them in the comparison table; an `id` may appear on
 * only one side when a scenario is intentionally library-specific.
 */

import type {
  AsyncBenchScenario as HarnessAsyncBenchScenario,
  BenchScenario as HarnessBenchScenario,
} from "@codefast/benchmark-harness/child/bench-scenario";

/**
 * Grouping used by the reporter to label scenarios in the comparison table.
 *
 * @since 0.3.16-canary.0
 */
type ScenarioGroup =
  | "baseline"
  | "micro"
  | "realistic"
  | "fan-out"
  | "async"
  | "lifecycle"
  | "scope"
  | "scale"
  | "boot"
  | "failure"
  | "production"
  | "introspection";

/**
 * @since 0.3.16-canary.0
 */
export type BenchScenario = HarnessBenchScenario & { readonly group: ScenarioGroup };
/**
 * @since 0.3.16-canary.0
 */
export type AsyncBenchScenario = HarnessAsyncBenchScenario & { readonly group: ScenarioGroup };
/**
 * @since 0.3.16-canary.0
 */
export type AnyScenario = BenchScenario | AsyncBenchScenario;

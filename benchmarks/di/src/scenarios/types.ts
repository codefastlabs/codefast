/**
 * Shared scenario typing for every library harness (codefast, inversify, awilix, tsyringe).
 *
 * Each library exposes its own scenarios with matching `id`s for every head-to-head row.
 * Matching IDs are what let the reporter align rows across libraries; an `id` may appear on
 * only some libraries when a scenario is intentionally library-specific or outside the
 * awilix/tsyringe core subset.
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
  | "introspection"
  | "slot-selection"
  | "resolution";

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

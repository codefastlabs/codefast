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
} from "@codefast/benchmark-harness";
export { isAsyncScenario } from "@codefast/benchmark-harness";

/**
 * Grouping used by the reporter to label scenarios in the comparison table.
 *
 * @since 0.3.16-canary.0
 */
export type ScenarioGroup =
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

/**
 * A scenario module exports one list per library. Parallel arrays keep
 * the IDs in lock-step for the usual head-to-head case. The comparison reporter
 * includes every `id` that appears in **either** library: if a scenario exists on
 * only one side, that row still appears with the missing side formatted as 0/“—”
 * (e.g. codefast-only `realistic-graph-validate`); the reporter does **not** drop
 * the row.
 *
 * @since 0.3.16-canary.0
 */
export interface ScenarioModule {
  readonly codefast: readonly AnyScenario[];
  readonly inversify: readonly AnyScenario[];
}

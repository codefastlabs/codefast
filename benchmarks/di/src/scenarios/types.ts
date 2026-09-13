/**
 * Shared scenario typing for every library harness.
 *
 * Each library exposes its own scenarios with matching `id`s for every head-to-head row.
 * Matching IDs are what let the reporter align rows across libraries; an `id` may appear on
 * only some libraries when a scenario is intentionally library-specific or outside what a
 * competitor's idiom can express.
 */

import type {
  AsyncBenchScenario as HarnessAsyncBenchScenario,
  BenchScenario as HarnessBenchScenario,
  BenchScenarioTier,
} from "@internal/benchmark-harness/child/bench-scenario";

import type { DiFeature } from "#/fixtures/features";

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
 * What every scenario in this suite declares beyond the harness shape.
 *
 * @remarks `tier` says whether the row measures public API (`contract`, compared across libraries)
 * or this engine's internals (`engine`, deleted with the engine); `requires` names the public-API
 * features the row cannot be written without, read against each library's declared `features`.
 */
interface ScenarioDeclaration {
  readonly group: ScenarioGroup;
  readonly tier: BenchScenarioTier;
  readonly requires: ReadonlyArray<DiFeature>;
}

/**
 * @since 0.3.16-canary.0
 */
export type BenchScenario = HarnessBenchScenario & ScenarioDeclaration;
/**
 * @since 0.3.16-canary.0
 */
export type AsyncBenchScenario = HarnessAsyncBenchScenario & ScenarioDeclaration;
/**
 * @since 0.3.16-canary.0
 */
export type AnyScenario = BenchScenario | AsyncBenchScenario;

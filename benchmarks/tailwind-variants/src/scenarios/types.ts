/** Scenario typing shared by every bench subprocess. */

import type { BenchScenario as HarnessBenchScenario } from "@internal/benchmark-harness/child/bench-scenario";

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
  | "define-only"
  | "first-render";

/**
 * @since 0.3.16-canary.0
 */
export type BenchScenario = HarnessBenchScenario & { readonly group: ScenarioGroup };

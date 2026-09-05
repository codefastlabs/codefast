/** Scenario typing shared by the three bench subprocesses. */

import type { BenchScenario as HarnessBenchScenario } from "@codefast/benchmark-harness/child/bench-scenario";

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
  | "first-render"
  | "uncached";

/**
 * @since 0.3.16-canary.0
 */
export type BenchScenario = HarnessBenchScenario & { readonly group: ScenarioGroup };

/**
 * Shared scenario typing for @codefast/tailwind-variants, tailwind-variants (npm),
 * and class-variance-authority bench subprocesses.
 *
 * Matching `id` values align rows in each two-way comparison report.
 */

import type {
  AsyncBenchScenario as HarnessAsyncBenchScenario,
  BenchScenario as HarnessBenchScenario,
} from "@codefast/benchmark-harness";
export { isAsyncScenario } from "@codefast/benchmark-harness";

export type ScenarioGroup =
  | "simple"
  | "complex"
  | "slots"
  | "compound-slots"
  | "extends"
  | "create-tv"
  | "extreme"
  | "extreme-slots";

export type BenchScenario = HarnessBenchScenario & { readonly group: ScenarioGroup };
export type AsyncBenchScenario = HarnessAsyncBenchScenario & { readonly group: ScenarioGroup };
export type AnyScenario = BenchScenario | AsyncBenchScenario;

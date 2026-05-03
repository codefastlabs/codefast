/**
 * Shared scenario typing for @codefast/tailwind-variants, tailwind-variants (npm),
 * and class-variance-authority bench subprocesses.
 *
 * Matching `id` values align rows in each two-way comparison report.
 */

export type ScenarioGroup =
  | "simple"
  | "complex"
  | "slots"
  | "compound-slots"
  | "extends"
  | "create-tv"
  | "extreme"
  | "extreme-slots";

export interface BenchScenario {
  readonly id: string;
  readonly what: string;
  readonly group: ScenarioGroup;
  readonly batch?: number;
  readonly stress?: boolean;
  readonly sanity?: () => boolean | Promise<boolean>;
  readonly build: () => () => void;
}

export interface AsyncBenchScenario extends Omit<BenchScenario, "build"> {
  readonly kind: "async";
  readonly build: () => () => Promise<void>;
}

export type AnyScenario = BenchScenario | AsyncBenchScenario;

export function isAsyncScenario(scenario: AnyScenario): scenario is AsyncBenchScenario {
  return (scenario as AsyncBenchScenario).kind === "async";
}

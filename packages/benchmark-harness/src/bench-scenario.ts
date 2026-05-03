/**
 * Minimal scenario shape shared by benchmark subprocess runners.
 * Domain packages narrow `group` via intersection types in their own `types.ts`.
 */

export interface BenchScenario {
  readonly id: string;
  readonly what: string;
  readonly group: string;
  readonly batch?: number;
  readonly stress?: boolean;
  readonly sanity?: () => boolean | Promise<boolean>;
  readonly build: () => () => void;
}

export interface AsyncBenchScenario extends Omit<BenchScenario, "build"> {
  readonly kind: "async";
  readonly build: () => () => Promise<void>;
}

export type AnyBenchScenario = BenchScenario | AsyncBenchScenario;

export function isAsyncScenario(scenario: AnyBenchScenario): scenario is AsyncBenchScenario {
  return (scenario as AsyncBenchScenario).kind === "async";
}

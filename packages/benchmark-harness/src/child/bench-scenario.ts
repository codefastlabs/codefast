/**
 * Minimal scenario shape shared by benchmark subprocess runners.
 * Domain packages narrow `group` via intersection types in their own `types.ts`.
 *
 * @since 0.3.16-canary.0
 */

export interface BenchScenario {
  readonly kind?: never;
  readonly id: string;
  readonly what: string;
  readonly group: string;
  readonly batch?: number;
  readonly stress?: boolean;
  readonly sanity?: () => boolean | Promise<boolean>;
  readonly build: () => () => void;
}

/**
 * @since 0.3.16-canary.0
 */
export interface AsyncBenchScenario extends Omit<BenchScenario, "kind" | "build"> {
  readonly kind: "async";
  readonly build: () => () => Promise<void>;
}

/**
 * @since 0.3.16-canary.0
 */
export type AnyBenchScenario = BenchScenario | AsyncBenchScenario;

/**
 * @since 0.3.16-canary.0
 */
export function isAsyncScenario(scenario: AnyBenchScenario): scenario is AsyncBenchScenario {
  return scenario.kind === "async";
}

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
  /** Cross-cutting library features this scenario exercises, declared where the scenario is defined. */
  readonly facets?: ReadonlyArray<string>;
  readonly batch?: number;
  readonly stress?: boolean;
  /** Render the row but keep it out of median/geomean aggregates — for rows whose sides do incomparable work. */
  readonly excludeFromAggregates?: boolean;
  readonly sanity?: () => boolean | Promise<boolean>;
  readonly build: () => () => void;
}

/**
 * Scenario variant whose built operation is awaited on every iteration.
 *
 * @since 0.3.16-canary.0
 */
export interface AsyncBenchScenario extends Omit<BenchScenario, "kind" | "build"> {
  readonly kind: "async";
  readonly build: () => () => Promise<void>;
}

/**
 * Union of the sync and async scenario shapes.
 *
 * @since 0.3.16-canary.0
 */
export type AnyBenchScenario = BenchScenario | AsyncBenchScenario;

/**
 * Narrows a scenario to {@link AsyncBenchScenario}.
 *
 * @since 0.3.16-canary.0
 */
export function isAsyncScenario(scenario: AnyBenchScenario): scenario is AsyncBenchScenario {
  return scenario.kind === "async";
}

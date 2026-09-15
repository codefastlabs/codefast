/**
 * Minimal scenario shape shared by benchmark subprocess runners.
 * Domain packages narrow `group` via intersection types in their own `types.ts`.
 *
 * @since 0.3.16-canary.0
 */

/**
 * Which comparison a scenario belongs to.
 *
 * @remarks A `contract` row measures public API and compares libraries; an `engine` row measures one
 * library's internals, never enters a cross-library aggregate, and is deleted with the engine it names.
 *
 * @since 0.9.0
 */
export type BenchScenarioTier = "contract" | "engine";

/**
 * The tier a scenario that declares none belongs to.
 *
 * @since 0.9.0
 */
export const DEFAULT_BENCH_SCENARIO_TIER: BenchScenarioTier = "contract";

/**
 * @since 0.9.0
 */
export interface BenchScenario {
  readonly kind?: never;
  readonly id: string;
  readonly what: string;
  readonly group: string;
  /** Which comparison the row belongs to; a suite that declares none has only contract rows. */
  readonly tier?: BenchScenarioTier | undefined;
  /** Features of the library's public API the row needs, in the suite's own vocabulary. */
  readonly requires?: ReadonlyArray<string> | undefined;
  /** Cross-cutting library features this scenario exercises, declared where the scenario is defined. */
  readonly facets?: ReadonlyArray<string>;
  /**
   * The id of the baseline scenario this one's intra-library ratio is measured against — e.g. the
   * without-merge row a with-merge row prices itself against.
   */
  readonly comparesWithin?: string;
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

/**
 * Resolves the tier a scenario belongs to, defaulting one that declares none.
 *
 * @since 0.9.0
 */
export function tierOfScenario(scenario: Pick<AnyBenchScenario, "tier">): BenchScenarioTier {
  return scenario.tier ?? DEFAULT_BENCH_SCENARIO_TIER;
}

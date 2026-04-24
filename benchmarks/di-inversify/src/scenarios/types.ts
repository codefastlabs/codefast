/**
 * Shared scenario typing for both codefast and inversify harnesses.
 *
 * A scenario module exports two parallel arrays of scenarios — one per library —
 * with matching `id`s for every head-to-head row. Pairwise matching IDs are what
 * lets the reporter align them in the comparison table; an `id` may appear on
 * only one side when a scenario is intentionally library-specific.
 */

/**
 * Grouping used by the reporter to label scenarios in the comparison table.
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
  | "failure";

/**
 * A scenario builder produces the closure tinybench will measure. The closure
 * may internally batch multiple logical operations per invocation (see
 * `batched()` helper); `batch` records the factor so the reporter can
 * normalise throughput back to operations/second.
 */
export interface BenchScenario {
  /** Stable ID; matches the other library for paired rows; may be codefast-only, etc. */
  readonly id: string;
  /** Human-oriented description used in README and JSONL export. */
  readonly what: string;
  /** Reporter grouping. */
  readonly group: ScenarioGroup;
  /**
   * How many logical operations each bench-closure invocation performs.
   * Used for sub-μs paths where tinybench's timer resolution would otherwise
   * dominate. Default 1 (closure = one logical operation).
   */
  readonly batch?: number;
  /** Reserved marker for optional non-headline probes. */
  readonly stress?: boolean;
  /**
   * Optional sanity check — run once before tinybench takes the closure.
   * Must return true, or the scenario fails loudly before measurement.
   */
  readonly sanity?: () => boolean | Promise<boolean>;
  /**
   * Builds the closure to measure. Called once per scenario per bench run.
   * Anything expensive (registering bindings, constructing the graph) should
   * happen here, not inside the returned closure.
   */
  readonly build: () => () => void;
}

/**
 * Async variant: some scenarios (resolveAsync, dynamic-async chains) need
 * the bench closure to return a Promise. Kept as a separate type so
 * `build()` returning a sync closure is the default and cannot be confused
 * with an async one by accident.
 */
export interface AsyncBenchScenario extends Omit<BenchScenario, "build"> {
  readonly kind: "async";
  readonly build: () => () => Promise<void>;
}

export type AnyScenario = BenchScenario | AsyncBenchScenario;

/**
 * A scenario module exports one list per library. Parallel arrays keep
 * the IDs in lock-step for the usual head-to-head case. The comparison reporter
 * includes every `id` that appears in **either** library: if a scenario exists on
 * only one side, that row still appears with the missing side formatted as 0/“—”
 * (e.g. codefast-only `realistic-graph-validate`); the reporter does **not** drop
 * the row.
 */
export interface ScenarioModule {
  readonly codefast: readonly AnyScenario[];
  readonly inversify: readonly AnyScenario[];
}

/**
 * True when the scenario expects an async closure. The parent harness needs
 * this to decide whether to pass `benchmark.add(name, asyncFn)` (tinybench
 * accepts both but reports differently).
 */
export function isAsyncScenario(scenario: AnyScenario): scenario is AsyncBenchScenario {
  return (scenario as AsyncBenchScenario).kind === "async";
}

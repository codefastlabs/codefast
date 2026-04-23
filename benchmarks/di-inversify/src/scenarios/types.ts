/**
 * Shared scenario typing for both codefast and inversify harnesses.
 *
 * A scenario module exports two parallel arrays of scenarios — one per library —
 * with matching `id`s. Matching IDs are what lets the reporter put them
 * side-by-side in the comparison table.
 */

/**
 * Grouping used by the reporter to decide which block of the table a scenario
 * appears in and how to label it. `diagnostic` and `stress` are emitted into
 * their own subsection so readers do not compare them against the main table.
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
  | "diagnostic";

/**
 * A scenario builder produces the closure tinybench will measure. The closure
 * may internally batch multiple logical operations per invocation (see
 * `batched()` helper); `batch` records the factor so the reporter can
 * normalise throughput back to operations/second.
 */
export interface BenchScenario {
  /** Stable ID, must match between codefast and inversify variants. */
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
  /**
   * When true, reporter labels this row as a stress test and excludes it
   * from the main comparison block.
   */
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
 * the IDs in lock-step; the reporter will refuse to compare rows if an ID
 * appears on only one side.
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

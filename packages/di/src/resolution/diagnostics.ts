/**
 * Internal seam letting tests assert that an optimization is *active*, not merely that the result
 * is correct.
 *
 * @remarks Timing belongs in the benchmark, which needs a quiet machine and twenty minutes; these
 * are structural counts, so CI can hold the invariants that make the benchmark fast. Reached
 * through a symbol from a module the package does not publish, so it is not public API.
 */

/**
 * Key for the diagnostics accessor on a container.
 *
 * @remarks A symbol rather than a method name, so it cannot collide with the public surface or be
 * reached by anyone who has not imported this module.
 */
export const RESOLUTION_DIAGNOSTICS: unique symbol = Symbol("di:resolution-diagnostics");

/**
 * Structural facts about a container's resolution caches.
 */
export interface ResolutionDiagnostics {
  /** Bindings with a compiled instantiation plan. */
  readonly compiledPlanCount: number;
  /** Contexts held by the depth-indexed sync pool. */
  readonly syncContextPoolSize: number;
  /** Contexts returned to the async chain pool and available for reuse. */
  readonly asyncContextPoolSize: number;
  /** Deferred collaborators this container has had to build. */
  readonly builtSubsystems: ReadonlyArray<string>;
}

/**
 * A container that can report on its resolution caches.
 */
export interface DiagnosableContainer {
  [RESOLUTION_DIAGNOSTICS](): ResolutionDiagnostics;
}

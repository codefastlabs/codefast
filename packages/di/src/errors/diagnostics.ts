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
 *
 * @since 0.5.0-canary.8
 */
export const RESOLUTION_DIAGNOSTICS: unique symbol = Symbol("di:resolution-diagnostics");

/**
 * Structural facts about a container's resolution caches.
 *
 * @since 0.5.0-canary.8
 */
export interface ResolutionDiagnostics {
  /** Bindings with a compiled instantiation plan. */
  readonly compiledPlanCount: number;
  /** Contexts held by the depth-indexed sync pool. */
  readonly syncContextPoolSize: number;
  /** Scoped instances currently cached by this container's scope manager. */
  readonly scopedInstanceCount: number;
  /** Deferred collaborators this container has had to build. */
  readonly builtSubsystems: ReadonlyArray<string>;
}

/**
 * A container that can report on its resolution caches.
 *
 * @since 0.5.0-canary.8
 */
export interface DiagnosableContainer {
  [RESOLUTION_DIAGNOSTICS](): ResolutionDiagnostics;
}

/**
 * The process-wide counter every container mutation advances, so a chain walk can be skipped while nothing moved.
 */

let epoch = 0;

/**
 * The current state epoch: unchanged between two reads exactly when no registry or lifecycle table
 * in the process was mutated in between.
 *
 * @since 0.10.0
 */
export function stateEpoch(): number {
  return epoch;
}

/**
 * Advances the epoch; every registry version bump and every activation-hook registration calls it.
 *
 * @since 0.10.0
 */
export function advanceStateEpoch(): void {
  epoch += 1;
}

/**
 * The container-disposal counter, held in a cell so a hot reader dereferences a field rather than
 * paying a cross-module call — apart from {@link stateEpoch} so a per-request child's `dispose()`
 * does not invalidate the chain-version memo that keeps deep resolves cheap. A child compares it to
 * learn whether an ancestor was disposed, re-walking the chain only after a disposal somewhere.
 */
export const disposeEpochRef: { value: number } = { value: 0 };

/**
 * Advances the dispose epoch; a container's teardown calls it so descendants re-check the chain.
 */
export function advanceDisposeEpoch(): void {
  disposeEpochRef.value += 1;
}

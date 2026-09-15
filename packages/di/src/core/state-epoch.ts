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

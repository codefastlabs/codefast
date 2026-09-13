/**
 * The process-wide counter every container mutation advances, so a chain walk can be skipped while nothing moved.
 */

let epoch = 0;

/**
 * The current state epoch: unchanged between two reads exactly when no registry or lifecycle table
 * in the process was mutated in between.
 */
export function stateEpoch(): number {
  return epoch;
}

/** Advances the epoch; every registry version bump and every activation-hook registration calls it. */
export function advanceStateEpoch(): void {
  epoch += 1;
}

/** Marks report rows whose ratio does not reproduce between runs, so the caveat travels with the number. */

/**
 * Throughput above which a single row's ratio moves between runs of the same build.
 *
 * @remarks
 * A per-row IQR measures spread within one run and cannot see this, so it must not be
 * read as a confidence signal on its own. See `benchmarks/di-inversify/RESULTS.md`.
 */
export const THROUGHPUT_NOISE_CEILING_HZ_PER_OP = 30_000_000;

/** Appended to a rendered ratio the report cannot vouch for. */
export const UNRELIABLE_RATIO_MARKER = "†";

/** Whether a measured throughput sits above the ceiling where per-row ratios stop reproducing. */
export function isThroughputAboveNoiseCeiling(hzPerOp: number): boolean {
  return Number.isFinite(hzPerOp) && hzPerOp > THROUGHPUT_NOISE_CEILING_HZ_PER_OP;
}

/**
 * Whether a ratio between two throughputs is unreliable — true when either side is above the ceiling.
 *
 * @remarks
 * A missing side means there is no ratio to qualify, so it is never flagged. Keeping that rule
 * here rather than at each call site is what stops the markers and their count from disagreeing.
 */
export function isRatioUnreliable(leftHzPerOp: number, rightHzPerOp: number): boolean {
  if (leftHzPerOp <= 0 || rightHzPerOp <= 0) {
    return false;
  }
  return isThroughputAboveNoiseCeiling(leftHzPerOp) || isThroughputAboveNoiseCeiling(rightHzPerOp);
}

/** Appends the marker to an already-formatted ratio when that ratio is unreliable. */
export function markRatioReliability(formattedRatio: string, leftHzPerOp: number, rightHzPerOp: number): string {
  return isRatioUnreliable(leftHzPerOp, rightHzPerOp) ? `${formattedRatio}${UNRELIABLE_RATIO_MARKER}` : formattedRatio;
}

function formatCeilingShorthand(): string {
  return `${String(Math.round(THROUGHPUT_NOISE_CEILING_HZ_PER_OP / 1_000_000))}M`;
}

/**
 * The one-line caveat explaining the marker, for printing directly beneath a table.
 *
 * @param unreliableRowCount - how many rendered rows carry the marker; the line still returns when zero
 */
export function formatReliabilityCaveatLine(unreliableRowCount: number): string {
  return `${UNRELIABLE_RATIO_MARKER} ${String(unreliableRowCount)} row(s) above ~${formatCeilingShorthand()} ops/s: this ratio moves between runs of the same build, whatever its IQR says. Cite the aggregates, not the row.`;
}

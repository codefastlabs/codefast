/** Marks report cells the reader should not cite, so the caveat travels with the number. */

/**
 * Throughput above which a single row's ratio moves between runs of the same build.
 *
 * @remarks
 * A per-row IQR measures spread within one run and cannot see this, so it must not be
 * read as a confidence signal on its own. See `benchmarks/di-inversify/RESULTS.md`.
 *
 * @since 0.5.0-canary.9
 */
export const THROUGHPUT_NOISE_CEILING_HZ_PER_OP = 30_000_000;

/**
 * Per-trial IQR above which a median is unstable within its own run.
 *
 * @since 0.5.0-canary.9
 */
export const NOISY_IQR_FRACTION = 0.05;

/**
 * Appended to a rendered ratio the report cannot vouch for across runs.
 *
 * @since 0.5.0-canary.9
 */
export const UNRELIABLE_RATIO_MARKER = "†";

/**
 * Appended to a rendered cell whose median is unstable within its own run.
 *
 * @since 0.5.0-canary.9
 */
export const NOISY_IQR_MARKER = "‡";

/**
 * One side of a comparison: its median throughput and the per-trial spread behind that median.
 *
 * @since 0.5.0-canary.9
 */
export interface ThroughputQuality {
  readonly hzPerOp: number;
  readonly iqrFraction: number;
}

/**
 * Whether a measured throughput sits above the ceiling where per-row ratios stop reproducing.
 *
 * @since 0.5.0-canary.9
 */
export function isThroughputAboveNoiseCeiling(hzPerOp: number): boolean {
  return Number.isFinite(hzPerOp) && hzPerOp > THROUGHPUT_NOISE_CEILING_HZ_PER_OP;
}

/**
 * Whether a ratio between two throughputs is unreliable — true when either side is above the ceiling.
 *
 * @remarks
 * A missing side means there is no ratio to qualify, so it is never flagged. Keeping that rule
 * here rather than at each call site is what stops the markers and their count from disagreeing.
 *
 * @since 0.5.0-canary.9
 */
export function isRatioUnreliable(leftHzPerOp: number, rightHzPerOp: number): boolean {
  if (leftHzPerOp <= 0 || rightHzPerOp <= 0) {
    return false;
  }
  return isThroughputAboveNoiseCeiling(leftHzPerOp) || isThroughputAboveNoiseCeiling(rightHzPerOp);
}

/**
 * Whether a per-trial IQR is wide enough that the median it summarizes is unstable.
 *
 * @since 0.5.0-canary.9
 */
export function isIqrNoisy(iqrFraction: number): boolean {
  return Number.isFinite(iqrFraction) && iqrFraction > NOISY_IQR_FRACTION;
}

/**
 * Whether a throughput cell carries an unstable median; a missing measurement never is.
 *
 * @since 0.5.0-canary.9
 */
export function isThroughputCellNoisy(sample: ThroughputQuality): boolean {
  return sample.hzPerOp > 0 && isIqrNoisy(sample.iqrFraction);
}

/**
 * Whether a ratio inherits an unstable median from either side; a missing side is never flagged.
 *
 * @since 0.5.0-canary.9
 */
export function isRatioNoisy(left: ThroughputQuality, right: ThroughputQuality): boolean {
  if (left.hzPerOp <= 0 || right.hzPerOp <= 0) {
    return false;
  }
  return isIqrNoisy(left.iqrFraction) || isIqrNoisy(right.iqrFraction);
}

/**
 * Appends the noise marker to an already-formatted throughput when its median is unstable.
 *
 * @since 0.5.0-canary.9
 */
export function markThroughputQuality(formattedThroughput: string, sample: ThroughputQuality): string {
  return isThroughputCellNoisy(sample) ? `${formattedThroughput}${NOISY_IQR_MARKER}` : formattedThroughput;
}

/**
 * Appends every marker an already-formatted ratio has earned, in footnote order.
 *
 * @since 0.5.0-canary.9
 */
export function markRatioQuality(formattedRatio: string, left: ThroughputQuality, right: ThroughputQuality): string {
  const unreliable = isRatioUnreliable(left.hzPerOp, right.hzPerOp) ? UNRELIABLE_RATIO_MARKER : "";
  const noisy = isRatioNoisy(left, right) ? NOISY_IQR_MARKER : "";
  return `${formattedRatio}${unreliable}${noisy}`;
}

function formatCeilingShorthand(): string {
  return `${String(Math.round(THROUGHPUT_NOISE_CEILING_HZ_PER_OP / 1_000_000))}M`;
}

/**
 * The one-line caveat explaining the unreliable marker, for printing directly beneath a table.
 *
 * @param unreliableRowCount - how many rendered cells carry the marker; the line still returns when zero
 *
 * @since 0.5.0-canary.9
 */
export function formatReliabilityCaveatLine(unreliableRowCount: number): string {
  return `${UNRELIABLE_RATIO_MARKER} ${String(unreliableRowCount)} row(s) above ~${formatCeilingShorthand()} ops/s: this ratio moves between runs of the same build, whatever its IQR says. Cite the aggregates, not the row.`;
}

/**
 * The one-line caveat explaining the noise marker.
 *
 * @param noisyCellCount - how many rendered cells carry the marker; the line still returns when zero
 *
 * @since 0.5.0-canary.9
 */
export function formatNoisyIqrCaveatLine(noisyCellCount: number): string {
  return `${NOISY_IQR_MARKER} ${String(noisyCellCount)} cell(s) whose per-trial IQR exceeds ${String(Math.round(NOISY_IQR_FRACTION * 100))}%: the median is unstable within this run. Re-run on a quieter machine before reading the cell closely.`;
}

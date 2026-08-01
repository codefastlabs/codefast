/**
 * A multiple of 1, dropping a decimal past 10 so a fail-fast outlier stays one column wide.
 * Em-dash when there is no meaningful multiple.
 *
 * @since 0.5.0-canary.9
 */
export function formatRatioMultiple(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return "—";
  }
  return `${ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2)}×`;
}

/**
 * Em-dash when the throughput ratio is undefined or meaningless.
 *
 * @since 0.3.16-canary.0
 */
export function formatThroughputRatio(numeratorHz: number, denominatorHz: number): string {
  if (denominatorHz <= 0 || numeratorHz <= 0) {
    return "—";
  }
  return formatRatioMultiple(numeratorHz / denominatorHz);
}

/**
 * Displays rounded ops/s; em-dash when non-positive throughput.
 *
 * @since 0.3.16-canary.0
 */
export function formatThroughputOpsPerSecond(hzPerOpOrIteration: number): string {
  if (hzPerOpOrIteration <= 0) {
    return "—";
  }
  return Math.round(hzPerOpOrIteration).toLocaleString("en-US");
}

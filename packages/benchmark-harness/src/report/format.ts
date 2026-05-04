/**
 * Em-dash when the throughput ratio is undefined or meaningless.
 *
 * @since 0.3.16-canary.0
 */
export function formatThroughputRatio(numeratorHz: number, denominatorHz: number): string {
  if (denominatorHz <= 0 || numeratorHz <= 0) {
    return "—";
  }
  return `${(numeratorHz / denominatorHz).toFixed(2)}×`;
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

/**
 * Formats latency mean(ms) tinybench-derived values for tables.
 *
 * @since 0.3.16-canary.0
 */
export function formatLatencyMeanMilliseconds(ms: number): string {
  if (ms <= 0) {
    return "—";
  }
  return ms.toFixed(4);
}

/**
 * @since 0.3.16-canary.0
 */
export function formatIqrThroughputFraction(iqr: number): string {
  if (!Number.isFinite(iqr) || iqr <= 0) {
    return "—";
  }
  return `${(iqr * 100).toFixed(1)}%`;
}

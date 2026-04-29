/**
 * Matches NumPy’s default (`linear`) so external tooling agrees with reporter output.
 */

export function sortAscending(values: readonly number[]): number[] {
  return [...values].sort((left, right) => left - right);
}

/**
 * Linear-interpolation quantile. `quantileProbability` ∈ [0, 1].
 * Returns `0` for empty input (callers aggregate before meaningless quantiles otherwise).
 */
export function quantile(sortedValues: readonly number[], quantileProbability: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  if (sortedValues.length === 1) {
    return sortedValues[0] ?? 0;
  }
  const position = quantileProbability * (sortedValues.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sortedValues[lowerIndex] ?? 0;
  const upper = sortedValues[upperIndex] ?? 0;
  if (lowerIndex === upperIndex) {
    return lower;
  }
  const fraction = position - lowerIndex;
  return lower + (upper - lower) * fraction;
}

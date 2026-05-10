export function medianNumeric(values: Array<number | null | undefined>): number | null {
  const sorted = values
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);
  if (sorted.length === 0) {
    return null;
  }
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function ratioFrom(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  return typeof a === "number" && typeof b === "number" && a > 0 && b > 0 ? a / b : null;
}

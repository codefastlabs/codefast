/**
 * The scroll-spy decision: which anchor a list of section targets should report as the reader's location.
 */

/**
 * The anchor to highlight for `targets`, given the ones intersecting the observation band and where the
 * band starts. Prefers the topmost target inside the band — the innermost when one wraps another — then
 * the last target scrolled above the band, then the first target, so a page always has a location.
 */
export function resolveActiveAnchor(
  targets: ReadonlyArray<Element>,
  inBand: ReadonlySet<Element>,
  bandTop: number,
): string | null {
  const visible = targets.filter((target) => inBand.has(target));
  const innermost = visible.filter((target) => !visible.some((other) => other !== target && target.contains(other)));
  const topmost = innermost.toSorted((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];

  if (topmost) {
    return topmost.id;
  }

  const above = targets.filter((target) => target.getBoundingClientRect().top < bandTop);

  return (above.at(-1) ?? targets[0])?.id ?? null;
}

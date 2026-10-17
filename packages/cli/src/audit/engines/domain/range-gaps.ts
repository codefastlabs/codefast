/** Finds the Node releases at or above a floor that an `engines.node` range leaves out. */

import type { Comparator } from "semver";
import { compare, Range, SemVer, validRange } from "semver";

import type { NodeVersion } from "#audit/engines/domain/node-floor";
import { formatNodeVersion } from "#audit/engines/domain/node-floor";

type Bound = { readonly version: SemVer; readonly inclusive: boolean };

// `null` is unbounded on that side.
type Interval = { readonly lower: Bound | null; readonly upper: Bound | null };

/**
 * Lists the odd majors between the floor's and the newest tested one, which reach end-of-life without becoming LTS.
 *
 * @remarks The floor's own line and every line from the newest tested major up stay judged, since a package still
 * claims those; with no newest release known, every line does.
 *
 * @since 0.15.0
 */
export function shortLivedMajors(floor: NodeVersion, newest: NodeVersion | null): Array<number> {
  const majors: Array<number> = [];
  for (let major = floor[0] + 1; newest !== null && major < newest[0]; major++) {
    if (major % 2 === 1) {
      majors.push(major);
    }
  }
  return majors;
}

/**
 * Lists the sub-ranges of `>=floor` that `range` does not admit, each written as a semver range, or returns `null` when
 * no semver parser reads `range`.
 *
 * @remarks Releases on the `unjudged` majors never count as left out. Node publishes no prereleases on a release line,
 * so a prerelease bound such as the `<23.0.0-0` a caret expands to is read as the release it precedes.
 *
 * @since 0.15.0
 */
export function uncoveredNodeRanges(
  floor: NodeVersion,
  range: string,
  unjudged: ReadonlyArray<number> = [],
): Array<string> | null {
  if (validRange(range) === null) {
    return null;
  }
  const covered = mergeIntervals([
    ...new Range(range).set.flatMap((comparators) => intervalOf(comparators) ?? []),
    ...unjudged.map((major) => ({
      lower: { version: new SemVer(`${major}.0.0`), inclusive: true },
      upper: { version: new SemVer(`${major + 1}.0.0`), inclusive: false },
    })),
  ]);

  const gaps: Array<string> = [];
  let cursor: Bound | null = { version: new SemVer(formatNodeVersion(floor)), inclusive: true };
  for (const interval of covered) {
    if (cursor === null) {
      break;
    }
    if (interval.upper !== null && compareUpperToLower(interval.upper, cursor) < 0) {
      continue;
    }
    if (interval.lower !== null && compareLowers(interval.lower, cursor) > 0) {
      gaps.push(formatInterval({ lower: cursor, upper: flip(interval.lower) }));
    }
    cursor = interval.upper === null ? null : flip(interval.upper);
  }
  if (cursor !== null) {
    gaps.push(formatInterval({ lower: cursor, upper: null }));
  }
  return gaps;
}

// The one interval a comparator set admits, or `null` when its bounds cross.
function intervalOf(comparators: ReadonlyArray<Comparator>): Interval | null {
  let lower: Bound | null = null;
  let upper: Bound | null = null;
  for (const comparator of comparators) {
    if (comparator.value === "") {
      continue;
    }
    const prerelease = comparator.semver.prerelease.length > 0;
    const version = new SemVer(`${comparator.semver.major}.${comparator.semver.minor}.${comparator.semver.patch}`);
    const { operator } = comparator;
    if (operator === "" || operator === "=" || operator === ">=" || operator === ">") {
      const bound = { version, inclusive: prerelease || operator !== ">" };
      lower = lower === null || compareLowers(bound, lower) > 0 ? bound : lower;
    }
    if (operator === "" || operator === "=" || operator === "<=" || operator === "<") {
      const bound = { version, inclusive: !prerelease && operator !== "<" };
      upper = upper === null || compareUppers(bound, upper) < 0 ? bound : upper;
    }
  }
  if (lower !== null && upper !== null && compareUpperToLower(upper, lower) < 0) {
    return null;
  }
  return { lower, upper };
}

// The union of the intervals, sorted and with every overlapping or touching pair joined.
function mergeIntervals(intervals: ReadonlyArray<Interval>): Array<Interval> {
  const sorted = intervals.toSorted((left, right) => {
    if (left.lower === null || right.lower === null) {
      return left.lower === right.lower ? 0 : left.lower === null ? -1 : 1;
    }
    return compareLowers(left.lower, right.lower);
  });
  const merged: Array<Interval> = [];
  for (const interval of sorted) {
    const last = merged.at(-1);
    if (last === undefined || (last.upper !== null && compareUpperToLower(last.upper, interval.lower) < 0)) {
      merged.push(interval);
      continue;
    }
    const upper =
      last.upper === null || interval.upper === null
        ? null
        : compareUppers(interval.upper, last.upper) > 0
          ? interval.upper
          : last.upper;
    merged[merged.length - 1] = { lower: last.lower, upper };
  }
  return merged;
}

function compareLowers(left: Bound, right: Bound): number {
  return compare(left.version, right.version) || Number(right.inclusive) - Number(left.inclusive);
}

function compareUppers(left: Bound, right: Bound): number {
  return compare(left.version, right.version) || Number(left.inclusive) - Number(right.inclusive);
}

// Negative when a version sits strictly between the upper bound and the lower bound, so nothing joins them.
function compareUpperToLower(upper: Bound, lower: Bound | null): number {
  if (lower === null) {
    return 1;
  }
  const order = compare(upper.version, lower.version);
  return order !== 0 ? order : upper.inclusive || lower.inclusive ? 0 : -1;
}

// The bound that starts where this one ends, on the other side of it.
function flip(bound: Bound): Bound {
  return { version: bound.version, inclusive: !bound.inclusive };
}

function formatInterval({ lower, upper }: Interval): string {
  const parts: Array<string> = [];
  if (lower !== null) {
    parts.push(`${lower.inclusive ? ">=" : ">"}${lower.version.version}`);
  }
  if (upper !== null) {
    parts.push(`${upper.inclusive ? "<=" : "<"}${upper.version.version}`);
  }
  return parts.join(" ");
}

/** Parses and orders the Node versions an `engines.node` floor and a resolved `@types/node` name. */

/**
 * A Node release as its major, minor and patch numbers.
 */
export type NodeVersion = readonly [major: number, minor: number, patch: number];

const floorPattern = /^>=\s*(\d+)\.(\d+)\.(\d+)$/;

const versionPattern = /^(\d+)\.(\d+)\.(\d+)/;

/**
 * Parses an `engines.node` range written as `>=X.Y.Z`, or returns `null` for any other form.
 *
 * @remarks A floor is the one bound a package promises, so a range with an upper bound or a wildcard is refused
 * rather than approximated.
 */
export function parseNodeFloor(range: string): NodeVersion | null {
  const match = floorPattern.exec(range.trim());
  return match === null ? null : [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Parses a resolved version such as `24.0.15`, ignoring any peer suffix the lockfile appends, or returns `null`.
 */
export function parseNodeVersion(version: string): NodeVersion | null {
  const match = versionPattern.exec(version.trim());
  return match === null ? null : [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Orders two versions: negative when `left` is older, positive when newer, zero when equal.
 */
export function compareNodeVersions(left: NodeVersion, right: NodeVersion): number {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

/**
 * Whether a version sits on the floor's release line — the same major and minor.
 */
export function isOnReleaseLine(version: NodeVersion, floor: NodeVersion): boolean {
  return version[0] === floor[0] && version[1] === floor[1];
}

/**
 * Formats a version as `X.Y.Z`.
 */
export function formatNodeVersion(version: NodeVersion): string {
  return version.join(".");
}

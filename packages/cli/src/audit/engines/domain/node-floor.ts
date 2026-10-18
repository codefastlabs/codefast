/** Parses and compares the Node versions an `engines.node` floor and a resolved `@types/node` name. */

/**
 * A Node release as its major, minor and patch numbers.
 *
 * @since 0.15.0
 */
export type NodeVersion = readonly [major: number, minor: number, patch: number];

const floorPattern = /^>=\s*(\d+)\.(\d+)\.(\d+)$/;

const versionPattern = /^(\d+)\.(\d+)\.(\d+)/;

/**
 * Parses an `engines.node` range written as `>=X.Y.Z`, or returns `null` for any other form.
 *
 * @remarks A floor is the one bound a package promises, so a range with an upper bound or a wildcard is refused
 * rather than approximated.
 *
 * @since 0.15.0
 */
export function parseNodeFloor(range: string): NodeVersion | null {
  const match = floorPattern.exec(range.trim());
  return match === null ? null : [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Parses a resolved version such as `24.0.15`, ignoring any peer suffix the lockfile appends, or returns `null`.
 *
 * @since 0.15.0
 */
export function parseNodeVersion(version: string): NodeVersion | null {
  const match = versionPattern.exec(version.trim());
  return match === null ? null : [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Whether `@types/node` at this version declares nothing the floor lacks — the floor's major, at a minor no newer.
 *
 * @since 0.15.0
 */
export function typesFitFloor(types: NodeVersion, floor: NodeVersion): boolean {
  return types[0] === floor[0] && types[1] <= floor[1];
}

/**
 * Formats a version as `X.Y.Z`.
 *
 * @since 0.15.0
 */
export function formatNodeVersion(version: NodeVersion): string {
  return version.join(".");
}

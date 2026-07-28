/** Cycle-detection bookkeeping carried on the resolution path itself. */
import { CircularDependencyError } from "#/errors";

const RESOLUTION_SET_KEY: unique symbol = Symbol("di:resolution-set");
/**
 * Where the cycle check switches from a linear `Array.includes` scan to an attached Set.
 *
 * @see `ARCHITECTURE.md` — the depth sweep this value comes from.
 *
 * @since 0.5.0-canary.7
 */
export const RESOLUTION_SET_THRESHOLD = 32;
type ResolutionPathWithSet = Array<string> & { [RESOLUTION_SET_KEY]?: Set<string> };

/**
 * Marks a token as in-flight on this path, throwing if it is already there.
 *
 * @remarks Unmark with `resolutionPath.pop()` plus `set?.delete(name)`, or {@link exitResolutionPath}.
 *
 * @returns the membership set once the path is deep enough to carry one, else `undefined`.
 *
 * @since 0.5.0-canary.7
 */
export function enterResolutionPath(resolutionPath: Array<string>, tokenDisplayName: string): Set<string> | undefined {
  const pathWithSet = resolutionPath as ResolutionPathWithSet;
  let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
  if (resolutionSet === undefined && resolutionPath.length >= RESOLUTION_SET_THRESHOLD) {
    resolutionSet = new Set<string>(resolutionPath);
    pathWithSet[RESOLUTION_SET_KEY] = resolutionSet;
  }
  if (resolutionSet === undefined ? resolutionPath.includes(tokenDisplayName) : resolutionSet.has(tokenDisplayName)) {
    throw new CircularDependencyError([...resolutionPath, tokenDisplayName]);
  }
  resolutionPath.push(tokenDisplayName);
  resolutionSet?.add(tokenDisplayName);
  return resolutionSet;
}

/**
 * Unwinds the innermost {@link enterResolutionPath} entry, for callers that hold only the path.
 *
 * @since 0.5.0-canary.7
 */
export function exitResolutionPath(resolutionPath: Array<string>): void {
  const tokenDisplayName = resolutionPath.pop();
  if (tokenDisplayName !== undefined) {
    (resolutionPath as ResolutionPathWithSet)[RESOLUTION_SET_KEY]?.delete(tokenDisplayName);
  }
}

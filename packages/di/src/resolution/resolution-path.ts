/**
 * Cycle-detection bookkeeping shared by every resolution path.
 *
 * The resolution path is a plain string array for cheap push/pop; past
 * RESOLUTION_SET_THRESHOLD entries an O(1) membership Set is attached to the
 * array itself (symbol-keyed) so deep graphs keep constant-time cycle checks.
 */
import { CircularDependencyError } from "#/errors";

const RESOLUTION_SET_KEY: unique symbol = Symbol("di:resolution-set");
export const RESOLUTION_SET_THRESHOLD = 32;
type ResolutionPathWithSet = Array<string> & { [RESOLUTION_SET_KEY]?: Set<string> };

/**
 * Shared cycle guard for every transient resolution path: attaches the O(1) membership
 * Set to the path array (lazily past RESOLUTION_SET_THRESHOLD, eagerly when `forceSet`),
 * throws on a repeated token, then marks the token on both structures.
 *
 * Callers unmark with `resolutionPath.pop()` + `set?.delete(name)` on unwind.
 */
export function enterResolutionPath(
  resolutionPath: Array<string>,
  tokenDisplayName: string,
  forceSet: true,
): Set<string>;
export function enterResolutionPath(
  resolutionPath: Array<string>,
  tokenDisplayName: string,
  forceSet: boolean,
): Set<string> | undefined;
export function enterResolutionPath(
  resolutionPath: Array<string>,
  tokenDisplayName: string,
  forceSet: boolean,
): Set<string> | undefined {
  const pathWithSet = resolutionPath as ResolutionPathWithSet;
  let resolutionSet = pathWithSet[RESOLUTION_SET_KEY];
  if (resolutionSet === undefined && (forceSet || resolutionPath.length >= RESOLUTION_SET_THRESHOLD)) {
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

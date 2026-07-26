/**
 * Cycle-detection bookkeeping shared by every resolution path.
 *
 * The resolution path is a plain string array for cheap push/pop; past
 * RESOLUTION_SET_THRESHOLD entries an O(1) membership Set is attached to the
 * array itself (symbol-keyed) so very deep graphs keep bounded cycle checks.
 */
import { CircularDependencyError } from "#/errors";

const RESOLUTION_SET_KEY: unique symbol = Symbol("di:resolution-set");
/**
 * Where the cycle check switches from a linear `Array.includes` scan to an attached Set.
 *
 * @remarks Re-measured on Node 26 / M3 Max over an async transient chain (ns/op at depth
 * 16 / 32 / 64 / 128): a threshold of 128 gives 1275 / 3641 / 9645 / 26082, of 32 gives
 * 1202 / 3285 / 7735 / 16837, of 16 gives 1299 / 3694 / 7449 / 15625. Switching at 32 wins
 * the shallow-to-mid depths real graphs actually have while staying close to the best deep
 * numbers; the previous value of 128 was the worst of the three almost everywhere.
 *
 * @since 0.5.0-canary.7
 */
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
/**
 * @since 0.5.0-canary.7
 */
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

/**
 * Unwinds the innermost `enterResolutionPath` entry, keeping the attached membership Set in
 * sync. Callers that already hold the entry's name can pop and delete directly; this exists for
 * unwind paths that only have the path array — notably the async chain's shared settle callback,
 * which serves every level and therefore cannot capture a per-level name.
 *
 * @since 0.5.0-canary.7
 */
export function exitResolutionPath(resolutionPath: Array<string>): void {
  const tokenDisplayName = resolutionPath.pop();
  if (tokenDisplayName !== undefined) {
    (resolutionPath as ResolutionPathWithSet)[RESOLUTION_SET_KEY]?.delete(tokenDisplayName);
  }
}

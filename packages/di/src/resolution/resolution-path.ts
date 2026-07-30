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
 * @remarks Unmark with `resolutionPath.pop()` plus `set?.delete(name)`. Sync only — the async lane
 * never removes an entry, so it extends a branch instead; see {@link extendResolutionBranch}.
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
 * Marks a branch as not yet owned by the async lane, so its first extension must copy.
 *
 * @see `ARCHITECTURE.md` — why an async branch may only ever append to an array it made itself.
 */
export const UNOWNED_BRANCH = -1;

/**
 * Extends one branch of an append-only path, throwing if the entry is already an ancestor.
 *
 * @remarks Appends in place while this branch still owns the next slot, and copies its own prefix
 * once a sibling has claimed it. Nothing is ever removed, so no async level has to observe its own
 * settlement to unwind — see `ARCHITECTURE.md`.
 *
 * @param branchDepth - how many leading entries belong to this branch, or {@link UNOWNED_BRANCH}
 */
export function extendResolutionBranch(
  resolutionPath: Array<string>,
  branchDepth: number,
  tokenDisplayName: string,
): Array<string> {
  const depth = branchDepth === UNOWNED_BRANCH ? resolutionPath.length : branchDepth;
  for (let index = 0; index < depth; index += 1) {
    if (resolutionPath[index] === tokenDisplayName) {
      throw new CircularDependencyError([...resolutionPath.slice(0, depth), tokenDisplayName]);
    }
  }
  // An unowned array belongs to a sync frame that will pop it, or carries a membership Set this
  // lane cannot keep true; copying is what makes the branch's own appends safe.
  if (branchDepth === resolutionPath.length) {
    resolutionPath.push(tokenDisplayName);
    return resolutionPath;
  }
  const branch = resolutionPath.slice(0, depth);
  branch.push(tokenDisplayName);
  return branch;
}

/** The stack half of {@link extendResolutionBranch}; frames carry no cycle to detect. */
export function extendResolutionStackBranch<Entry>(
  resolutionStack: Array<Entry>,
  branchDepth: number,
  frame: Entry,
): Array<Entry> {
  if (branchDepth === resolutionStack.length) {
    resolutionStack.push(frame);
    return resolutionStack;
  }
  const branch = resolutionStack.slice(0, branchDepth === UNOWNED_BRANCH ? resolutionStack.length : branchDepth);
  branch.push(frame);
  return branch;
}

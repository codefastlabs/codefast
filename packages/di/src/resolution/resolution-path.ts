/** Cycle-detection bookkeeping carried on the resolution path itself. */
import { CircularDependencyError } from "#/errors";
import type { ResolutionFrame } from "#/types";

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

declare const BRANCH_BRAND: unique symbol;

/**
 * A resolution path one async branch owns, so appending to it cannot disturb another branch.
 *
 * @remarks Only {@link extendResolutionBranch} mints one. That is what makes "may this lane append
 * to this array" a question the compiler answers instead of a rule in a doc — a sync frame's path,
 * which that frame will pop, is a plain `Array<string>` and cannot reach a level that owns its own.
 */
export type OwnedBranchPath = Array<string> & { readonly [BRANCH_BRAND]: true };

/** The stack half of {@link OwnedBranchPath}, minted only by {@link extendResolutionStackBranch}. */
export type OwnedBranchStack = Array<ResolutionFrame> & { readonly [BRANCH_BRAND]: true };

declare const BRANCH_DEPTH_BRAND: unique symbol;

/**
 * How many leading entries of a path belong to one async branch.
 *
 * @remarks Branded so a bare number cannot be passed: a depth from anywhere but this branch silently
 * re-parents a level.
 */
export type OwnedBranchDepth = number & { readonly [BRANCH_DEPTH_BRAND]: true };

/** A path no async branch owns yet, so its first extension must copy rather than append. */
export const UNOWNED_BRANCH = -1;

/**
 * How far into a path one extension may reach: this branch's own depth, or nobody's.
 *
 * @remarks A union rather than a sentinel hidden inside the branded number, so the two cases are
 * visible at every signature that takes one and `=== UNOWNED_BRANCH` narrows to the owned case.
 */
export type BranchDepth = OwnedBranchDepth | typeof UNOWNED_BRANCH;

/** The depth a chain's first level extends from, over an array its caller just minted. */
export const ROOT_BRANCH = 0 as OwnedBranchDepth;

/** A branch's own depth: the length its path had when this level took it. */
export function branchDepthOf(branch: OwnedBranchPath): OwnedBranchDepth {
  return branch.length as OwnedBranchDepth;
}

/**
 * Extends one branch of an append-only path, throwing if the entry is already an ancestor.
 *
 * @remarks Appends in place while this branch still owns the next slot, and copies its own prefix
 * once a sibling has claimed it. Nothing is ever removed, so no async level has to observe its own
 * settlement to unwind — see `ARCHITECTURE.md`.
 */
export function extendResolutionBranch(
  resolutionPath: Array<string>,
  branchDepth: BranchDepth,
  tokenDisplayName: string,
): OwnedBranchPath {
  const depth = branchDepth === UNOWNED_BRANCH ? resolutionPath.length : branchDepth;
  for (let index = 0; index < depth; index += 1) {
    if (resolutionPath[index] === tokenDisplayName) {
      throw new CircularDependencyError([...resolutionPath.slice(0, depth), tokenDisplayName]);
    }
  }
  // An unowned array belongs to a sync frame that will pop it, or carries a membership Set this
  // lane cannot keep true; copying is what makes the branch's own appends safe.
  if (branchDepth === resolutionPath.length) {
    // The sole mint: appending in place needs a depth that came from a branch already owned, or
    // ROOT_BRANCH over an array its caller minted for this chain alone.
    resolutionPath.push(tokenDisplayName);
    return resolutionPath as OwnedBranchPath;
  }
  const branch = resolutionPath.slice(0, depth);
  branch.push(tokenDisplayName);
  return branch as OwnedBranchPath;
}

/** The stack half of {@link extendResolutionBranch}; frames carry no cycle to detect. */
export function extendResolutionStackBranch(
  resolutionStack: Array<ResolutionFrame>,
  branchDepth: BranchDepth,
  frame: ResolutionFrame,
): OwnedBranchStack {
  if (branchDepth === resolutionStack.length) {
    resolutionStack.push(frame);
    return resolutionStack as OwnedBranchStack;
  }
  const branch = resolutionStack.slice(0, branchDepth === UNOWNED_BRANCH ? resolutionStack.length : branchDepth);
  branch.push(frame);
  return branch as OwnedBranchStack;
}

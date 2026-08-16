import type { BindingIdentifier, ResolutionFrame } from "#/core/types";
/** Cycle-detection bookkeeping carried on the resolution stack itself. */
import { CircularDependencyError } from "#/errors/errors";

const RESOLUTION_SET_KEY: unique symbol = Symbol("di:resolution-set");
/**
 * Where the cycle check switches from a linear frame scan to an attached Set.
 *
 * @remarks Measured rather than guessed: below this depth the linear scan wins, above it the Set does.
 *
 * @since 0.5.0-canary.7
 */
export const RESOLUTION_SET_THRESHOLD = 32;
type ResolutionStackWithSet = Array<ResolutionFrame> & { [RESOLUTION_SET_KEY]?: Set<BindingIdentifier> | undefined };

/** The token names along a stack plus the frame that closed the cycle — built only to throw. */
export function cycleNamesOf(resolutionStack: ReadonlyArray<ResolutionFrame>, closingName: string): Array<string> {
  const names = new Array<string>(resolutionStack.length + 1);
  for (let index = 0; index < resolutionStack.length; index += 1) {
    names[index] = resolutionStack[index]!.tokenName;
  }
  names[resolutionStack.length] = closingName;
  return names;
}

/**
 * Marks a level as in-flight on this stack, throwing if its binding is already an ancestor.
 *
 * @remarks The check keys on binding identity — two distinct tokens may share a display name — and
 * the names an error prints are derived from the frames at the throw site. Unmark by popping the
 * stack plus `set?.delete(frame.bindingId)`. Sync only — the async lane never removes an entry, so
 * it extends a branch instead; see {@link extendResolutionBranch}.
 *
 * @returns the membership set once the stack is deep enough to carry one, else `undefined`.
 *
 * @since 0.5.0-canary.7
 */
export function enterResolutionPath(
  resolutionStack: Array<ResolutionFrame>,
  frame: ResolutionFrame,
): Set<BindingIdentifier> | undefined {
  const stackWithSet = resolutionStack as ResolutionStackWithSet;
  let resolutionSet = stackWithSet[RESOLUTION_SET_KEY];
  // A live set mirrors the stack exactly, so a size that disagrees means it is holding ids of
  // frames that unwound: the ones already on the stack when it attached were handed no set to
  // delete from. Dropped rather than repaired, because the next deep frame rebuilds it.
  if (resolutionSet !== undefined && resolutionSet.size !== resolutionStack.length) {
    resolutionSet = undefined;
    stackWithSet[RESOLUTION_SET_KEY] = undefined;
  }
  if (resolutionSet === undefined && resolutionStack.length >= RESOLUTION_SET_THRESHOLD) {
    resolutionSet = new Set<BindingIdentifier>();
    for (let index = 0; index < resolutionStack.length; index += 1) {
      resolutionSet.add(resolutionStack[index]!.bindingId);
    }
    stackWithSet[RESOLUTION_SET_KEY] = resolutionSet;
  }
  if (resolutionSet === undefined) {
    for (let index = 0; index < resolutionStack.length; index += 1) {
      if (resolutionStack[index]!.bindingId === frame.bindingId) {
        throw new CircularDependencyError(cycleNamesOf(resolutionStack, frame.tokenName));
      }
    }
  } else if (resolutionSet.has(frame.bindingId)) {
    throw new CircularDependencyError(cycleNamesOf(resolutionStack, frame.tokenName));
  }
  resolutionStack.push(frame);
  resolutionSet?.add(frame.bindingId);
  return resolutionSet;
}

declare const BRANCH_BRAND: unique symbol;

/**
 * A resolution stack one async branch owns, so appending to it cannot disturb another branch.
 *
 * @remarks Only {@link extendResolutionBranch} mints one. That is what makes "may this lane append
 * to this array" a question the compiler answers instead of a rule in a doc — a sync frame's stack,
 * which that frame will pop, is a plain `Array<ResolutionFrame>` and cannot reach a level that owns
 * its own.
 *
 * @since 0.5.0-canary.9
 */
export type OwnedBranchStack = Array<ResolutionFrame> & { readonly [BRANCH_BRAND]: true };

declare const BRANCH_DEPTH_BRAND: unique symbol;

/**
 * How many leading entries of a stack belong to one async branch.
 *
 * @remarks Branded so a bare number cannot be passed: a depth from anywhere but this branch silently
 * re-parents a level.
 *
 * @since 0.5.0-canary.9
 */
export type OwnedBranchDepth = number & { readonly [BRANCH_DEPTH_BRAND]: true };

/**
 * A stack no async branch owns yet, so its first extension must copy rather than append.
 *
 * @since 0.5.0-canary.9
 */
export const UNOWNED_BRANCH = -1;

/**
 * How far into a stack one extension may reach: this branch's own depth, or nobody's.
 *
 * @remarks A union rather than a sentinel hidden inside the branded number, so the two cases are
 * visible at every signature that takes one and `=== UNOWNED_BRANCH` narrows to the owned case.
 *
 * @since 0.5.0-canary.9
 */
export type BranchDepth = OwnedBranchDepth | typeof UNOWNED_BRANCH;

/**
 * The depth a chain's first level extends from, over an array its caller just minted.
 *
 * @since 0.5.0-canary.9
 */
export const ROOT_BRANCH = 0 as OwnedBranchDepth;

/**
 * A branch's own depth: the length its stack had when this level took it.
 *
 * @since 0.5.0-canary.9
 */
export function branchDepthOf(branch: OwnedBranchStack): OwnedBranchDepth {
  return branch.length as OwnedBranchDepth;
}

/**
 * Extends one branch of an append-only stack, throwing if the binding is already an ancestor.
 *
 * @remarks The check compares binding ids on the frames; the names an error prints are derived at
 * the throw site. Appends in place while this branch still owns the next slot, and copies its own
 * prefix once a sibling has claimed it. Nothing is ever removed, so no async level has to observe
 * its own settlement to unwind.
 *
 * @since 0.5.0-canary.9
 */
export function extendResolutionBranch(
  resolutionStack: Array<ResolutionFrame>,
  branchDepth: BranchDepth,
  frame: ResolutionFrame,
): OwnedBranchStack {
  const depth = branchDepth === UNOWNED_BRANCH ? resolutionStack.length : branchDepth;
  for (let index = 0; index < depth; index += 1) {
    if (resolutionStack[index]!.bindingId === frame.bindingId) {
      throw new CircularDependencyError(cycleNamesOf(resolutionStack.slice(0, depth), frame.tokenName));
    }
  }
  // An unowned array belongs to a sync frame that will pop it, or carries a membership Set this
  // lane cannot keep true; copying is what makes the branch's own appends safe.
  if (branchDepth === resolutionStack.length) {
    // The sole mint: appending in place needs a depth that came from a branch already owned, or
    // ROOT_BRANCH over an array its caller minted for this chain alone.
    resolutionStack.push(frame);
    return resolutionStack as OwnedBranchStack;
  }
  const branch = resolutionStack.slice(0, depth);
  branch.push(frame);
  return branch as OwnedBranchStack;
}
